/**
 * Standalone Evaluation Runner
 * Runs the 100-question evaluation set independently of the main app
 */

const path = require('node:path');
const fs = require('node:fs/promises');

// Import services
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
  ScenicEvalService,
} = require('../services/scenicGuide/scenicEvalService');

// Mock Electron app
const mockApp = {
  getPath: (name) => {
    if (name === 'userData') {
      return path.join(process.cwd(), 'eval-data');
    }
    return process.cwd();
  },
};

// Configuration
const DATA_DIR = path.join(process.cwd(), 'eval-data');
const EVAL_QUESTIONS_PATH = path.join(
  process.cwd(),
  'docs',
  'scenic-demo',
  'eval',
  'lingshan-evaluation-100-v1.0.json'
);

let manifestStore;
let knowledgeStore;
let searchIndex;
let interactionLogStore;
let scenicRagService;
let scenicEvalService;

async function initialize() {
  console.log('🚀 Initializing evaluation environment...\n');

  // Create data directory
  await fs.mkdir(DATA_DIR, { recursive: true });

  // Initialize manifest store
  manifestStore = new OfficialDataManifestStore({
    app: mockApp,
    storeFilePath: path.join(DATA_DIR, 'manifest.json'),
  });
  await manifestStore.init();
  console.log('✓ Manifest store initialized');

  // Initialize knowledge store
  knowledgeStore = new ScenicKnowledgeStore({
    app: mockApp,
    storeFilePath: path.join(DATA_DIR, 'knowledge.json'),
  });
  await knowledgeStore.init();
  console.log('✓ Knowledge store initialized');

  // Check if data exists
  const summary = knowledgeStore.getSummary();
  console.log(`  - Spots: ${summary.totalSpots || 0}`);
  console.log(`  - Routes: ${summary.totalRoutes || 0}`);
  console.log(`  - Knowledge blocks: ${summary.totalBlocks || 0}`);

  if (summary.totalSpots === 0) {
    console.log('\n⚠️  No knowledge data found!');
    console.log('Please import the official data package first using the desktop app.');
    process.exit(1);
  }

  // Initialize search index
  searchIndex = new ScenicSearchIndex({
    knowledgeStore,
    useOptimizedIndex: true,
  });
  await searchIndex.init();
  console.log('✓ Search index initialized');

  // Initialize interaction log store
  interactionLogStore = new InteractionLogStore({
    app: mockApp,
    storeFilePath: path.join(DATA_DIR, 'interaction-logs.json'),
  });
  await interactionLogStore.init();
  console.log('✓ Interaction log store initialized');

  // Initialize RAG service
  scenicRagService = new ScenicRagService({
    knowledgeStore,
    interactionLogStore,
    enableMultiRecall: true,
  });
  console.log('✓ RAG service initialized');

  // Initialize evaluation service
  scenicEvalService = new ScenicEvalService({
    scenicRagService,
    app: mockApp,
    storeFilePath: path.join(DATA_DIR, 'eval-results.json'),
  });
  await scenicEvalService.init();
  console.log('✓ Evaluation service initialized');

  console.log('\n✅ Initialization complete!\n');
}

async function loadEvaluationQuestions() {
  console.log('📋 Loading evaluation questions...\n');

  try {
    const content = await fs.readFile(EVAL_QUESTIONS_PATH, 'utf8');
    const data = JSON.parse(content);

    console.log(`✓ Loaded ${data.questions.length} questions`);
    console.log(`  Version: ${data.meta.version}`);
    console.log(`  Target accuracy: ${data.meta.targetAccuracy}\n`);

    return data.questions;
  } catch (error) {
    console.error('❌ Failed to load evaluation questions:', error.message);
    console.error(`   Path: ${EVAL_QUESTIONS_PATH}`);
    process.exit(1);
  }
}

async function runEvaluation(questions) {
  console.log('🧪 Starting evaluation...\n');
  console.log('=' .repeat(60));
  console.log(`Total questions: ${questions.length}`);
  console.log('=' .repeat(60));
  console.log();

  const startTime = Date.now();
  let lastProgressUpdate = Date.now();

  const result = await scenicEvalService.runEvaluation(questions, {
    onProgress: (progress) => {
      const now = Date.now();
      // Update progress every 5 seconds or every 10 questions
      if (now - lastProgressUpdate > 5000 || progress.current % 10 === 0) {
        process.stdout.write(`\r⏳ Progress: ${progress.current}/${progress.total} (${progress.percentage}%) - Current: ${progress.currentQuestion.substring(0, 30)}...         `);
        lastProgressUpdate = now;
      }
    },
  });

  const endTime = Date.now();
  const totalDuration = endTime - startTime;

  console.log('\n\n✅ Evaluation complete!\n');
  console.log(`Total duration: ${Math.round(totalDuration / 1000)}s`);
  console.log(`Average per question: ${Math.round(totalDuration / questions.length)}ms\n`);

  return result;
}

function displayResults(result) {
  console.log('=' .repeat(60));
  console.log('📊 EVALUATION RESULTS');
  console.log('=' .repeat(60));
  console.log();

  const { summary, targetMet } = result.report;

  // Overall accuracy
  console.log('📈 Overall Accuracy:');
  console.log(`   Total Questions: ${summary.totalQuestions}`);
  console.log(`   Passed: ${summary.totalPassed}`);
  console.log(`   Failed: ${summary.totalFailed}`);
  console.log(`   Accuracy: ${summary.totalAccuracy}%`);
  console.log(`   Target: ≥90%`);
  console.log(`   Status: ${targetMet.accuracy ? '✅ PASS' : '❌ FAIL'}`);
  console.log();

  // No-hit refusal rate
  console.log('🚫 No-Hit Refusal Rate:');
  console.log(`   No-Hit Questions: ${result.report.noHitRefusal.totalNoHit}`);
  console.log(`   Correct Refusal: ${result.report.noHitRefusal.correctRefusal}`);
  console.log(`   Rate: ${result.report.noHitRefusal.rate}%`);
  console.log(`   Target: ≥95%`);
  console.log(`   Status: ${targetMet.noHitRefusal ? '✅ PASS' : '❌ FAIL'}`);
  console.log();

  // Source completeness
  console.log('📚 Source Completeness:');
  console.log(`   With Sources: ${result.report.sourceCompleteness.withSources}`);
  console.log(`   Rate: ${result.report.sourceCompleteness.rate}%`);
  console.log(`   Target: ≥95%`);
  console.log(`   Status: ${targetMet.sourceCompleteness ? '✅ PASS' : '❌ FAIL'}`);
  console.log();

  // Latency
  console.log('⏱️  Latency Metrics:');
  console.log(`   Average: ${result.report.latency.avgSeconds}s`);
  console.log(`   Min: ${result.report.latency.minSeconds}s`);
  console.log(`   Max: ${result.report.latency.maxSeconds}s`);
  console.log(`   Target: <5s`);
  console.log(`   Status: ${targetMet.latency ? '✅ PASS' : '❌ FAIL'}`);
  console.log();

  // Category breakdown
  console.log('📂 Category Breakdown:');
  result.report.categoryAccuracy.forEach(cat => {
    console.log(`   ${cat.category}: ${cat.passed}/${cat.total} (${Math.round(cat.accuracy)}%)`);
  });
  console.log();

  // Overall status
  console.log('=' .repeat(60));
  const allTargetsMet = Object.values(targetMet).every(v => v === true);
  if (allTargetsMet) {
    console.log('🎉 ALL TARGETS MET! System ready for delivery.');
  } else {
    console.log('⚠️  Some targets not met. Review failed questions below.');
  }
  console.log('=' .repeat(60));
  console.log();

  // Wrong answers
  if (result.report.wrongAnswers.length > 0) {
    console.log('❌ Wrong Answers (First 10):');
    result.report.wrongAnswers.slice(0, 10).forEach((wrong, i) => {
      console.log(`   ${i + 1}. [${wrong.category}] ${wrong.question}`);
      console.log(`      Expected: ${wrong.expected.join(', ')}`);
      console.log(`      Actual: ${wrong.actual.substring(0, 50)}...`);
      console.log(`      Reason: ${wrong.reason}`);
      console.log();
    });

    if (result.report.wrongAnswers.length > 10) {
      console.log(`   ... and ${result.report.wrongAnswers.length - 10} more`);
    }
    console.log();
  }
}

async function saveResults(result) {
  const resultsPath = path.join(DATA_DIR, 'latest-evaluation-report.json');
  await fs.writeFile(
    resultsPath,
    JSON.stringify(result, null, 2),
    'utf8'
  );
  console.log(`📁 Full report saved to: ${resultsPath}\n`);
}

async function main() {
  try {
    await initialize();
    const questions = await loadEvaluationQuestions();
    const result = await runEvaluation(questions);
    displayResults(result);
    await saveResults(result);

    // Exit with appropriate code
    const allTargetsMet = Object.values(result.report.targetMet).every(v => v === true);
    process.exit(allTargetsMet ? 0 : 1);
  } catch (error) {
    console.error('\n❌ Evaluation failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main, initialize, runEvaluation, displayResults };
