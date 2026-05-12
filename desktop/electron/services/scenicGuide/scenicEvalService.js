const fs = require('node:fs/promises');
const path = require('node:path');

const EVAL_RESULTS_FILE_NAME = 'scenic-guide-eval-results.json';

function normalizeText(value, fallback = '') {
  if (typeof value !== 'string') {
    return fallback;
  }
  const normalized = value.trim();
  return normalized || fallback;
}

function createEvalId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `eval-${timestamp}-${random}`;
}

class ScenicEvalService {
  constructor({
    scenicRagService = null,
    app = null,
    storeFilePath = '',
  } = {}) {
    this.scenicRagService = scenicRagService;
    this.app = app;
    this.storeFilePath = storeFilePath;
    this.fileName = EVAL_RESULTS_FILE_NAME;
    this.evalHistory = [];
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
      const data = JSON.parse(raw);
      this.evalHistory = Array.isArray(data.results) ? data.results : [];
    } catch (error) {
      if (error?.code !== 'ENOENT') {
        console.warn('Failed to load eval history:', error);
      }
      this.evalHistory = [];
    }
    this.loaded = true;
  }

  async saveResult(result) {
    this.evalHistory.push(result);

    try {
      const filePath = this.resolveStoreFilePath();
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, JSON.stringify({
        version: 'v1.0',
        lastUpdated: new Date().toISOString(),
        results: this.evalHistory,
      }, null, 2), 'utf8');
    } catch (error) {
      console.warn('Failed to save eval result:', error);
    }
  }

  checkHit(answer, expectedKeywords) {
    if (!answer || !Array.isArray(expectedKeywords) || expectedKeywords.length === 0) {
      return false;
    }

    const normalizedAnswer = normalizeText(answer).toLowerCase();
    return expectedKeywords.some(keyword =>
      normalizedAnswer.includes(normalizeText(keyword).toLowerCase())
    );
  }

  checkProhibited(answer, prohibitedKeywords) {
    if (!answer || !Array.isArray(prohibitedKeywords) || prohibitedKeywords.length === 0) {
      return false;
    }

    const normalizedAnswer = normalizeText(answer).toLowerCase();
    return prohibitedKeywords.some(keyword =>
      normalizedAnswer.includes(normalizeText(keyword).toLowerCase())
    );
  }

  checkSourceCompleteness(answer) {
    if (!answer || typeof answer !== 'object') {
      return false;
    }

    const sources = answer.sources || answer.sources;
    return Array.isArray(sources) && sources.length > 0;
  }

  async runSingleQuestion(question, questionIndex, total) {
    const startTime = Date.now();

    try {
      const result = await this.scenicRagService.askQuestion({
        question: question.question,
      });

      const endTime = Date.now();
      const latency = endTime - startTime;

      const hasExpected = this.checkHit(result.answer, question.expected);
      const hasProhibited = this.checkProhibited(result.answer, question.prohibited);
      const hasSources = this.checkSourceCompleteness(result);
      const isNoHit = result.status === 'no_hit';
      const noHitAllowed = question.noHitAllowed === true;
      const noHitCorrect = isNoHit && noHitAllowed;

      return {
        id: question.id,
        index: questionIndex,
        question: question.question,
        category: question.category,
        expected: question.expected || [],
        prohibited: question.prohibited || [],
        source: question.source || '',
        difficulty: question.difficulty || 'medium',
        noHitAllowed: noHitAllowed,

        actual: {
          answer: result.answer || '',
          status: result.status || 'unknown',
          confidence: result.confidence || 0,
          sources: result.sources || [],
          sourceCount: (result.sources || []).length,
          hitSources: (result.sources || []).map(s => ({
            sourceId: s.sourceId || s.file || '',
            title: s.title || '',
            excerpt: s.excerpt || '',
          })),
        },

        performance: {
          latency: latency,
          latencySeconds: (latency / 1000).toFixed(2),
        },

        evaluation: {
          hit: hasExpected,
          noHitRefusal: noHitCorrect,
          hasProhibited: hasProhibited,
          hasSources: hasSources,
          passed: (hasExpected || noHitCorrect) && !hasProhibited,
        },

        retrieval: result.retrieval || {},
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      return {
        id: question.id,
        index: questionIndex,
        question: question.question,
        category: question.category,
        expected: question.expected || [],
        prohibited: question.prohibited || [],

        actual: {
          answer: '',
          status: 'error',
          confidence: 0,
          sources: [],
          sourceCount: 0,
          hitSources: [],
          error: error.message,
        },

        performance: {
          latency: 0,
          latencySeconds: '0',
        },

        evaluation: {
          hit: false,
          noHitRefusal: false,
          hasProhibited: false,
          hasSources: false,
          passed: false,
        },

        error: error.message,
      };
    }
  }

  async runEvaluation(questionSet, options = {}) {
    if (!this.scenicRagService) {
      throw new Error('ScenicRagService is not available');
    }

    if (!Array.isArray(questionSet) || questionSet.length === 0) {
      throw new Error('Question set is empty or invalid');
    }

    const { onProgress } = options || {};
    const totalQuestions = questionSet.length;
    const results = [];

    for (let i = 0; i < totalQuestions; i++) {
      const question = questionSet[i];
      const result = await this.runSingleQuestion(question, i + 1, totalQuestions);
      results.push(result);

      if (onProgress && typeof onProgress === 'function') {
        onProgress({
          current: i + 1,
          total: totalQuestions,
          percentage: Math.round(((i + 1) / totalQuestions) * 100),
          currentQuestion: question.question,
        });
      }
    }

    const report = this.generateReport(results, questionSet);

    const evalResult = {
      evalId: createEvalId(),
      timestamp: new Date().toISOString(),
      questionSet: {
        version: questionSet.meta?.version || 'unknown',
        total: questionSet.meta?.total || totalQuestions,
        targetAccuracy: questionSet.meta?.targetAccuracy || 'unknown',
      },
      results,
      report,
    };

    await this.saveResult(evalResult);

    return evalResult;
  }

  generateReport(results, questionSet) {
    const total = results.length;

    const totalAccuracy = total > 0
      ? (results.filter(r => r.evaluation.passed).length / total) * 100
      : 0;

    const noHitQuestions = results.filter(r => r.actual.status === 'no_hit');
    const noHitAllowed = noHitQuestions.filter(r => r.evaluation.noHitRefusal);
    const noHitRefusalRate = noHitQuestions.length > 0
      ? (noHitAllowed.length / noHitQuestions.length) * 100
      : 100;

    const withSources = results.filter(r => r.evaluation.hasSources);
    const sourceCompleteness = total > 0
      ? (withSources.length / total) * 100
      : 0;

    const withProhibited = results.filter(r => r.evaluation.hasProhibited);

    const latencies = results
      .filter(r => r.performance.latency > 0)
      .map(r => r.performance.latency);

    const avgLatency = latencies.length > 0
      ? latencies.reduce((a, b) => a + b, 0) / latencies.length
      : 0;

    const maxLatency = latencies.length > 0
      ? Math.max(...latencies)
      : 0;

    const minLatency = latencies.length > 0
      ? Math.min(...latencies)
      : 0;

    const categoryAccuracy = {};
    results.forEach(r => {
      const cat = r.category || 'unknown';
      if (!categoryAccuracy[cat]) {
        categoryAccuracy[cat] = { total: 0, passed: 0 };
      }
      categoryAccuracy[cat].total++;
      if (r.evaluation.passed) {
        categoryAccuracy[cat].passed++;
      }
    });

    const categoryStats = Object.entries(categoryAccuracy).map(([cat, stats]) => ({
      category: cat,
      total: stats.total,
      passed: stats.passed,
      accuracy: (stats.passed / stats.total) * 100,
    }));

    const wrongAnswers = results.filter(r => !r.evaluation.passed);

    return {
      summary: {
        totalQuestions: total,
        totalAccuracy: Math.round(totalAccuracy * 10) / 10,
        totalPassed: results.filter(r => r.evaluation.passed).length,
        totalFailed: results.filter(r => !r.evaluation.passed).length,
      },
      noHitRefusal: {
        totalNoHit: noHitQuestions.length,
        correctRefusal: noHitAllowed.length,
        rate: Math.round(noHitRefusalRate * 10) / 10,
      },
      sourceCompleteness: {
        withSources: withSources.length,
        rate: Math.round(sourceCompleteness * 10) / 10,
      },
      prohibitedContent: {
        hasProhibited: withProhibited.length,
        details: withProhibited.map(r => ({
          id: r.id,
          question: r.question,
          found: r.actual.answer,
        })),
      },
      latency: {
        avg: Math.round(avgLatency),
        avgSeconds: (avgLatency / 1000).toFixed(2),
        max: Math.round(maxLatency),
        maxSeconds: (maxLatency / 1000).toFixed(2),
        min: Math.round(minLatency),
        minSeconds: (minLatency / 1000).toFixed(2),
      },
      categoryAccuracy: categoryStats.sort((a, b) => b.accuracy - a.accuracy),
      wrongAnswers: wrongAnswers.map(r => ({
        id: r.id,
        index: r.index,
        question: r.question,
        category: r.category,
        expected: r.expected,
        actual: r.actual.answer,
        status: r.actual.status,
        reason: this.getFailureReason(r),
      })),
      targetMet: {
        accuracy: totalAccuracy >= 90,
        noHitRefusal: noHitRefusalRate >= 95,
        sourceCompleteness: sourceCompleteness >= 95,
        latency: avgLatency < 5000,
      },
    };
  }

  getFailureReason(result) {
    if (result.evaluation.hasProhibited) {
      return '包含禁止内容';
    }
    if (result.actual.status === 'error') {
      return '处理错误';
    }
    if (result.actual.status === 'no_hit' && !result.noHitAllowed) {
      return '未命中问题';
    }
    if (!result.evaluation.hit) {
      return '未包含预期内容';
    }
    return '未知原因';
  }

  async getReport(evalId) {
    const result = this.evalHistory.find(r => r.evalId === evalId);
    if (!result) {
      throw new Error(`Evaluation ${evalId} not found`);
    }
    return result;
  }

  async getLatestReport() {
    if (this.evalHistory.length === 0) {
      return null;
    }
    return this.evalHistory[this.evalHistory.length - 1];
  }

  getHistory() {
    return this.evalHistory.map(r => ({
      evalId: r.evalId,
      timestamp: r.timestamp,
      summary: r.report?.summary || {},
    }));
  }

  async clearHistory() {
    this.evalHistory = [];
    try {
      const filePath = this.resolveStoreFilePath();
      await fs.rm(filePath, { force: true });
    } catch (error) {
      console.warn('Failed to clear eval history:', error);
    }
  }
}

module.exports = {
  ScenicEvalService,
  EVAL_RESULTS_FILE_NAME,
};
