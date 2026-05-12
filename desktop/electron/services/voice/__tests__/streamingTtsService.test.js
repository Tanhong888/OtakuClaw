const { createStreamingTTSService } = require('../streamingTtsService');

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function runTests() {
  console.log('🧪 Testing StreamingTTSService...\n');

  let service;
  let passedTests = 0;
  let failedTests = 0;

  try {
    service = createStreamingTTSService({
      ttsOptions: {
        provider: 'mock',
      },
    });
    console.log('✓ Service created successfully');
    passedTests += 1;
  } catch (error) {
    console.error('✗ Failed to create service:', error.message);
    failedTests += 1;
  }

  console.log('\n--- Testing extractCompleteSentences ---');

  const testCases = [
    {
      input: '你好世界。',
      expectedSentences: ['你好世界。'],
      expectedRemainder: '',
    },
    {
      input: '这是第一句。这是第二句！这是第三句？',
      expectedSentences: ['这是第一句。', '这是第二句！', '这是第三句？'],
      expectedRemainder: '',
    },
    {
      input: '这是一句没有结束标点的话',
      expectedSentences: [],
      expectedRemainder: '这是一句没有结束标点的话',
    },
    {
      input: '完整句子。不完整句子',
      expectedSentences: ['完整句子。'],
      expectedRemainder: '不完整句子',
    },
    {
      input: '灵山胜境位于江苏省无锡市。这里有著名的灵山大佛。大佛高88米。',
      expectedSentences: ['灵山胜境位于江苏省无锡市。', '这里有著名的灵山大佛。', '大佛高88米。'],
      expectedRemainder: '',
    },
  ];

  testCases.forEach((testCase, index) => {
    const { sentences, remainder } = service.extractCompleteSentences(testCase.input);

    const sentencesMatch =
      sentences.length === testCase.expectedSentences.length &&
      sentences.every((s, i) => s === testCase.expectedSentences[i]);

    if (sentencesMatch && remainder === testCase.expectedRemainder) {
      console.log(`✓ Test case ${index + 1} passed`);
      passedTests += 1;
    } else {
      console.error(`✗ Test case ${index + 1} failed`);
      console.error('  Expected:', testCase.expectedSentences, `remainder: "${testCase.expectedRemainder}"`);
      console.error('  Got:', sentences, `remainder: "${remainder}"`);
      failedTests += 1;
    }
  });

  console.log('\n--- Testing getMetrics ---');

  const metrics = service.getMetrics();
  assert(metrics !== null, 'Metrics should not be null');
  assert(typeof metrics.totalSentences === 'number', 'totalSentences should be a number');
  assert(metrics.firstSentenceLatency === null || typeof metrics.firstSentenceLatency === 'number', 'firstSentenceLatency should be null or number');
  assert(typeof metrics.queueLength === 'number', 'queueLength should be a number');
  assert(typeof metrics.isProcessing === 'boolean', 'isProcessing should be a boolean');
  assert(typeof metrics.isPlaying === 'boolean', 'isPlaying should be a boolean');
  console.log('✓ Metrics structure is correct');
  passedTests += 1;

  console.log('\n--- Testing getQueueStatus ---');

  const queueStatus = service.getQueueStatus();
  assert(queueStatus !== null, 'Queue status should not be null');
  assert(typeof queueStatus.length === 'number', 'Queue length should be a number');
  assert(Array.isArray(queueStatus.items), 'Queue items should be an array');
  console.log('✓ Queue status structure is correct');
  passedTests += 1;

  console.log('\n--- Testing isProcessing and isPlaying ---');

  assert(!service.isProcessing(), 'Should not be processing initially');
  assert(!service.isPlaying(), 'Should not be playing initially');
  console.log('✓ Initial state is correct');
  passedTests += 1;

  console.log('\n--- Testing cancel ---');

  try {
    service.cancel();
    console.log('✓ Cancel executed without error');
    passedTests += 1;
  } catch (error) {
    console.error('✗ Cancel failed:', error.message);
    failedTests += 1;
  }

  console.log('\n--- Testing dispose ---');

  try {
    service.dispose();
    console.log('✓ Dispose executed successfully');
    passedTests += 1;
  } catch (error) {
    console.error('✗ Dispose failed:', error.message);
    failedTests += 1;
  }

  console.log('\n========================================');
  console.log(`Test Results: ${passedTests} passed, ${failedTests} failed`);
  console.log('========================================');

  return failedTests === 0;
}

if (require.main === module) {
  const success = runTests();
  process.exit(success ? 0 : 1);
}

module.exports = { runTests };
