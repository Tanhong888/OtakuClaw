const {
  SCENIC_GUIDE_PROMPT,
  INTENT_SPECIFIC_PROMPTS,
  getPromptForIntent,
  buildSystemPrompt,
  formatRagContext,
  buildNoHitResponse,
} = require('../scenicGuidePrompt');

function runTests() {
  console.log('🧪 Testing ScenicGuidePrompt...\n');

  let passedTests = 0;
  let failedTests = 0;

  console.log('--- Testing Core Prompt Structure ---');

  const corePromptChecks = [
    { condition: SCENIC_GUIDE_PROMPT.includes('核心原则'), name: 'Contains core principles' },
    { condition: SCENIC_GUIDE_PROMPT.includes('语音播报格式规范'), name: 'Contains voice format guidelines' },
    { condition: SCENIC_GUIDE_PROMPT.includes('来源追溯规范'), name: 'Contains source tracing guidelines' },
    { condition: SCENIC_GUIDE_PROMPT.includes('15字以内'), name: 'Contains length constraints' },
    { condition: SCENIC_GUIDE_PROMPT.includes('庄严殊胜'), name: 'Contains cultural tone examples' },
  ];

  corePromptChecks.forEach(({ condition, name }) => {
    if (condition) {
      console.log(`✓ ${name}`);
      passedTests += 1;
    } else {
      console.error(`✗ ${name}`);
      failedTests += 1;
    }
  });

  console.log('\n--- Testing Intent-Specific Prompts ---');

  const intents = ['route_recommendation', 'practical_info', 'spot_fact', 'cultural_info', 'general_inquiry'];

  intents.forEach((intent) => {
    const prompt = getPromptForIntent(intent);
    if (prompt && typeof prompt === 'string') {
      console.log(`✓ Intent "${intent}" has prompt`);
      passedTests += 1;

      const specificCheck =
        intent === 'route_recommendation'
          ? prompt.includes('推荐路线：')
          : intent === 'practical_info'
            ? prompt.includes('温馨提示')
            : intent === 'spot_fact'
              ? prompt.includes('核心特色是')
              : intent === 'cultural_info'
                ? prompt.includes('文化瑰宝')
                : true;

      if (specificCheck) {
        console.log(`  ✓ Contains intent-specific format`);
        passedTests += 1;
      } else {
        console.error(`  ✗ Missing intent-specific format`);
        failedTests += 1;
      }
    } else {
      console.error(`✗ Intent "${intent}" missing prompt`);
      failedTests += 1;
    }
  });

  console.log('\n--- Testing System Prompt Building ---');

  const systemPrompt = buildSystemPrompt({
    intent: 'spot_fact',
    hasRagContext: true,
    visitorPreferences: {
      interests: ['历史文化', '自然风光'],
      duration: '2小时',
      crowd: '情侣',
    },
  });

  const systemPromptChecks = [
    { condition: systemPrompt.includes('景点事实专项策略'), name: 'Includes intent-specific strategy' },
    { condition: systemPrompt.includes('检索到的参考资料'), name: 'Includes RAG context section' },
    { condition: systemPrompt.includes('游客偏好'), name: 'Includes visitor preferences' },
    { condition: systemPrompt.includes('历史文化'), name: 'Includes visitor interests' },
  ];

  systemPromptChecks.forEach(({ condition, name }) => {
    if (condition) {
      console.log(`✓ ${name}`);
      passedTests += 1;
    } else {
      console.error(`✗ ${name}`);
      failedTests += 1;
    }
  });

  console.log('\n--- Testing RAG Context Formatting ---');

  const mockSources = [
    {
      sourceId: 'LS-001',
      spotId: 'LS-001',
      title: '灵山大佛',
      excerpt: '灵山大佛高88米，是无锡的标志性景点。',
    },
    {
      sourceId: 'LS-002',
      title: '九龙灌浴',
      excerpt: '九龙灌浴景点位于景区中心，每天定时表演。',
    },
  ];

  const formattedContext = formatRagContext(mockSources);
  const contextChecks = [
    { condition: formattedContext.includes('【资料1】'), name: 'Has source number' },
    { condition: formattedContext.includes('灵山大佛'), name: 'Includes title' },
    { condition: formattedContext.includes('点位：LS-001'), name: 'Includes spot ID when present' },
    { condition: formattedContext.includes('【资料2】'), name: 'Has second source' },
  ];

  contextChecks.forEach(({ condition, name }) => {
    if (condition) {
      console.log(`✓ ${name}`);
      passedTests += 1;
    } else {
      console.error(`✗ ${name}`);
      failedTests += 1;
    }
  });

  console.log('\n--- Testing No Hit Response ---');

  const noHitResponse = buildNoHitResponse();
  const noHitChecks = [
    { condition: noHitResponse.status === 'no_hit', name: 'Status is no_hit' },
    { condition: noHitResponse.shouldRecord === true, name: 'Should record is true' },
    { condition: noHitResponse.response.includes('抱歉'), name: 'Response is apologetic' },
    { condition: noHitResponse.response.includes('官方资料'), name: 'Mentions official data' },
  ];

  noHitChecks.forEach(({ condition, name }) => {
    if (condition) {
      console.log(`✓ ${name}`);
      passedTests += 1;
    } else {
      console.error(`✗ ${name}`);
      failedTests += 1;
    }
  });

  console.log('\n--- Testing Voice Format Compliance ---');

  const voiceFormatChecks = [
    {
      condition: SCENIC_GUIDE_PROMPT.includes('15-25字为佳'),
      name: 'Specifies ideal sentence length',
    },
    {
      condition: SCENIC_GUIDE_PROMPT.includes('逗号表示短停顿'),
      name: 'Explains pause symbols',
    },
    {
      condition: SCENIC_GUIDE_PROMPT.includes('避免连续使用超过3个短句'),
      name: 'Warns against too many short sentences',
    },
  ];

  voiceFormatChecks.forEach(({ condition, name }) => {
    if (condition) {
      console.log(`✓ ${name}`);
      passedTests += 1;
    } else {
      console.error(`✗ ${name}`);
      failedTests += 1;
    }
  });

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
