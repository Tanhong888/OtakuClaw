// Web 端景区功能 Mock 数据模块
// 用于在浏览器环境中测试景区导览功能

const MOCK_MANIFEST = {
  datasetId: 'lingshan-official-001',
  scenicId: 'lingshan',
  version: '1.0.0',
  importSummary: {
    spotCount: 12,
    routeCount: 3,
    behaviorDataRowCount: 1568,
    knowledgeBlockCount: 89,
  },
  knowledgeSummary: {
    knowledgeBlockCount: 89,
    officialKnowledgeBlockCount: 72,
    manualKnowledgeBlockCount: 17,
    version: 3,
  },
  sources: [
    { id: 'spot', fileName: '景点结构化数据集', exists: true },
    { id: 'guide', fileName: '历史文化与游览指南', exists: true },
    { id: 'behavior', fileName: '旅游行为数据', exists: true },
  ],
};

const MOCK_KNOWLEDGE_BLOCKS = [
  {
    blockId: 'kb-001',
    title: '灵山大佛',
    excerpt: '灵山大佛坐落于太湖之北岸，高88米，是中国第二高的巨型佛像...',
    category: '景点介绍',
  },
  {
    blockId: 'kb-002',
    title: '九龙灌浴',
    excerpt: '九龙灌浴是灵山胜境的大型音乐喷泉动态群雕，展现佛陀诞生的场景...',
    category: '景点介绍',
  },
  {
    blockId: 'kb-003',
    title: '梵宫',
    excerpt: '梵宫是集文化、艺术、旅游、会议等功能于一体的佛教建筑群...',
    category: '景点介绍',
  },
  {
    blockId: 'kb-004',
    title: '五印坛城',
    excerpt: '五印坛城是一座展示藏传佛教文化的艺术殿堂...',
    category: '景点介绍',
  },
  {
    blockId: 'kb-005',
    title: '灵山历史文化',
    excerpt: '灵山地区历史悠久，佛教文化源远流长，始于唐代...',
    category: '历史文化',
  },
];

const MOCK_SPOTS = [
  { id: 'spot-001', name: '灵山大佛', category: '核心景点', duration: '1.5h', highlight: true },
  { id: 'spot-002', name: '九龙灌浴', category: '核心景点', duration: '0.5h', highlight: true },
  { id: 'spot-003', name: '梵宫', category: '核心景点', duration: '1h', highlight: true },
  { id: 'spot-004', name: '五印坛城', category: '文化景点', duration: '0.5h', highlight: false },
  { id: 'spot-005', name: '曼飞龙塔', category: '文化景点', duration: '0.5h', highlight: false },
  { id: 'spot-006', name: '灵山精舍', category: '住宿餐饮', duration: '0.5h', highlight: false },
  { id: 'spot-007', name: ' Buddhist Culture Museum', category: '博物馆', duration: '1h', highlight: false },
  { id: 'spot-008', name: '吉祥颂演出', category: '演艺', duration: '0.5h', highlight: true },
];

const MOCK_ROUTES = [
  {
    id: 'route-001',
    name: '历史文化爱好者路线',
    description: '深度体验灵山佛教文化，适合对历史文化感兴趣的游客',
    duration: '4h',
    spots: ['spot-001', 'spot-002', 'spot-003', 'spot-004', 'spot-005'],
    highlights: ['灵山大佛', '梵宫', '五印坛城'],
  },
  {
    id: 'route-002',
    name: '自然风光爱好者路线',
    description: '欣赏灵山自然风光与太湖美景，轻松惬意',
    duration: '3h',
    spots: ['spot-001', 'spot-002', 'spot-006', 'spot-008'],
    highlights: ['灵山大佛', '九龙灌浴', '吉祥颂'],
  },
  {
    id: 'route-003',
    name: '亲子家庭路线',
    description: '适合全家出游，寓教于乐，轻松愉快',
    duration: '2.5h',
    spots: ['spot-002', 'spot-003', 'spot-008', 'spot-006'],
    highlights: ['九龙灌浴', '梵宫', '吉祥颂'],
  },
];

const MOCK_QA_PAIRS = [
  {
    question: '灵山大佛有什么特色？',
    answer: '灵山大佛坐落于江苏省无锡市滨湖区，坐落在太湖之北岸，高88米，是中国第二高的巨型佛像。大佛采用锡青铜铸造，总用铜量达725吨。游客可以乘坐电梯直达佛脚，抱佛脚祈福。大佛右手为"施无畏印"，寓意为众生除去痛苦；左手为"与愿印"，寓意给予众生快乐。',
    sources: [
      { blockId: 'kb-001', title: '灵山大佛', excerpt: '灵山大佛坐落于太湖之北岸，高88米...' },
      { blockId: 'kb-005', title: '灵山历史文化', excerpt: '灵山地区历史悠久，佛教文化源远流长...' },
    ],
    confidence: 0.95,
  },
  {
    question: '九龙灌浴适合什么时候看？',
    answer: '九龙灌浴每天有固定演出时间，通常每天4-5场，具体时间会根据季节调整。建议提前查看当日演出时间表，提前15分钟到达占据好位置。演出时长约15分钟，展现佛陀诞生的壮观场景，配合音乐喷泉非常震撼。',
    sources: [
      { blockId: 'kb-002', title: '九龙灌浴', excerpt: '九龙灌浴是灵山胜境的大型音乐喷泉动态群雕...' },
    ],
    confidence: 0.88,
  },
  {
    question: '亲子家庭适合走哪条路线？',
    answer: '亲子家庭推荐选择"亲子家庭路线"，全程约2.5小时。路线包含九龙灌浴（孩子喜欢的水景表演）、梵宫（华丽的建筑让孩子大开眼界）、吉祥颂演出（精彩的视听盛宴），最后到灵山精舍休息用餐。这条路线节奏轻松，寓教于乐。',
    sources: [
      { blockId: 'route-003', title: '亲子家庭路线', excerpt: '适合全家出游，寓教于乐，轻松愉快...' },
    ],
    confidence: 0.92,
  },
  {
    question: '灵山有哪些必看景点？',
    answer: '灵山胜境必看景点包括：1. 灵山大佛（88米高，可抱佛脚祈福）；2. 九龙灌浴（大型音乐喷泉群雕，展现佛陀诞生）；3. 梵宫（集文化、艺术、旅游于一体的佛教建筑群，内部装饰华丽）；4. 吉祥颂演出（大型音乐史诗实景演出）。建议预留至少半天时间游览。',
    sources: [
      { blockId: 'kb-001', title: '灵山大佛', excerpt: '灵山大佛坐落于太湖之北岸...' },
      { blockId: 'kb-002', title: '九龙灌浴', excerpt: '九龙灌浴是灵山胜境的大型音乐喷泉...' },
      { blockId: 'kb-003', title: '梵宫', excerpt: '梵宫是集文化、艺术、旅游...' },
    ],
    confidence: 0.94,
  },
  {
    question: '梵宫有什么看点？',
    answer: '梵宫是灵山胜境的核心建筑之一，内部装饰极尽奢华。看点包括：1. 门厅的东阳木雕；2. 廊厅的敦煌技师手工壁画；3. 塔厅的巨型琉璃壁画（华藏世界）；4. 圣坛的大型旋转舞台，可容纳1500人观看《吉祥颂》演出。整个建筑耗资约18亿，被誉为"东方的卢浮宫"。',
    sources: [
      { blockId: 'kb-003', title: '梵宫', excerpt: '梵宫是集文化、艺术、旅游、会议等功能于一体的佛教建筑群...' },
    ],
    confidence: 0.91,
  },
];

const MOCK_EVALUATION_HISTORY = [
  {
    id: 'eval-001',
    timestamp: '2026-05-10T10:00:00Z',
    accuracy: 0.85,
    refusalRate: 0.05,
    sourceCompleteness: 0.92,
    totalQuestions: 100,
    passed: 85,
    failed: 10,
    refused: 5,
  },
  {
    id: 'eval-002',
    timestamp: '2026-05-12T14:30:00Z',
    accuracy: 0.88,
    refusalRate: 0.03,
    sourceCompleteness: 0.94,
    totalQuestions: 100,
    passed: 88,
    failed: 9,
    refused: 3,
  },
];

const MOCK_ANALYTICS = {
  todayVisitors: 1286,
  todayVoiceQueries: 342,
  satisfactionRate: 0.94,
  knowledgeHitRate: 0.89,
  hotQuestions: [
    { question: '灵山大佛有多高？', count: 156 },
    { question: '九龙灌浴演出时间', count: 134 },
    { question: '门票价格是多少？', count: 128 },
    { question: '梵宫值得看吗？', count: 112 },
    { question: '游玩需要多长时间？', count: 98 },
    { question: '有素食餐厅吗？', count: 87 },
    { question: '可以拍照吗？', count: 76 },
    { question: '交通路线怎么走？', count: 65 },
    { question: '住宿推荐', count: 54 },
    { question: '周边还有什么景点？', count: 48 },
  ],
  visitorProfile: {
    solo: 0.15,
    couple: 0.25,
    family: 0.35,
    elderly: 0.15,
    team: 0.10,
  },
  satisfactionTrend: [
    { date: '2026-05-01', rate: 0.91 },
    { date: '2026-05-02', rate: 0.92 },
    { date: '2026-05-03', rate: 0.90 },
    { date: '2026-05-04', rate: 0.93 },
    { date: '2026-05-05', rate: 0.94 },
    { date: '2026-05-06', rate: 0.92 },
    { date: '2026-05-07', rate: 0.95 },
    { date: '2026-05-08', rate: 0.93 },
    { date: '2026-05-09', rate: 0.94 },
    { date: '2026-05-10', rate: 0.94 },
  ],
};

// 模拟延迟
function mockDelay(ms = 800) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

// 模拟文件选择（使用 input type=file）
async function mockPickDataDirectory() {
  await mockDelay(500);
  // Web 端无法真正选择目录，返回模拟路径
  return {
    ok: true,
    directoryPath: '/mock/lingshan-data',
    canceled: false,
  };
}

// 模拟数据导入
async function mockImportOfficialData(request = {}) {
  await mockDelay(1500);
  return {
    ok: true,
    manifest: MOCK_MANIFEST,
    knowledgeSummary: MOCK_MANIFEST.knowledgeSummary,
    message: '官方资料包已导入并重建知识库（Web模拟）',
  };
}

// 模拟问答
async function mockAskQuestion(request = {}) {
  await mockDelay(1200);
  const question = request.question || '';

  // 尝试匹配预设问题
  const matched = MOCK_QA_PAIRS.find((qa) =>
    question.includes(qa.question.substring(0, 6))
  );

  if (matched) {
    return {
      ok: true,
      question: matched.question,
      answer: matched.answer,
      sources: matched.sources,
      confidence: matched.confidence,
      status: 'hit',
      latency: 1200,
    };
  }

  // 通用回答
  return {
    ok: true,
    question,
    answer: `关于"${question}"，灵山胜境拥有丰富的佛教文化和自然景观。灵山大佛高88米，是景区的核心景点；九龙灌浴展现佛陀诞生的壮观场景；梵宫内部装饰华丽，被誉为"东方的卢浮宫"。建议您根据兴趣选择适合的游览路线，一般游玩需要半天到一天时间。`,
    sources: [
      { blockId: 'kb-001', title: '灵山大佛', excerpt: '灵山大佛坐落于太湖之北岸...' },
      { blockId: 'kb-003', title: '梵宫', excerpt: '梵宫是集文化、艺术、旅游...' },
    ],
    confidence: 0.75,
    status: 'hit',
    latency: 1200,
  };
}

// 模拟路线规划
async function mockPlanRoute(request = {}) {
  await mockDelay(1000);
  const { interests = [], duration = 'half-day', crowd = 'solo' } = request;

  // 根据偏好选择路线
  let route = MOCK_ROUTES[0];
  if (interests.includes('自然风光')) {
    route = MOCK_ROUTES[1];
  } else if (interests.includes('亲子') || crowd === 'family') {
    route = MOCK_ROUTES[2];
  }

  const spotDetails = route.spots.map((spotId) =>
    MOCK_SPOTS.find((s) => s.id === spotId)
  ).filter(Boolean);

  return {
    ok: true,
    route: {
      ...route,
      spots: spotDetails,
      estimatedDuration: duration === 'half-day' ? '4小时' : duration === 'full-day' ? '6小时' : '2小时',
      recommendedTime: '上午9:00开始',
      tips: ['建议穿舒适的鞋子', '夏季注意防晒', '可提前预约导游讲解'],
    },
  };
}

// 模拟评测运行
async function mockRunEvaluation(request = {}) {
  await mockDelay(3000);
  return {
    ok: true,
    result: {
      accuracy: 0.87,
      refusalRate: 0.04,
      sourceCompleteness: 0.93,
      totalQuestions: 100,
      passed: 87,
      failed: 9,
      refused: 4,
      failedQuestions: [
        {
          question: '灵山寺的住持是谁？',
          expectedAnswer: '包含现任住持姓名',
          actualAnswer: '抱歉，我目前没有这方面的信息',
          reason: '知识库中缺少最新人员信息',
        },
        {
          question: '2026年灵山有什么新活动？',
          expectedAnswer: '包含2026年活动信息',
          actualAnswer: '抱歉，我目前没有这方面的信息',
          reason: '知识库缺少最新活动数据',
        },
      ],
    },
  };
}

// 模拟获取评测历史
async function mockGetEvaluationHistory() {
  await mockDelay(500);
  return {
    ok: true,
    history: MOCK_EVALUATION_HISTORY,
  };
}

// 模拟获取分析数据
async function mockGetAnalyticsDashboard(timeRange = {}) {
  await mockDelay(600);
  return {
    ok: true,
    data: MOCK_ANALYTICS,
  };
}

// 模拟获取热门问题
async function mockGetHotQuestions(request = {}) {
  await mockDelay(400);
  return {
    ok: true,
    data: MOCK_ANALYTICS.hotQuestions.slice(0, request.limit || 10),
  };
}

// 模拟获取满意度趋势
async function mockGetSatisfactionTrend(timeRange = {}) {
  await mockDelay(400);
  return {
    ok: true,
    data: MOCK_ANALYTICS.satisfactionTrend,
  };
}

// 导出 Web Mock API
export const webScenicMock = {
  getManifest: async () => ({ ok: true, manifest: MOCK_MANIFEST }),
  pickDataDirectory: mockPickDataDirectory,
  inspectDataDirectory: async () => ({ ok: true, summary: MOCK_MANIFEST.importSummary }),
  importOfficialData: mockImportOfficialData,
  getImportSummary: async () => ({ ok: true, importSummary: MOCK_MANIFEST.importSummary }),
  getKnowledgeSummary: async () => ({ ok: true, knowledgeSummary: MOCK_MANIFEST.knowledgeSummary }),
  listSpots: async () => ({ ok: true, spots: MOCK_SPOTS }),
  listRoutes: async () => ({ ok: true, routes: MOCK_ROUTES }),
  listKnowledgeBlocks: async () => ({ ok: true, knowledgeBlocks: MOCK_KNOWLEDGE_BLOCKS }),
  askQuestion: mockAskQuestion,
  getEvaluationHistory: mockGetEvaluationHistory,
  runEvaluation: mockRunEvaluation,
  getAnalyticsDashboard: mockGetAnalyticsDashboard,
  getHotQuestions: mockGetHotQuestions,
  getSatisfactionTrend: mockGetSatisfactionTrend,
  planRoute: mockPlanRoute,
  getRouteOptions: async () => ({
    ok: true,
    data: {
      interests: ['历史文化', '自然风光', '亲子互动', '拍照打卡', '轻松休闲'],
      crowds: ['solo', 'couple', 'family', 'elderly', 'team'],
      stamina: ['easy', 'moderate', 'intensive'],
    },
  }),
  getInteractionLogs: async () => ({ ok: true, logs: [] }),
  exportInteractionLogs: async () => ({ ok: true, filePath: '/mock/export.csv' }),
  clearInteractionLogs: async () => ({ ok: true }),
  getLatencyData: async () => ({
    ok: true,
    data: {
      asrLatency: 450,
      ragLatency: 1200,
      llmLatency: 800,
      ttsLatency: 350,
      totalLatency: 2800,
    },
  }),
};
