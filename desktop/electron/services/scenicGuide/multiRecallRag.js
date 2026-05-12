const { ScenicSearchIndex } = require('./scenicSearchIndex');
const { PerformanceOptimizedIndex, createCacheKey } = require('./performanceOptimizedIndex');

const DEFAULT_LIMIT = 5;
const DEFAULT_MIN_SCORE = 35;

function normalizeText(value, fallback = '') {
  if (typeof value !== 'string') {
    return fallback;
  }
  const normalized = value.trim();
  return normalized || fallback;
}

class MultiRecallRAG {
  constructor({
    knowledgeStore = null,
    searchIndex = null,
    enablePerformanceOptimization = true,
    cacheSize = 50,
    cacheTtl = 5 * 60 * 1000,
  } = {}) {
    this.knowledgeStore = knowledgeStore;

    if (enablePerformanceOptimization && !searchIndex) {
      this.searchIndex = new PerformanceOptimizedIndex({
        knowledgeStore,
        cacheSize,
        cacheTtl,
      });
      this.isPerformanceOptimized = true;
    } else {
      this.searchIndex = searchIndex || new ScenicSearchIndex({ knowledgeStore });
      this.isPerformanceOptimized = false;
    }

    this.spotCache = null;
    this.routeCache = null;
    this.searchResultCache = new Map();
    this.cacheTtl = cacheTtl;
  }

  async init() {
    await this.warmupCache();
  }

  async warmupCache() {
    try {
      this.spotCache = this.knowledgeStore && typeof this.knowledgeStore.listSpots === 'function'
        ? this.knowledgeStore.listSpots()
        : [];
      this.routeCache = this.knowledgeStore && typeof this.knowledgeStore.listRoutes === 'function'
        ? this.knowledgeStore.listRoutes()
        : [];
    } catch (error) {
      console.warn('Failed to warmup cache:', error);
      this.spotCache = [];
      this.routeCache = [];
    }
  }

  async warmup({ queries = null, onProgress = null } = {}) {
    if (this.isPerformanceOptimized && typeof this.searchIndex.warmup === 'function') {
      return await this.searchIndex.warmup({ queries, onProgress });
    }
    return {
      ok: true,
      warmedUp: 0,
      message: 'Performance optimization not enabled',
    };
  }

  clearCache() {
    this.searchResultCache.clear();

    if (this.isPerformanceOptimized && typeof this.searchIndex.clearCache === 'function') {
      this.searchIndex.clearCache();
    }
  }

  getCacheStats() {
    const stats = {
      searchResultCache: {
        size: this.searchResultCache.size,
        ttl: this.cacheTtl,
      },
    };

    if (this.isPerformanceOptimized && typeof this.searchIndex.getCacheStats === 'function') {
      stats.indexCache = this.searchIndex.getCacheStats();
    }

    return stats;
  }

  getMetrics(operation = null) {
    if (this.isPerformanceOptimized && typeof this.searchIndex.getMetrics === 'function') {
      return this.searchIndex.getMetrics(operation);
    }
    return null;
  }

  getPerformanceReport() {
    if (this.isPerformanceOptimized && typeof this.searchIndex.getPerformanceReport === 'function') {
      return this.searchIndex.getPerformanceReport();
    }
    return {
      isPerformanceOptimized: false,
      cacheStats: this.getCacheStats(),
    };
  }

  resetMetrics() {
    if (this.isPerformanceOptimized && typeof this.searchIndex.resetMetrics === 'function') {
      this.searchIndex.resetMetrics();
    }
  }

  async keywordSearch(query = '') {
    const normalizedQuery = normalizeText(query);
    if (!normalizedQuery) {
      return { hits: [], method: 'keyword' };
    }

    try {
      const result = await this.searchIndex.search({
        query: normalizedQuery,
        limit: DEFAULT_LIMIT,
        minScore: DEFAULT_MIN_SCORE,
      });

      return {
        hits: Array.isArray(result?.hits) ? result.hits : [],
        method: 'keyword',
        meta: result?.meta || {},
      };
    } catch (error) {
      console.warn('Keyword search failed:', error);
      return { hits: [], method: 'keyword' };
    }
  }

  spotIdMatch(query = '') {
    const normalizedQuery = normalizeText(query).toUpperCase();

    const spotIdPatterns = [
      /LS[-\s]?0*(\d+)/i,
      /NH[-\s]?0*(\d+)/i,
      /灵山[-\s]?0*(\d+)/i,
      /拈花[-\s]?0*(\d+)/i,
    ];

    for (const pattern of spotIdPatterns) {
      const match = normalizedQuery.match(pattern);
      if (match) {
        const numericId = match[1];
        const fullSpotId = normalizedQuery.includes('NH') ? `NH-${numericId.padStart(3, '0')}` : `LS-${numericId.padStart(3, '0')}`;

        if (this.spotCache) {
          const matchedSpot = this.spotCache.find((spot) =>
            spot.spotId === fullSpotId ||
            spot.spotId === `LS-${numericId}` ||
            spot.spotId === `NH-${numericId}` ||
            spot.spotId === numericId
          );

          if (matchedSpot) {
            return {
              hits: [{
                blockId: matchedSpot.spotId,
                title: matchedSpot.name || matchedSpot.spotId,
                text: matchedSpot.introduction || matchedSpot.description || matchedSpot.name || '',
                contentType: 'spot',
                entityId: matchedSpot.spotId,
                score: 100,
                sourceRefs: [{
                  sourceId: 'spot-structured-data',
                  section: matchedSpot.spotId,
                }],
                matchReasons: ['spot_id_exact_match'],
              }],
              method: 'spot_id',
              confidence: 1.0,
            };
          }
        }
      }
    }

    return { hits: [], method: 'spot_id', confidence: 0 };
  }

  spotNameMatch(query = '') {
    const normalizedQuery = normalizeText(query).toLowerCase();

    if (!this.spotCache || this.spotCache.length === 0) {
      return { hits: [], method: 'spot_name' };
    }

    const spotNames = this.spotCache.map((spot) => ({
      spot,
      name: normalizeText(spot.name).toLowerCase(),
      alias: normalizeText(spot.alias || '').toLowerCase(),
    }));

    for (const item of spotNames) {
      const exactMatch = normalizedQuery === item.name;
      const aliasMatch = item.alias && normalizedQuery === item.alias;
      const containsMatch = item.name.length > 2 && normalizedQuery.includes(item.name);

      if (exactMatch || aliasMatch || containsMatch) {
        return {
          hits: [{
            blockId: item.spot.spotId,
            title: item.spot.name,
            text: item.spot.introduction || item.spot.description || item.spot.name || '',
            contentType: 'spot',
            entityId: item.spot.spotId,
            score: exactMatch ? 98 : 85,
            sourceRefs: [{
              sourceId: 'spot-structured-data',
              section: item.spot.spotId,
            }],
            matchReasons: exactMatch ? ['spot_name_exact'] : ['spot_name_contains'],
          }],
          method: 'spot_name',
          confidence: exactMatch ? 0.98 : 0.85,
        };
      }
    }

    return { hits: [], method: 'spot_name' };
  }

  routeMatch(query = '') {
    const normalizedQuery = normalizeText(query).toLowerCase();

    if (!this.routeCache || this.routeCache.length === 0) {
      return { hits: [], method: 'route' };
    }

    const routePatterns = [
      { pattern: /历史|文化|传统|古刹|佛教/, routes: ['历史文化爱好者路线', '历史文化深度游'] },
      { pattern: /自然|风光|风景|拍照|打卡|美景/, routes: ['自然风光爱好者路线', '自然风光深度游'] },
      { pattern: /亲子|家庭|小孩|孩子|儿童/, routes: ['亲子家庭路线'] },
    ];

    for (const { pattern, routes } of routePatterns) {
      if (pattern.test(normalizedQuery)) {
        for (const routeName of routes) {
          const matchedRoute = this.routeCache.find((route) =>
            normalizeText(route.name).includes(routeName)
          );

          if (matchedRoute) {
            return {
              hits: [{
                blockId: matchedRoute.routeId || `route-${Date.now()}`,
                title: matchedRoute.name,
                text: matchedRoute.description || matchedRoute.name || '',
                contentType: 'route',
                entityId: matchedRoute.routeId,
                score: 95,
                sourceRefs: [{
                  sourceId: 'official-guide',
                  section: matchedRoute.name,
                }],
                matchReasons: ['route_intent_match'],
              }],
              method: 'route',
              confidence: 0.95,
            };
          }
        }
      }
    }

    return { hits: [], method: 'route' };
  }

  intentClassify(query = '') {
    const normalizedQuery = normalizeText(query).toLowerCase();

    const intents = {
      route_recommendation: {
        patterns: [/路线|怎么走|游览|推荐|几个小时|多久|行程|安排|怎么玩|逛/],
        priority: 1,
      },
      practical_info: {
        patterns: [/门票|票价|多少钱|收费|开放时间|闭园|几点|停车|交通|公交|地铁/],
        priority: 2,
      },
      spot_fact: {
        patterns: [/好玩|值得看|特色|亮点|推荐|风景|景点|什么地方|哪里|介绍/],
        priority: 3,
      },
      cultural_info: {
        patterns: [/历史|文化|佛教|故事|由来|为什么|建造|是谁/],
        priority: 4,
      },
    };

    for (const [intent, config] of Object.entries(intents)) {
      for (const pattern of config.patterns) {
        if (pattern.test(normalizedQuery)) {
          return {
            intent,
            priority: config.priority,
            strategy: this.getIntentStrategy(intent),
          };
        }
      }
    }

    return {
      intent: 'general_inquiry',
      priority: 5,
      strategy: 'default',
    };
  }

  getIntentStrategy(intent) {
    const strategies = {
      route_recommendation: 'route_priority',
      practical_info: 'faq_priority',
      spot_fact: 'spot_priority',
      cultural_info: 'content_priority',
      general_inquiry: 'default',
    };
    return strategies[intent] || 'default';
  }

  async semanticSearch(query = '') {
    return { hits: [], method: 'semantic', notImplemented: true };
  }

  mergeAndRank(results = []) {
    const allHits = [];
    const methodWeights = {
      spot_id: 2.0,
      spot_name: 1.8,
      route: 1.6,
      keyword: 1.0,
      semantic: 1.2,
    };

    for (const result of results) {
      if (!Array.isArray(result.hits)) continue;

      for (const hit of result.hits) {
        const existingIndex = allHits.findIndex((h) => h.blockId === hit.blockId);

        const weight = methodWeights[result.method] || 1.0;
        const adjustedScore = (hit.score || 0) * weight;

        if (existingIndex >= 0) {
          if (adjustedScore > allHits[existingIndex].adjustedScore) {
            allHits[existingIndex] = {
              ...hit,
              adjustedScore,
              methods: [...(allHits[existingIndex].methods || []), result.method],
            };
          } else {
            allHits[existingIndex].methods = [...(allHits[existingIndex].methods || []), result.method];
          }
        } else {
          allHits.push({
            ...hit,
            adjustedScore,
            methods: [result.method],
          });
        }
      }
    }

    allHits.sort((a, b) => b.adjustedScore - a.adjustedScore);

    return allHits.slice(0, DEFAULT_LIMIT).map((hit) => {
      const { adjustedScore, methods, ...rest } = hit;
      return {
        ...rest,
        score: adjustedScore,
        matchReasons: [
          ...(hit.matchReasons || []),
          ...(methods || []).map((m) => `via_${m}`),
        ],
      };
    });
  }

  async search(query = '') {
    const normalizedQuery = normalizeText(query);
    if (!normalizedQuery) {
      return {
        hits: [],
        intent: { intent: 'unknown', priority: 99, strategy: 'default' },
        methods: [],
      };
    }

    const intent = this.intentClassify(normalizedQuery);

    const recallTasks = [];

    const spotIdResult = this.spotIdMatch(normalizedQuery);
    recallTasks.push(Promise.resolve(spotIdResult));

    if (intent.intent !== 'route_recommendation') {
      const spotNameResult = this.spotNameMatch(normalizedQuery);
      recallTasks.push(Promise.resolve(spotNameResult));
    }

    if (intent.intent === 'route_recommendation') {
      const routeResult = this.routeMatch(normalizedQuery);
      recallTasks.push(Promise.resolve(routeResult));
    }

    recallTasks.push(this.keywordSearch(normalizedQuery));

    const results = await Promise.all(recallTasks);

    const mergedHits = this.mergeAndRank(results);

    return {
      hits: mergedHits,
      intent,
      methods: results.map((r) => r.method).filter(Boolean),
      meta: {
        query: normalizedQuery,
        recallCount: results.filter((r) => r.hits && r.hits.length > 0).length,
        topScore: mergedHits[0]?.score || 0,
      },
    };
  }
}

module.exports = {
  MultiRecallRAG,
  DEFAULT_LIMIT,
  DEFAULT_MIN_SCORE,
};
