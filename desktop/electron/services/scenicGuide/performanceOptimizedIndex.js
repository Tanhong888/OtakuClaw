const crypto = require('node:crypto');
const { ScenicSearchIndex, simpleChineseTokenize } = require('./scenicSearchIndex');

const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000;
const DEFAULT_MAX_CACHE_SIZE = 100;
const DEFAULT_WARMUP_QUERIES = [
  '灵山大佛',
  '九龙灌浴',
  '五印坛城',
  '梵宫',
  '推荐路线',
  '门票价格',
  '开放时间',
  '怎么走',
  '有什么好玩的',
  '历史文化',
];

function createCacheKey({ query = '', contentType = '', limit = 20, minScore = 30 } = {}) {
  const normalized = {
    q: String(query).trim().toLowerCase(),
    ct: String(contentType),
    lim: Number(limit),
    min: Number(minScore),
  };
  return crypto.createHash('md5').update(JSON.stringify(normalized)).digest('hex');
}

class LRUCache {
  constructor({ maxSize = DEFAULT_MAX_CACHE_SIZE, ttl = DEFAULT_CACHE_TTL_MS } = {}) {
    this.maxSize = maxSize;
    this.ttl = ttl;
    this.cache = new Map();
    this.accessOrder = [];
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      return null;
    }

    this.updateAccessOrder(key);
    return entry.value;
  }

  set(key, value) {
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const lruKey = this.accessOrder.shift();
      if (lruKey) {
        this.cache.delete(lruKey);
      }
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
    this.updateAccessOrder(key);
  }

  updateAccessOrder(key) {
    this.removeFromAccessOrder(key);
    this.accessOrder.push(key);
  }

  removeFromAccessOrder(key) {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  clear() {
    this.cache.clear();
    this.accessOrder = [];
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      accessOrder: this.accessOrder.length,
    };
  }
}

class PerformanceMetrics {
  constructor() {
    this.metrics = new Map();
    this.startTime = Date.now();
  }

  record({ operation = '', duration = 0, cached = false, hitCount = 0 } = {}) {
    if (!operation) {
      return;
    }

    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, {
        count: 0,
        totalTime: 0,
        minTime: Infinity,
        maxTime: 0,
        cachedCount: 0,
        totalHits: 0,
      });
    }

    const metric = this.metrics.get(operation);
    metric.count += 1;
    metric.totalTime += duration;
    metric.minTime = Math.min(metric.minTime, duration);
    metric.maxTime = Math.max(metric.maxTime, duration);

    if (cached) {
      metric.cachedCount += 1;
    }

    metric.totalHits += hitCount;
  }

  getStats(operation = null) {
    if (operation) {
      const metric = this.metrics.get(operation);
      if (!metric) {
        return null;
      }

      return {
        count: metric.count,
        avgTime: metric.count > 0 ? metric.totalTime / metric.count : 0,
        minTime: metric.minTime === Infinity ? 0 : metric.minTime,
        maxTime: metric.maxTime,
        cacheHitRate: metric.count > 0 ? metric.cachedCount / metric.count : 0,
        avgHits: metric.count > 0 ? metric.totalHits / metric.count : 0,
      };
    }

    const stats = {};
    this.metrics.forEach((metric, op) => {
      stats[op] = {
        count: metric.count,
        avgTime: metric.count > 0 ? metric.totalTime / metric.count : 0,
        minTime: metric.minTime === Infinity ? 0 : metric.minTime,
        maxTime: metric.maxTime,
        cacheHitRate: metric.count > 0 ? metric.cachedCount / metric.count : 0,
        avgHits: metric.count > 0 ? metric.totalHits / metric.count : 0,
      };
    });
    return stats;
  }

  reset() {
    this.metrics.clear();
    this.startTime = Date.now();
  }

  getUptime() {
    return Date.now() - this.startTime;
  }
}

class PerformanceOptimizedIndex extends ScenicSearchIndex {
  constructor({
    knowledgeStore = null,
    cacheSize = DEFAULT_MAX_CACHE_SIZE,
    cacheTtl = DEFAULT_CACHE_TTL_MS,
    enableMetrics = true,
  } = {}) {
    super({ knowledgeStore });
    this.cache = new LRUCache({ maxSize: cacheSize, ttl: cacheTtl });
    this.metrics = enableMetrics ? new PerformanceMetrics() : null;
    this.enableMetrics = enableMetrics;
    this.isWarmedUp = false;
    this.warmupQueries = DEFAULT_WARMUP_QUERIES;
  }

  setWarmupQueries(queries = []) {
    this.warmupQueries = Array.isArray(queries) ? queries : DEFAULT_WARMUP_QUERIES;
  }

  async warmup({ queries = null, onProgress = null } = {}) {
    const warmupQueries = queries || this.warmupQueries;
    if (!Array.isArray(warmupQueries) || warmupQueries.length === 0) {
      return {
        ok: true,
        warmedUp: 0,
        message: 'No warmup queries provided',
      };
    }

    const startTime = Date.now();
    let successCount = 0;
    let errorCount = 0;

    try {
      await this.ensureIndex();

      for (let i = 0; i < warmupQueries.length; i += 1) {
        const query = warmupQueries[i];
        try {
          await this.search({ query, limit: 5 });
          successCount += 1;

          if (typeof onProgress === 'function') {
            onProgress({
              current: i + 1,
              total: warmupQueries.length,
              query,
              success: true,
            });
          }
        } catch (error) {
          errorCount += 1;

          if (typeof onProgress === 'function') {
            onProgress({
              current: i + 1,
              total: warmupQueries.length,
              query,
              success: false,
              error: error?.message || 'Unknown error',
            });
          }
        }
      }

      this.isWarmedUp = true;

      return {
        ok: true,
        warmedUp: successCount,
        failed: errorCount,
        duration: Date.now() - startTime,
        message: `Warmed up with ${successCount} queries`,
      };
    } catch (error) {
      return {
        ok: false,
        error: error?.message || 'Warmup failed',
        warmedUp: successCount,
        failed: errorCount,
      };
    }
  }

  async search(options = {}) {
    const startTime = Date.now();
    const cacheKey = createCacheKey(options);

    const cachedResult = this.cache.get(cacheKey);
    if (cachedResult) {
      const duration = Date.now() - startTime;

      if (this.metrics) {
        this.metrics.record({
          operation: 'search',
          duration,
          cached: true,
          hitCount: cachedResult.totalHits || 0,
        });
      }

      return {
        ...cachedResult,
        meta: {
          ...cachedResult.meta,
          cached: true,
          cacheHit: true,
        },
      };
    }

    const result = await super.search(options);
    const duration = Date.now() - startTime;

    this.cache.set(cacheKey, result);

    if (this.metrics) {
      this.metrics.record({
        operation: 'search',
        duration,
        cached: false,
        hitCount: result.totalHits || 0,
      });
    }

    return {
      ...result,
      meta: {
        ...result.meta,
        cached: false,
        cacheHit: false,
      },
    };
  }

  searchByKeywords(queryTokens = []) {
    const startTime = Date.now();
    const result = super.searchByKeywords(queryTokens);
    const duration = Date.now() - startTime;

    if (this.metrics) {
      this.metrics.record({
        operation: 'searchByKeywords',
        duration,
        cached: false,
        hitCount: result.length,
      });
    }

    return result;
  }

  searchByFullText(queryTokens = []) {
    const startTime = Date.now();
    const result = super.searchByFullText(queryTokens);
    const duration = Date.now() - startTime;

    if (this.metrics) {
      this.metrics.record({
        operation: 'searchByFullText',
        duration,
        cached: false,
        hitCount: result.length,
      });
    }

    return result;
  }

  clearCache() {
    this.cache.clear();
  }

  getCacheStats() {
    return this.cache.getStats();
  }

  getMetrics(operation = null) {
    if (!this.metrics) {
      return null;
    }
    return this.metrics.getStats(operation);
  }

  resetMetrics() {
    if (this.metrics) {
      this.metrics.reset();
    }
  }

  async rebuildIndex() {
    const startTime = Date.now();
    const result = await super.rebuildIndex();
    const duration = Date.now() - startTime;

    this.clearCache();
    this.isWarmedUp = false;

    if (this.metrics) {
      this.metrics.record({
        operation: 'rebuildIndex',
        duration,
        cached: false,
      });
    }

    return result;
  }

  getPerformanceReport() {
    const uptime = this.metrics ? this.metrics.getUptime() : 0;
    const metrics = this.metrics ? this.metrics.getStats() : {};
    const cacheStats = this.cache.getStats();

    return {
      uptime,
      isWarmedUp: this.isWarmedUp,
      cache: {
        ...cacheStats,
        hitRate: this.metrics ? metrics.search?.cacheHitRate || 0 : 0,
      },
      search: metrics.search || null,
      searchByKeywords: metrics.searchByKeywords || null,
      searchByFullText: metrics.searchByFullText || null,
      rebuildIndex: metrics.rebuildIndex || null,
    };
  }
}

module.exports = {
  PerformanceOptimizedIndex,
  LRUCache,
  PerformanceMetrics,
  createCacheKey,
  DEFAULT_CACHE_TTL_MS,
  DEFAULT_MAX_CACHE_SIZE,
  DEFAULT_WARMUP_QUERIES,
};
