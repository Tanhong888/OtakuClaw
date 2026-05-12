const {
  PerformanceOptimizedIndex,
  LRUCache,
  PerformanceMetrics,
  createCacheKey,
  DEFAULT_WARMUP_QUERIES,
} = require('../performanceOptimizedIndex');

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  console.log('🧪 Testing PerformanceOptimizedIndex...\n');

  let passedTests = 0;
  let failedTests = 0;

  console.log('--- Testing LRUCache ---');

  const cache = new LRUCache({ maxSize: 3, ttl: 1000 });

  cache.set('key1', 'value1');
  cache.set('key2', 'value2');
  cache.set('key3', 'value3');

  assert(cache.get('key1') === 'value1', 'Should get key1');
  console.log('✓ Cache get works');
  passedTests += 1;

  cache.set('key4', 'value4');
  assert(cache.get('key2') === null, 'key2 should be evicted (LRU) - key1 was accessed');
  console.log('✓ LRU eviction works');
  passedTests += 1;

  assert(cache.get('key1') === 'value1', 'key1 should still exist after access');
  console.log('✓ LRU order maintained');
  passedTests += 1;

  const stats = cache.getStats();
  assert(stats.size === 3, `Cache size should be 3, got ${stats.size}`);
  console.log('✓ Cache stats correct');
  passedTests += 1;

  cache.clear();
  assert(cache.getStats().size === 0, 'Cache should be empty after clear');
  console.log('✓ Cache clear works');
  passedTests += 1;

  console.log('\n--- Testing PerformanceMetrics ---');

  const metrics = new PerformanceMetrics();

  metrics.record({ operation: 'search', duration: 100, cached: false, hitCount: 5 });
  metrics.record({ operation: 'search', duration: 200, cached: true, hitCount: 3 });
  metrics.record({ operation: 'search', duration: 50, cached: false, hitCount: 2 });

  const searchStats = metrics.getStats('search');
  assert(searchStats !== null, 'Should have search stats');
  assert(searchStats.count === 3, `Search count should be 3, got ${searchStats.count}`);
  console.log('✓ Metrics count works');
  passedTests += 1;

  assert(searchStats.avgTime === 350 / 3, `Avg time should be ${350 / 3}, got ${searchStats.avgTime}`);
  console.log('✓ Metrics avg time works');
  passedTests += 1;

  assert(searchStats.minTime === 50, `Min time should be 50, got ${searchStats.minTime}`);
  console.log('✓ Metrics min time works');
  passedTests += 1;

  assert(searchStats.maxTime === 200, `Max time should be 200, got ${searchStats.maxTime}`);
  console.log('✓ Metrics max time works');
  passedTests += 1;

  assert(searchStats.cacheHitRate === 1 / 3, `Cache hit rate should be ${1 / 3}, got ${searchStats.cacheHitRate}`);
  console.log('✓ Metrics cache hit rate works');
  passedTests += 1;

  assert(searchStats.avgHits === 10 / 3, `Avg hits should be ${10 / 3}, got ${searchStats.avgHits}`);
  console.log('✓ Metrics avg hits works');
  passedTests += 1;

  console.log('\n--- Testing createCacheKey ---');

  const key1 = createCacheKey({ query: 'test', contentType: 'spot', limit: 10 });
  const key2 = createCacheKey({ query: 'test', contentType: 'spot', limit: 10 });
  const key3 = createCacheKey({ query: 'test', contentType: 'route', limit: 10 });

  assert(key1 === key2, 'Same params should produce same key');
  console.log('✓ Cache key consistency works');
  passedTests += 1;

  assert(key1 !== key3, 'Different params should produce different keys');
  console.log('✓ Cache key uniqueness works');
  passedTests += 1;

  assert(typeof key1 === 'string' && key1.length === 32, 'Cache key should be MD5 hash');
  console.log('✓ Cache key format works');
  passedTests += 1;

  console.log('\n--- Testing DEFAULT_WARMUP_QUERIES ---');

  assert(Array.isArray(DEFAULT_WARMUP_QUERIES), 'Warmup queries should be array');
  assert(DEFAULT_WARMUP_QUERIES.length > 0, 'Should have default warmup queries');
  console.log(`✓ Has ${DEFAULT_WARMUP_QUERIES.length} default warmup queries`);
  passedTests += 1;

  const expectedQueries = ['灵山大佛', '九龙灌浴', '五印坛城', '梵宫'];
  const hasExpected = expectedQueries.every((q) => DEFAULT_WARMUP_QUERIES.includes(q));
  assert(hasExpected, 'Should have expected warmup queries');
  console.log('✓ Has expected warmup queries');
  passedTests += 1;

  console.log('\n--- Testing PerformanceOptimizedIndex ---');

  class MockKnowledgeStore {
    constructor() {
      this.blocks = [
        {
          blockId: 'LS-001',
          contentType: 'spot',
          entityId: 'LS-001',
          title: '灵山大佛',
          text: '灵山大佛高88米，是无锡的标志性景点。',
          keywords: ['大佛', '88米', '青铜'],
        },
        {
          blockId: 'LS-002',
          contentType: 'spot',
          entityId: 'LS-002',
          title: '九龙灌浴',
          text: '九龙灌浴景点位于景区中心，每天定时表演。',
          keywords: ['九龙', '表演', '音乐'],
        },
      ];
    }

    getSummary() {
      return { version: 1, knowledgeBlockCount: this.blocks.length };
    }

    getKnowledgeBase() {
      return { version: 1, knowledgeBlocks: this.blocks };
    }
  }

  const mockStore = new MockKnowledgeStore();
  const index = new PerformanceOptimizedIndex({
    knowledgeStore: mockStore,
    cacheSize: 10,
    cacheTtl: 5000,
  });

  assert(index !== null, 'Index should be created');
  console.log('✓ PerformanceOptimizedIndex created');
  passedTests += 1;

  assert(index.isWarmedUp === false, 'Should not be warmed up initially');
  console.log('✓ Initial warmup state correct');
  passedTests += 1;

  console.log('\n--- Testing Index Warmup ---');

  try {
    const warmupResult = await index.warmup({ queries: ['灵山大佛', '九龙灌浴'] });

    assert(warmupResult.ok === true, 'Warmup should succeed');
    console.log('✓ Warmup completed successfully');
    passedTests += 1;

    assert(warmupResult.warmedUp >= 0, `Warmup executed, got ${warmupResult.warmedUp} queries`);
    console.log(`✓ Warmup executed (${warmupResult.warmedUp} queries)`);
    passedTests += 1;

    assert(index.isWarmedUp === true, 'Should be marked as warmed up');
    console.log('✓ Warmup state updated');
    passedTests += 1;

    console.log('\n--- Testing Cache Functionality ---');

    const search1 = await index.search({ query: '灵山大佛' });
    const search2 = await index.search({ query: '灵山大佛' });

    assert(search1.ok === true, 'First search should succeed');
    assert(search2.ok === true, 'Second search should succeed');
    console.log('✓ Cached search works');
    passedTests += 1;

    assert(search1.meta.cached === false, 'First search should not be cached');
    assert(search2.meta.cached === true, 'Second search should be cached');
    console.log('✓ Cache hit detection works');
    passedTests += 1;

    const cacheStats = index.getCacheStats();
    assert(cacheStats.size > 0, 'Cache should have entries');
    console.log(`✓ Cache has ${cacheStats.size} entries`);
    passedTests += 1;

    console.log('\n--- Testing Metrics ---');

    const indexMetrics = index.getMetrics('search');
    assert(indexMetrics !== null, 'Should have search metrics');
    assert(indexMetrics.count > 0, 'Should have recorded searches');
    console.log(`✓ Recorded ${indexMetrics.count} searches`);
    passedTests += 1;

    assert(indexMetrics.cacheHitRate > 0, 'Should have cache hits');
    console.log(`✓ Cache hit rate: ${(indexMetrics.cacheHitRate * 100).toFixed(1)}%`);
    passedTests += 1;

    console.log('\n--- Testing Performance Report ---');

    const report = index.getPerformanceReport();
    assert(report !== null, 'Should have performance report');
    assert(report.uptime > 0, 'Should have uptime');
    assert(report.isWarmedUp === true, 'Should show warmed up');
    assert(report.cache !== null, 'Should have cache stats');
    assert(report.search !== null, 'Should have search metrics');
    console.log('✓ Performance report complete');
    passedTests += 1;

    console.log('\n--- Testing Cache Clear ---');

    index.clearCache();
    const clearedStats = index.getCacheStats();
    assert(clearedStats.size === 0, 'Cache should be empty after clear');
    console.log('✓ Cache clear works');
    passedTests += 1;

    console.log('\n--- Testing Metrics Reset ---');

    index.resetMetrics();
    const resetMetrics = index.getMetrics('search');
    assert(resetMetrics === null || resetMetrics.count === 0, 'Metrics should be reset');
    console.log('✓ Metrics reset works');
    passedTests += 1;

    console.log('\n========================================');
    console.log(`Test Results: ${passedTests} passed, ${failedTests} failed`);
    console.log('========================================');

    return failedTests === 0;
  } catch (error) {
    console.error('Test error:', error);
    return false;
  }
}

if (require.main === module) {
  runTests().then((success) => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { runTests };
