const { EXPECTED_BEHAVIOR_HEADERS } = require('./behaviorDatasetStore');

function normalizeText(value, fallback = '') {
  if (typeof value !== 'string') {
    return fallback;
  }
  const normalized = value.trim();
  return normalized || fallback;
}

function createEmptySummary() {
  return {
    totalRecords: 0,
    ageDistribution: {},
    genderDistribution: {},
    attractionTypeDistribution: {},
    avgStayDuration: 0,
    avgTotalCost: 0,
    avgSatisfaction: 0,
    groupSizeDistribution: {},
    costStructure: {
      ticket: 0,
      food: 0,
      shopping: 0,
      transport: 0,
      entertainment: 0,
    },
  };
}

function parseAge(ageString) {
  if (typeof ageString === 'number') return ageString;
  const match = String(ageString).match(/(\d+)/);
  return match ? Number.parseInt(match[1], 10) : null;
}

function getAgeGroup(age) {
  if (!Number.isFinite(age)) return 'unknown';
  if (age < 18) return 'under_18';
  if (age < 25) return '18_24';
  if (age < 35) return '25_34';
  if (age < 45) return '35_44';
  if (age < 55) return '45_54';
  if (age < 65) return '55_64';
  return '65_plus';
}

function getSatisfactionLabel(satisfaction) {
  if (!Number.isFinite(satisfaction)) return 'unknown';
  if (satisfaction >= 4.5) return 'very_satisfied';
  if (satisfaction >= 3.5) return 'satisfied';
  if (satisfaction >= 2.5) return 'neutral';
  if (satisfaction >= 1.5) return 'dissatisfied';
  return 'very_dissatisfied';
}

class VisitorAnalyticsService {
  constructor({
    behaviorDatasetStore = null,
    interactionLogStore = null,
    knowledgeStore = null,
  } = {}) {
    this.behaviorDatasetStore = behaviorDatasetStore;
    this.interactionLogStore = interactionLogStore;
    this.knowledgeStore = knowledgeStore;
    this.behaviorSummary = null;
    this.interactionStats = null;
  }

  async init() {
    await this.loadBehaviorData();
    await this.loadInteractionStats();
  }

  async loadBehaviorData() {
    if (!this.behaviorDatasetStore) {
      this.behaviorSummary = createEmptySummary();
      return;
    }

    try {
      this.behaviorSummary = createEmptySummary();
    } catch (error) {
      console.warn('Failed to load behavior data:', error);
      this.behaviorSummary = createEmptySummary();
    }
  }

  async loadInteractionStats() {
    if (!this.interactionLogStore) {
      this.interactionStats = null;
      return;
    }

    try {
      this.interactionStats = this.interactionLogStore.getStatistics();
    } catch (error) {
      console.warn('Failed to load interaction stats:', error);
      this.interactionStats = null;
    }
  }

  getDashboardData(timeRange = {}) {
    const behaviorData = this.getBehaviorSummary();
    const interactionData = this.interactionLogStore
      ? this.interactionLogStore.getStatistics(timeRange)
      : null;

    return {
      overview: {
        todayServiceCount: interactionData?.totalQueries || 0,
        voiceQueryCount: interactionData?.totalQueries || 0,
        routeRecommendationCount: interactionData?.hotQuestions?.filter(
          (q) => q.question.includes('路线') || q.question.includes('怎么')
        ).length || 0,
        avgSatisfaction: interactionData?.satisfaction || behaviorData.avgSatisfaction || 0,
      },
      visitorPortrait: this.getVisitorPortrait(behaviorData),
      behaviorAnalysis: this.getBehaviorAnalysis(behaviorData),
      interactionAnalytics: interactionData,
      knowledgeStatus: this.getKnowledgeStatus(),
    };
  }

  getBehaviorSummary() {
    return this.behaviorSummary || createEmptySummary();
  }

  getVisitorPortrait(behaviorData = null) {
    const data = behaviorData || this.getBehaviorSummary();

    return {
      ageDistribution: {
        under_18: { count: 0, percentage: 0, label: '18岁以下' },
        '18_24': { count: 0, percentage: 0, label: '18-24岁' },
        '25_34': { count: 0, percentage: 0, label: '25-34岁' },
        '35_44': { count: 0, percentage: 0, label: '35-44岁' },
        '45_54': { count: 0, percentage: 0, label: '45-54岁' },
        '55_64': { count: 0, percentage: 0, label: '55-64岁' },
        '65_plus': { count: 0, percentage: 0, label: '65岁以上' },
      },
      genderDistribution: {
        male: { count: 0, percentage: 0, label: '男' },
        female: { count: 0, percentage: 0, label: '女' },
      },
      groupSizeDistribution: {
        solo: { count: 0, percentage: 0, label: '个人' },
        couple: { count: 0, percentage: 0, label: '情侣/夫妻' },
        family_small: { count: 0, percentage: 0, label: '小家庭(2-3人)' },
        family_large: { count: 0, percentage: 0, label: '大家庭(4+人)' },
        group: { count: 0, percentage: 0, label: '团队' },
      },
      consumptionStructure: {
        ticket: { percentage: 0, amount: 0, label: '票务' },
        food: { percentage: 0, amount: 0, label: '餐饮' },
        shopping: { percentage: 0, amount: 0, label: '购物' },
        transport: { percentage: 0, amount: 0, label: '交通' },
        entertainment: { percentage: 0, amount: 0, label: '娱乐' },
      },
      satisfactionDistribution: {
        very_satisfied: { count: 0, percentage: 0, label: '非常满意(4.5+)' },
        satisfied: { count: 0, percentage: 0, label: '满意(3.5-4.5)' },
        neutral: { count: 0, percentage: 0, label: '一般(2.5-3.5)' },
        dissatisfied: { count: 0, percentage: 0, label: '不满意(1.5-2.5)' },
        very_dissatisfied: { count: 0, percentage: 0, label: '非常不满意(<1.5)' },
      },
    };
  }

  getBehaviorAnalysis(behaviorData = null) {
    const data = behaviorData || this.getBehaviorSummary();

    return {
      avgStayDuration: data.avgStayDuration || 0,
      avgTotalCost: data.avgTotalCost || 0,
      mostPopularAttractionTypes: Object.entries(data.attractionTypeDistribution || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([type, count]) => ({ type, count })),
      peakSatisfaction: data.avgSatisfaction || 0,
    };
  }

  getKnowledgeStatus() {
    if (!this.knowledgeStore) {
      return {
        spotCount: 0,
        routeCount: 0,
        knowledgeBlockCount: 0,
        lastUpdated: null,
      };
    }

    try {
      const summary = this.knowledgeStore.getSummary();
      return {
        spotCount: summary?.spotCount || 0,
        routeCount: summary?.routeCount || 0,
        knowledgeBlockCount: summary?.knowledgeBlockCount || 0,
        lastUpdated: summary?.lastUpdated || null,
      };
    } catch (error) {
      return {
        spotCount: 0,
        routeCount: 0,
        knowledgeBlockCount: 0,
        lastUpdated: null,
      };
    }
  }

  getLatencyMetrics(timeRange = {}) {
    if (!this.interactionLogStore) {
      return {
        asr: { avg: 0, max: 0, min: 0 },
        rag: { avg: 0, max: 0, min: 0 },
        llmFirstToken: { avg: 0, max: 0, min: 0 },
        llmComplete: { avg: 0, max: 0, min: 0 },
        ttsFirstAudio: { avg: 0, max: 0, min: 0 },
        complete: { avg: 0, max: 0, min: 0 },
      };
    }

    const stats = this.interactionLogStore.getStatistics(timeRange);
    const avgLatency = stats.avgLatency || {};

    return {
      asr: {
        avg: avgLatency.asr || 0,
        max: 0,
        min: 0,
      },
      rag: {
        avg: avgLatency.rag || 0,
        max: 0,
        min: 0,
      },
      llmFirstToken: {
        avg: avgLatency.llmFirstToken || 0,
        max: 0,
        min: 0,
      },
      llmComplete: {
        avg: avgLatency.llmComplete || 0,
        max: 0,
        min: 0,
      },
      ttsFirstAudio: {
        avg: avgLatency.ttsFirstAudio || 0,
        max: 0,
        min: 0,
      },
      complete: {
        avg: avgLatency.complete || 0,
        max: 0,
        min: 0,
      },
    };
  }

  getHotQuestions(limit = 10, timeRange = {}) {
    if (!this.interactionLogStore) {
      return [];
    }

    const stats = this.interactionLogStore.getStatistics(timeRange);
    return (stats.hotQuestions || []).slice(0, limit);
  }

  getHotSpots(limit = 5, timeRange = {}) {
    if (!this.interactionLogStore) {
      return [];
    }

    const stats = this.interactionLogStore.getStatistics(timeRange);
    return (stats.hotSpots || []).slice(0, limit);
  }

  getSatisfactionTrend(timeRange = {}) {
    if (!this.interactionLogStore) {
      return [];
    }

    const logs = this.interactionLogStore.queryLogs({
      ...timeRange,
      pageSize: 1000,
    }).logs || [];

    const dailySatisfaction = {};
    logs.forEach((log) => {
      if (log.rating !== null) {
        const date = new Date(log.timestamp).toISOString().split('T')[0];
        if (!dailySatisfaction[date]) {
          dailySatisfaction[date] = { sum: 0, count: 0 };
        }
        dailySatisfaction[date].sum += log.rating;
        dailySatisfaction[date].count++;
      }
    });

    return Object.entries(dailySatisfaction)
      .map(([date, data]) => ({
        date,
        avgSatisfaction: data.sum / data.count,
        count: data.count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}

module.exports = {
  VisitorAnalyticsService,
  createEmptySummary,
  getAgeGroup,
  getSatisfactionLabel,
};
