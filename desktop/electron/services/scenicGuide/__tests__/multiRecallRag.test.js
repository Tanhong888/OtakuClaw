/**
 * Unit Tests for MultiRecallRAG
 * Tests multi-recall search strategy, ranking, and performance optimization
 */

const {
  MultiRecallRAG,
  RECALL_CHANNELS,
} = require('../multiRecallRag');

// Mock dependencies
class MockSearchIndex {
  constructor() {
    this.data = [
      {
        blockId: 'block-001',
        spotId: 'LS-001',
        title: '灵山大佛',
        content: '灵山大佛高88米，位于无锡灵山胜境，是无锡的标志性景点。佛体由青铜铸造，莲花座庄严殊胜。',
        keywords: ['灵山大佛', '88米', '青铜', '无锡', '地标'],
        category: 'spot_fact',
      },
      {
        blockId: 'block-002',
        spotId: 'LS-002',
        title: '九龙灌浴',
        content: '九龙灌浴位于景区中心，每天定时进行音乐喷泉表演，非常壮观。',
        keywords: ['九龙灌浴', '音乐喷泉', '表演', '中心'],
        category: 'spot_fact',
      },
      {
        blockId: 'block-003',
        spotId: 'LS-003',
        title: '梵宫',
        content: '梵宫建筑精妙绝伦，融合了传统佛教艺术与现代建筑技术，内部供奉众多佛像，是文化瑰宝。',
        keywords: ['梵宫', '建筑艺术', '佛教艺术', '文化'],
        category: 'cultural_info',
      },
      {
        blockId: 'block-004',
        spotId: 'LS-004',
        title: '五印坛城',
        content: '五印坛城是藏传佛教文化建筑，风格独特，展示了藏族佛教艺术的魅力。',
        keywords: ['五印坛城', '藏传佛教', '藏族', '建筑'],
        category: 'cultural_info',
      },
      {
        blockId: 'block-005',
        spotId: 'route-history',
        title: '历史文化爱好者路线',
        content: '该路线包含灵山大佛、梵宫、五印坛城等点位，适合对历史文化感兴趣的游客。',
        keywords: ['路线', '历史文化', '推荐'],
        category: 'route_recommendation',
      },
    ];
  }

  async search(query) {
    const lowerQuery = query.toLowerCase();
    return this.data
      .filter(block =>
        block.title.toLowerCase().includes(lowerQuery) ||
        block.content.toLowerCase().includes(lowerQuery) ||
        block.keywords.some(k => k.toLowerCase().includes(lowerQuery))
      )
      .map(block => ({
        ...block,
        score: this.calculateScore(block, query),
      }))
      .sort((a, b) => b.score - a.score);
  }

  calculateScore(block, query) {
    const lowerQuery = query.toLowerCase();
    let score = 0;

    if (block.title.toLowerCase().includes(lowerQuery)) score += 10;
    if (block.keywords.some(k => k.toLowerCase().includes(lowerQuery))) score += 5;
    if (block.content.toLowerCase().includes(lowerQuery)) score += 2;

    return score;
  }

  getBySpotId(spotId) {
    return this.data.filter(block => block.spotId === spotId);
  }
}

class MockKnowledgeStore {
  constructor() {
    this.spots = [
      { id: 'LS-001', name: '灵山大佛', aliases: ['大佛'] },
      { id: 'LS-002', name: '九龙灌浴', aliases: ['九龙'] },
      { id: 'LS-003', name: '梵宫', aliases: ['灵山梵宫'] },
      { id: 'LS-004', name: '五印坛城', aliases: ['坛城'] },
    ];
  }

  getSpotById(id) {
    return this.spots.find(s => s.id === id);
  }

  listSpots() {
    return this.spots;
  }
}

function runTests() {
  console.log('🧪 Testing MultiRecallRAG...\n');

  const mockIndex = new MockSearchIndex();
  const mockStore = new MockKnowledgeStore();
  const service = new MultiRecallRAG({
    searchIndex: mockIndex,
    knowledgeStore: mockStore,
  });

  let passedTests = 0;
  let failedTests = 0;

  // Test 1: Service initialization
  console.log('--- Testing Service Initialization ---');
  try {
    assert(service.searchIndex, 'Should have search index');
    assert(service.knowledgeStore, 'Should have knowledge store');
    assert(service.cache, 'Should have cache');
    console.log('✓ Service initializes correctly');
    passedTests += 3;
  } catch (error) {
    console.error('✗ Service initialization failed:', error.message);
    failedTests += 3;
  }

  // Test 2: Basic search
  console.log('\n--- Testing Basic Search ---');
  (async () => {
    try {
      const result = await service.search('灵山大佛');

      assert(result, 'Should return a result');
      assert(Array.isArray(result.results), 'Should have results array');
      assert(result.results.length > 0, 'Should find results for "灵山大佛"');
      console.log('✓ Basic search works');
      console.log(`  Found ${result.results.length} results`);
      passedTests += 3;
    } catch (error) {
      console.error('✗ Basic search failed:', error.message);
      failedTests += 3;
    }

    // Test 3: Spot ID matching (highest priority)
    console.log('\n--- Testing Spot ID Matching ---');
    try {
      const result = await service.search('LS-001');

      assert(result, 'Should return a result');
      const spotMatch = result.results.find(r => r.spotId === 'LS-001');
      assert(spotMatch, 'Should find exact spot ID match');
      assert(spotMatch.score > 0, 'Spot ID match should have high score');
      console.log('✓ Spot ID matching works');
      console.log(`  Spot match score: ${spotMatch.score}`);
      passedTests += 3;
    } catch (error) {
      console.error('✗ Spot ID matching failed:', error.message);
      failedTests += 3;
    }

    // Test 4: Keyword search
    console.log('\n--- Testing Keyword Search ---');
    try {
      const result = await service.search('88米');

      assert(result, 'Should return a result');
      assert(result.results.length > 0, 'Should find results for keyword "88米"');
      const hasCorrectResult = result.results.some(r =>
        r.content.includes('88米') || r.title.includes('88米')
      );
      assert(hasCorrectResult, 'Should find content containing the keyword');
      console.log('✓ Keyword search works');
      passedTests += 3;
    } catch (error) {
      console.error('✗ Keyword search failed:', error.message);
      failedTests += 3;
    }

    // Test 5: Multiple search results ranking
    console.log('\n--- Testing Result Ranking ---');
    try {
      const result = await service.search('灵山');

      assert(result, 'Should return a result');
      assert(result.results.length >= 2, 'Should find multiple results');

      // Check if results are ranked by score
      let scores = result.results.map(r => r.score);
      let isRanked = true;
      for (let i = 1; i < scores.length; i++) {
        if (scores[i - 1] < scores[i]) {
          isRanked = false;
          break;
        }
      }
      assert(isRanked, 'Results should be ranked by score');
      console.log('✓ Result ranking works');
      console.log(`  Top score: ${scores[0]}, Lowest score: ${scores[scores.length - 1]}`);
      passedTests += 4;
    } catch (error) {
      console.error('✗ Result ranking failed:', error.message);
      failedTests += 4;
    }

    // Test 6: Caching mechanism
    console.log('\n--- Testing Caching Mechanism ---');
    try {
      const query1 = '梵宫建筑艺术';
      const result1 = await service.search(query1);

      const cacheStatsBefore = service.getCacheStats();
      const cacheHitsBefore = cacheStatsBefore.hits || 0;

      const result2 = await service.search(query1);
      const cacheStatsAfter = service.getCacheStats();

      assert(result2, 'Second search should return result');
      assert(cacheStatsAfter.hits > cacheHitsBefore, 'Cache hits should increase');
      console.log('✓ Caching mechanism works');
      console.log(`  Cache hits: ${cacheStatsAfter.hits}, Size: ${cacheStatsAfter.size}`);
      passedTests += 3;
    } catch (error) {
      console.error('✗ Caching mechanism test failed:', error.message);
      failedTests += 3;
    }

    // Test 7: Cache clearing
    console.log('\n--- Testing Cache Clearing ---');
    try {
      await service.search('test query');
      const statsBefore = service.getCacheStats();

      service.clearCache();
      const statsAfter = service.getCacheStats();

      assert(statsAfter.size === 0, 'Cache should be empty after clearing');
      assert(statsAfter.hits === 0, 'Cache hits should reset');
      console.log('✓ Cache clearing works');
      passedTests += 2;
    } catch (error) {
      console.error('✗ Cache clearing failed:', error.message);
      failedTests += 2;
    }

    // Test 8: Metrics tracking
    console.log('\n--- Testing Metrics Tracking ---');
    try {
      service.resetMetrics();
      await service.search('测试查询');
      await service.search('另一个查询');

      const metrics = service.getMetrics();
      assert(metrics, 'Should have metrics');
      assert(metrics.totalSearches >= 2, 'Should track total searches');
      assert(typeof metrics.avgLatency === 'number', 'Should track average latency');
      console.log('✓ Metrics tracking works');
      console.log(`  Total searches: ${metrics.totalSearches}, Avg latency: ${metrics.avgLatency}ms`);
      passedTests += 3;
    } catch (error) {
      console.error('✗ Metrics tracking failed:', error.message);
      failedTests += 3;
    }

    // Test 9: Performance report
    console.log('\n--- Testing Performance Report ---');
    try {
      const report = service.getPerformanceReport();

      assert(report, 'Should generate report');
      assert(typeof report.totalSearches === 'number', 'Report should have total searches');
      assert(typeof report.cacheHitRate === 'number', 'Report should have cache hit rate');
      console.log('✓ Performance report generation works');
      passedTests += 2;
    } catch (error) {
      console.error('✗ Performance report failed:', error.message);
      failedTests += 2;
    }

    // Test 10: Warmup functionality
    console.log('\n--- Testing Warmup Functionality ---');
    try {
      const warmupQueries = ['灵山大佛', '梵宫', '九龙灌浴'];
      const result = await service.warmup({ queries: warmupQueries });

      assert(result, 'Warmup should return result');
      assert(result.warmed === true, 'Should indicate warmed state');
      console.log('✓ Warmup functionality works');
      passedTests += 2;
    } catch (error) {
      console.error('✗ Warmup functionality failed:', error.message);
      failedTests += 2;
    }

    // Test 11: Edge case - empty query
    console.log('\n--- Testing Edge Case: Empty Query ---');
    try {
      const result = await service.search('');

      assert(result, 'Should handle empty query');
      assert(Array.isArray(result.results), 'Should return empty results array');
      console.log('✓ Empty query handled gracefully');
      passedTests += 2;
    } catch (error) {
      console.error('✗ Empty query handling failed:', error.message);
      failedTests += 2;
    }

    // Test 12: Edge case - no results
    console.log('\n--- Testing Edge Case: No Results ---');
    try {
      const result = await service.search('xyz不存在的内容xyz');

      assert(result, 'Should return result even with no matches');
      assert(result.results.length === 0, 'Should return empty results array');
      console.log('✓ No results case handled correctly');
      passedTests += 2;
    } catch (error) {
      console.error('✗ No results handling failed:', error.message);
      failedTests += 2;
    }

    console.log('\n========================================');
    console.log(`Test Results: ${passedTests} passed, ${failedTests} failed`);
    console.log('========================================');

    process.exit(failedTests === 0 ? 0 : 1);
  })();
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

if (require.main === module) {
  runTests();
}

module.exports = { runTests, MockSearchIndex, MockKnowledgeStore };
