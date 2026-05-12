const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

const LOG_FILE_NAME = 'scenic-guide-interaction-logs.jsonl';

function normalizeText(value, fallback = '') {
  if (typeof value !== 'string') {
    return fallback;
  }
  const normalized = value.trim();
  return normalized || fallback;
}

function createLogId() {
  return crypto.randomBytes(16).toString('hex');
}

function createEmptyLog() {
  return {
    logId: '',
    timestamp: '',
    inputType: '',
    question: '',
    intent: '',
    sources: [],
    answer: '',
    latency: {
      asr: null,
      rag: null,
      llmFirstToken: null,
      llmComplete: null,
      ttsFirstAudio: null,
      complete: null,
    },
    rating: null,
    emotion: null,
    unmatched: false,
  };
}

function normalizeSourceRef(ref = {}) {
  const normalized = ref && typeof ref === 'object' ? ref : {};
  return {
    sourceId: normalizeText(normalized.sourceId),
    section: normalizeText(normalized.section),
    paragraphIndex: Number.isFinite(normalized.paragraphIndex) ? normalized.paragraphIndex : null,
    chapterIndex: Number.isFinite(normalized.chapterIndex) ? normalized.chapterIndex : null,
  };
}

function normalizeSources(hits = []) {
  return hits.map((hit) => {
    const sourceRefs = (Array.isArray(hit.sourceRefs) ? hit.sourceRefs : [])
      .map(normalizeSourceRef)
      .filter((ref) => ref.sourceId);
    return {
      blockId: normalizeText(hit.blockId),
      title: normalizeText(hit.title),
      excerpt: normalizeText(hit.excerpt || hit.text),
      file: normalizeText(sourceRefs[0]?.sourceId),
      spotId: normalizeText(hit.entityId),
      score: Number.isFinite(hit.score) ? hit.score : 0,
    };
  });
}

function detectIntent(question = '') {
  const normalized = normalizeText(question).toLowerCase();

  if (/路线|怎么走|游览|推荐|几个小时|多久|行程|安排/.test(normalized)) {
    return 'route_recommendation';
  }
  if (/门票|票价|多少钱|收费|开放时间|闭园|几点/.test(normalized)) {
    return 'practical_info';
  }
  if (/好玩|值得看|特色|亮点|推荐|风景|风景/.test(normalized)) {
    return 'spot_fact';
  }
  if (/历史|文化|佛教|故事|由来|为什么/.test(normalized)) {
    return 'cultural_info';
  }
  return 'general_inquiry';
}

function detectEmotion(answer = '') {
  const normalized = normalizeText(answer).toLowerCase();
  if (/抱歉|遗憾|没找到|暂未收录/.test(normalized)) {
    return 'apologetic';
  }
  if (/推荐|非常|特别|值得|精彩/.test(normalized)) {
    return 'enthusiastic';
  }
  if (/庄严|神圣|佛教文化|历史|传统/.test(normalized)) {
    return 'solemn';
  }
  return 'neutral';
}

class InteractionLogStore {
  constructor({
    app = null,
    storeFilePath = '',
    fileName = LOG_FILE_NAME,
  } = {}) {
    this.app = app;
    this.storeFilePath = normalizeText(storeFilePath);
    this.fileName = normalizeText(fileName, LOG_FILE_NAME);
    this.logs = [];
    this.loaded = false;
  }

  resolveStoreFilePath() {
    if (this.storeFilePath) {
      return this.storeFilePath;
    }
    const userDataDir =
      this.app && typeof this.app.getPath === 'function'
        ? this.app.getPath('userData')
        : process.cwd();
    return path.join(userDataDir, this.fileName);
  }

  async init() {
    try {
      const filePath = this.resolveStoreFilePath();
      const raw = await fs.readFile(filePath, 'utf8');
      const lines = raw.split('\n').filter(Boolean);
      this.logs = lines.map((line) => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      }).filter(Boolean);
    } catch (error) {
      if (error?.code !== 'ENOENT') {
        console.warn('Failed to load interaction logs:', error);
      }
      this.logs = [];
    }
    this.loaded = true;
  }

  async saveLog(logData = {}) {
    const log = {
      ...createEmptyLog(),
      logId: createLogId(),
      timestamp: new Date().toISOString(),
      inputType: normalizeText(logData.inputType, 'text'),
      question: normalizeText(logData.question),
      intent: normalizeText(logData.intent || detectIntent(logData.question)),
      sources: normalizeSources(logData.sources || []),
      answer: normalizeText(logData.answer),
      latency: {
        asr: Number.isFinite(logData.latency?.asr) ? logData.latency.asr : null,
        rag: Number.isFinite(logData.latency?.rag) ? logData.latency.rag : null,
        llmFirstToken: Number.isFinite(logData.latency?.llmFirstToken) ? logData.latency.llmFirstToken : null,
        llmComplete: Number.isFinite(logData.latency?.llmComplete) ? logData.latency.llmComplete : null,
        ttsFirstAudio: Number.isFinite(logData.latency?.ttsFirstAudio) ? logData.latency.ttsFirstAudio : null,
        complete: Number.isFinite(logData.latency?.complete) ? logData.latency.complete : null,
      },
      rating: logData.rating !== undefined ? logData.rating : null,
      emotion: normalizeText(logData.emotion || detectEmotion(logData.answer)),
      unmatched: Boolean(logData.unmatched || logData.status === 'no_hit'),
    };

    this.logs.push(log);

    try {
      const filePath = this.resolveStoreFilePath();
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.appendFile(filePath, JSON.stringify(log) + '\n', 'utf8');
    } catch (error) {
      console.warn('Failed to save interaction log:', error);
    }

    return log;
  }

  async updateRating(logId = '', rating = null) {
    const logIndex = this.logs.findIndex((log) => log.logId === logId);
    if (logIndex === -1) {
      return null;
    }

    this.logs[logIndex].rating = rating;

    try {
      const filePath = this.resolveStoreFilePath();
      const lines = this.logs.map((log) => JSON.stringify(log));
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, lines.join('\n') + '\n', 'utf8');
    } catch (error) {
      console.warn('Failed to update rating:', error);
    }

    return this.logs[logIndex];
  }

  queryLogs(filters = {}) {
    let filtered = [...this.logs];

    if (filters.startTime) {
      const start = new Date(filters.startTime).getTime();
      filtered = filtered.filter((log) => new Date(log.timestamp).getTime() >= start);
    }

    if (filters.endTime) {
      const end = new Date(filters.endTime).getTime();
      filtered = filtered.filter((log) => new Date(log.timestamp).getTime() <= end);
    }

    if (filters.unmatched !== undefined) {
      filtered = filtered.filter((log) => log.unmatched === Boolean(filters.unmatched));
    }

    if (filters.rating !== undefined) {
      filtered = filtered.filter((log) => log.rating === filters.rating);
    }

    if (filters.intent) {
      filtered = filtered.filter((log) => log.intent === filters.intent);
    }

    if (filters.inputType) {
      filtered = filtered.filter((log) => log.inputType === filters.inputType);
    }

    const page = Math.max(1, Number.isFinite(filters.page) ? filters.page : 1);
    const pageSize = Math.max(1, Math.min(100, Number.isFinite(filters.pageSize) ? filters.pageSize : 20));
    const offset = (page - 1) * pageSize;

    const paginated = filtered.slice(offset, offset + pageSize);

    return {
      logs: paginated,
      pagination: {
        page,
        pageSize,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / pageSize),
      },
    };
  }

  getStatistics(timeRange = {}) {
    let filtered = [...this.logs];

    if (timeRange.startTime) {
      const start = new Date(timeRange.startTime).getTime();
      filtered = filtered.filter((log) => new Date(log.timestamp).getTime() >= start);
    }

    if (timeRange.endTime) {
      const end = new Date(timeRange.endTime).getTime();
      filtered = filtered.filter((log) => new Date(log.timestamp).getTime() <= end);
    }

    const questionCounts = {};
    const spotCounts = {};
    let totalSatisfaction = 0;
    let ratedCount = 0;
    let hitCount = 0;
    const latencySums = { asr: 0, rag: 0, llmFirstToken: 0, llmComplete: 0, ttsFirstAudio: 0, complete: 0 };
    const latencyCounts = { asr: 0, rag: 0, llmFirstToken: 0, llmComplete: 0, ttsFirstAudio: 0, complete: 0 };

    filtered.forEach((log) => {
      const questionKey = normalizeText(log.question).toLowerCase();
      questionCounts[questionKey] = (questionCounts[questionKey] || 0) + 1;

      log.sources.forEach((source) => {
        if (source.spotId) {
          spotCounts[source.spotId] = (spotCounts[source.spotId] || 0) + 1;
        }
      });

      if (log.rating !== null) {
        totalSatisfaction += log.rating;
        ratedCount++;
      }

      if (!log.unmatched) {
        hitCount++;
      }

      Object.keys(latencySums).forEach((key) => {
        if (Number.isFinite(log.latency[key])) {
          latencySums[key] += log.latency[key];
          latencyCounts[key]++;
        }
      });
    });

    const hotQuestions = Object.entries(questionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([question, count]) => ({ question, count }));

    const hotSpots = Object.entries(spotCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([spotId, count]) => ({ spotId, count }));

    const avgLatency = {};
    Object.keys(latencySums).forEach((key) => {
      avgLatency[key] = latencyCounts[key] > 0 ? latencySums[key] / latencyCounts[key] : null;
    });

    return {
      totalQueries: filtered.length,
      hotQuestions,
      hotSpots,
      satisfaction: ratedCount > 0 ? totalSatisfaction / ratedCount : null,
      satisfactionCount: ratedCount,
      hitRate: filtered.length > 0 ? hitCount / filtered.length : 0,
      avgLatency,
      unmatchedCount: filtered.filter((log) => log.unmatched).length,
    };
  }

  async clear() {
    this.logs = [];
    try {
      const filePath = this.resolveStoreFilePath();
      await fs.rm(filePath, { force: true });
    } catch (error) {
      console.warn('Failed to clear interaction logs:', error);
    }
  }
}

module.exports = {
  LOG_FILE_NAME,
  InteractionLogStore,
  createEmptyLog,
  normalizeSources,
  detectIntent,
  detectEmotion,
};
