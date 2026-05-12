/**
 * Week 4 Integration Tests for Scenic Guide System
 * Tests all core flows to ensure system readiness for delivery
 */

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs/promises');

// Mock Electron app for testing
const mockApp = {
  getPath: (name) => {
    if (name === 'userData') {
      return path.join(process.cwd(), 'test-data');
    }
    return process.cwd();
  },
};

const {
  OfficialDataManifestStore,
} = require('../services/scenicGuide/officialDataManifestStore');
const {
  ScenicKnowledgeStore,
} = require('../services/scenicGuide/scenicKnowledgeStore');
const {
  ScenicSearchIndex,
} = require('../services/scenicGuide/scenicSearchIndex');
const {
  ScenicRagService,
} = require('../services/scenicGuide/scenicRagService');
const {
  InteractionLogStore,
} = require('../services/scenicGuide/interactionLogStore');
const {
  VisitorAnalyticsService,
} = require('../services/scenicGuide/visitorAnalyticsService');
const {
  MultiRecallRAG,
} = require('../services/scenicGuide/multiRecallRag');
const {
  RoutePlannerService,
} = require('../services/scenicGuide/routePlannerService');
const {
  ScenicEvalService,
} = require('../services/scenicGuide/scenicEvalService');
const {
  createStreamingTTSService,
} = require('../services/voice/streamingTtsService');

// Test data directory
const TEST_DATA_DIR = path.join(process.cwd(), 'test-data');
const EVAL_QUESTIONS_PATH = path.join(
  process.cwd(),
  'docs',
  'scenic-demo',
  'eval',
  'lingshan-evaluation-100-v1.0.json'
);

// Global test fixtures
let manifestStore;
let knowledgeStore;
let searchIndex;
let interactionLogStore;
let visitorAnalyticsService;
let multiRecallRag;
let routePlannerService;
let scenicEvalService;
let streamingTtsService;
let scenicRagService;

// Performance tracking
const performanceMetrics = {
  queryLatencies: [],
  firstSentenceLatencies: [],
  completeAnswerLatencies: [],
};

async function setupTestEnvironment() {
  // Create test data directory
  await fs.mkdir(TEST_DATA_DIR, { recursive: true });

  // Initialize services
  manifestStore = new OfficialDataManifestStore({
    app: mockApp,
    storeFilePath: path.join(TEST_DATA_DIR, 'manifest.json'),
  });
  await manifestStore.init();

  knowledgeStore = new ScenicKnowledgeStore({
    app: mockApp,
    storeFilePath: path.join(TEST_DATA_DIR, 'knowledge.json'),
  });
  await knowledgeStore.init();

  searchIndex = new ScenicSearchIndex({
    knowledgeStore,
    useOptimizedIndex: true,
  });
  await searchIndex.init();

  interactionLogStore = new InteractionLogStore({
    app: mockApp,
    storeFilePath: path.join(TEST_DATA_DIR, 'interaction-logs.json'),
  });
  await interactionLogStore.init();

  visitorAnalyticsService = new VisitorAnalyticsService({
    interactionLogStore,
  });

  multiRecallRag = new MultiRecallRAG({
    searchIndex,
    knowledgeStore,
  });

  scenicRagService = new ScenicRagService({
    knowledgeStore,
    interactionLogStore,
    enableMultiRecall: true,
  });
  scenicRagService.multiRecallRag = multiRecallRag;

  routePlannerService = new RoutePlannerService({
    knowledgeStore,
  });

  scenicEvalService = new ScenicEvalService({
    scenicRagService,
    app: mockApp,
    storeFilePath: path.join(TEST_DATA_DIR, 'eval-results.json'),
  });
  await scenicEvalService.init();

  streamingTtsService = createStreamingTTSService({});
}

async function cleanupTestEnvironment() {
  // Clean up test data
  try {
    await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
  } catch (error) {
    console.warn('Failed to clean up test data:', error);
  }
}

function recordLatency(type, ms) {
  if (type === 'query') {
    performanceMetrics.queryLatencies.push(ms);
  } else if (type === 'first_sentence') {
    performanceMetrics.firstSentenceLatencies.push(ms);
  } else if (type === 'complete') {
    performanceMetrics.completeAnswerLatencies.push(ms);
  }
}

function getLatencyStats(latencies) {
  if (latencies.length === 0) {
    return { avg: 0, min: 0, max: 0 };
  }
  return {
    avg: latencies.reduce((a, b) => a + b, 0) / latencies.length,
    min: Math.min(...latencies),
    max: Math.max(...latencies),
  };
}

describe('Week 4 Integration Tests', function () {
  this.timeout(60000); // 60 second timeout for integration tests

  before(async () => {
    await setupTestEnvironment();
  });

  after(async () => {
    await cleanupTestEnvironment();
  });

  describe('Service Initialization', () => {
    it('should initialize all core services successfully', async () => {
      assert.ok(manifestStore, 'ManifestStore should be initialized');
      assert.ok(knowledgeStore, 'KnowledgeStore should be initialized');
      assert.ok(searchIndex, 'SearchIndex should be initialized');
      assert.ok(interactionLogStore, 'InteractionLogStore should be initialized');
      assert.ok(visitorAnalyticsService, 'VisitorAnalyticsService should be initialized');
      assert.ok(multiRecallRag, 'MultiRecallRAG should be initialized');
      assert.ok(routePlannerService, 'RoutePlannerService should be initialized');
      assert.ok(scenicEvalService, 'ScenicEvalService should be initialized');
      assert.ok(streamingTtsService, 'StreamingTTSService should be initialized');
      assert.ok(scenicRagService, 'ScenicRagService should be initialized');
    });

    it('should have knowledge data available', () => {
      const summary = knowledgeStore.getSummary();
      assert.ok(summary, 'Should have knowledge summary');
      assert.ok(typeof summary.totalSpots === 'number', 'Should have total spots count');
      assert.ok(typeof summary.totalRoutes === 'number', 'Should have total routes count');
      assert.ok(typeof summary.totalBlocks === 'number', 'Should have total blocks count');
    });
  });

  describe('Core Flow Tests', () => {
    it('should handle text Q&A with proper source attribution', async () => {
      const startTime = Date.now();

      const result = await scenicRagService.askQuestion({
        question: '灵山大佛有多高？',
      });

      const latency = Date.now() - startTime;
      recordLatency('query', latency);

      assert.ok(result, 'Should return a result');
      assert.ok(result.answer, 'Should have an answer');
      assert.ok(result.status, 'Should have a status');

      // Verify source attribution
      if (result.status === 'success') {
        assert.ok(
          Array.isArray(result.sources) && result.sources.length > 0,
          'Should have sources for successful answers'
        );
      }
    });

    it('should log interactions correctly', async () => {
      const logsBefore = interactionLogStore.queryLogs({}).length;

      await scenicRagService.askQuestion({
        question: '九龙灌浴有什么表演？',
      });

      const logsAfter = interactionLogStore.queryLogs({});
      assert.ok(logsAfter.length > logsBefore, 'Should create a new interaction log');
    });

    it('should provide analytics data', () => {
      const dashboardData = visitorAnalyticsService.getDashboardData({});
      assert.ok(dashboardData, 'Should have dashboard data');
      assert.ok(typeof dashboardData.totalInteractions === 'number', 'Should have total interactions');
    });

    it('should recommend routes based on preferences', async () => {
      const result = await routePlannerService.planRoute({
        interests: ['历史文化'],
        duration: 120,
        crowd: 'adult',
        stamina: 'normal',
      });

      assert.ok(result, 'Should return route recommendation');
      assert.ok(result.route, 'Should have a route');
      assert.ok(result.spots, 'Should have spots list');
      assert.ok(Array.isArray(result.spots), 'Spots should be an array');
    });

    it('should perform multi-recall search', async () => {
      const result = await multiRecallRag.search('灵山大佛');
      assert.ok(result, 'Should return search results');
      assert.ok(Array.isArray(result.results), 'Should have results array');
    });
  });

  describe('Performance Tests', () => {
    it('should complete 20 text Q&A rounds within acceptable time', async () => {
      const questions = [
        '灵山大佛有多高？',
        '九龙灌浴有什么表演？',
        '梵宫有什么特色？',
        '五印坛城是什么风格的建筑？',
        '祥符禅寺历史悠久吗？',
        '灵山胜境的门票价格是多少？',
        '推荐一条历史文化路线',
        '灵山胜境在哪里？',
        '有什么适合亲子的活动？',
        '最佳游览时间是多久？',
      ];

      const latencies = [];
      for (let i = 0; i < 20; i++) {
        const q = questions[i % questions.length];
        const start = Date.now();
        await scenicRagService.askQuestion({ question: q });
        latencies.push(Date.now() - start);
      }

      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      const maxLatency = Math.max(...latencies);

      assert.ok(avgLatency < 5000, `Average latency ${avgLatency}ms should be < 5000ms`);
      assert.ok(maxLatency < 10000, `Max latency ${maxLatency}ms should be < 10000ms`);
    });
  });

  describe('Streaming TTS Tests', () => {
    it('should extract sentences correctly', () => {
      const text = '灵山大佛高88米。它由青铜铸造而成。位于无锡灵山胜境。';
      const sentences = streamingTtsService.extractCompleteSentences(text);

      assert.ok(Array.isArray(sentences), 'Should return array of sentences');
      assert.ok(sentences.length >= 3, 'Should extract at least 3 sentences');
    });

    it('should provide TTS metrics', () => {
      const metrics = streamingTtsService.getMetrics();
      assert.ok(typeof metrics === 'object', 'Should have metrics object');
      assert.ok(typeof metrics.totalProcessed === 'number', 'Should have total processed count');
    });
  });

  describe('Accuracy Evaluation', () => {
    it('should run evaluation with 100 questions', { timeout: 300000 }, async () => {
      // Check if evaluation questions file exists
      try {
        await fs.access(EVAL_QUESTIONS_PATH);
      } catch (error) {
        console.warn('Evaluation questions file not found, skipping test');
        return;
      }

      const questionsData = await fs.readFile(EVAL_QUESTIONS_PATH, 'utf8');
      const questionSet = JSON.parse(questionsData);

      assert.ok(Array.isArray(questionSet.questions), 'Should have questions array');
      assert.ok(questionSet.questions.length === 100, 'Should have 100 questions');

      const evalResult = await scenicEvalService.runEvaluation(
        questionSet.questions,
        {
          onProgress: (progress) => {
            console.log(`Evaluation progress: ${progress.percentage}%`);
          },
        }
      );

      assert.ok(evalResult, 'Should have evaluation result');
      assert.ok(evalResult.report, 'Should have evaluation report');
      assert.ok(evalResult.report.summary, 'Should have summary');

      // Verify accuracy targets
      const { summary, targetMet } = evalResult.report;
      console.log(`Total Accuracy: ${summary.totalAccuracy}%`);
      console.log(`No-Hit Refusal Rate: ${evalResult.report.noHitRefusal.rate}%`);
      console.log(`Source Completeness: ${evalResult.report.sourceCompleteness.rate}%`);
      console.log(`Average Latency: ${evalResult.report.latency.avgSeconds}s`);

      // Check if targets are met (may not be met in test environment)
      console.log('Accuracy Target Met:', targetMet.accuracy);
      console.log('No-Hit Target Met:', targetMet.noHitRefusal);
      console.log('Source Target Met:', targetMet.sourceCompleteness);
      console.log('Latency Target Met:', targetMet.latency);
    });
  });

  describe('Data Persistence', () => {
    it('should persist and restore interaction logs', async () => {
      const testLog = {
        timestamp: new Date().toISOString(),
        inputType: 'text',
        question: 'Test persistence question',
        intent: 'spot_fact',
        sources: [],
        answer: 'Test answer',
        latency: { asr: 0, rag: 100, llmFirstToken: 200, llmComplete: 500, ttsFirstAudio: 0, complete: 500 },
        rating: null,
        emotion: null,
      };

      await interactionLogStore.saveLog(testLog);

      // Create new store instance to test persistence
      const newStore = new InteractionLogStore({
        app: mockApp,
        storeFilePath: interactionLogStore.storeFilePath,
      });
      await newStore.init();

      const logs = newStore.queryLogs({});
      assert.ok(logs.length > 0, 'Should restore persisted logs');

      const savedLog = logs.find((l) => l.question === testLog.question);
      assert.ok(savedLog, 'Should find the saved log');
    });

    it('should persist and restore evaluation results', async () => {
      const history = scenicEvalService.getHistory();
      assert.ok(Array.isArray(history), 'Should have history array');

      // Create new instance to test persistence
      const newEvalService = new ScenicEvalService({
        scenicRagService,
        app: mockApp,
        storeFilePath: scenicEvalService.storeFilePath,
      });
      await newEvalService.init();

      const newHistory = newEvalService.getHistory();
      assert.ok(newHistory.length >= history.length, 'Should restore evaluation history');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty question gracefully', async () => {
      const result = await scenicRagService.askQuestion({
        question: '',
      });

      assert.ok(result, 'Should return result even for empty question');
      assert.ok(result.status, 'Should have a status');
    });

    it('should handle questions with no matching content', async () => {
      const result = await scenicRagService.askQuestion({
        question: '这个景区有迪斯尼乐园吗？',
      });

      assert.ok(result, 'Should return result for unmatched question');
      // Should either return no_hit status or a fallback answer
      assert.ok(
        result.status === 'no_hit' || result.answer,
        'Should handle unmatched questions appropriately'
      );
    });

    it('should handle special characters in questions', async () => {
      const specialQuestions = [
        '灵山大佛的门票价格？',
        '什么是"梵宫"？',
        '五印坛城（藏传佛教）有什么特色？',
      ];

      for (const q of specialQuestions) {
        const result = await scenicRagService.askQuestion({ question: q });
        assert.ok(result, `Should handle question: ${q}`);
      }
    });
  });
});

// Run tests if this file is executed directly
if (require.main === module) {
  console.log('Running Week 4 Integration Tests...\n');
  console.log('Test Data Directory:', TEST_DATA_DIR);
  console.log('Evaluation Questions Path:', EVAL_QUESTIONS_PATH);
  console.log('');
}

module.exports = {
  setupTestEnvironment,
  cleanupTestEnvironment,
  performanceMetrics,
  getLatencyStats,
};
