# 灵山胜境前端组件集成指南

**版本**：v1.0
**日期**：2026-05-11
**基于文档**：Frontend-Development-QuickStart.md

---

## ✅ 已完成的组件（Week 1 Day 1-5）

### 1. LatencyMonitor - 实时延迟仪表盘 ⭐核心攻坚

**文件路径**：`front_end/src/components/scenic/LatencyMonitor.jsx`

**功能**：
- 实时显示ASR、RAG、LLM、TTS各环节延迟
- 延迟折线图可视化
- 核心性能指标卡片（平均延迟、首句延迟、最大延迟、目标达成率）
- 延迟超标时红色警示

**验收标准**：
- ✅ 每个环节延迟可视化
- ✅ 延迟超标红色警示
- ✅ 证明<5秒达标

**使用方式**：
```jsx
import LatencyMonitor from '../components/scenic/LatencyMonitor';

<LatencyMonitor />
```

---

### 2. RoutePlannerPanel - 路线规划面板

**文件路径**：`front_end/src/components/scenic/RoutePlannerPanel.jsx`

**功能**：
- 兴趣偏好选择（历史文化、自然风光、亲子互动、拍照打卡、轻松休闲）
- 游览时长选择（1小时、2小时、半日、一日）
- 同行人群选择（个人、情侣、亲子、老人、研学团队）
- 体力偏好选择（轻松、适中、充实）
- 特殊需求选择（无障碍、雨天、少排队、餐饮优先）
- 表单验证和错误提示
- 加载状态展示

**验收标准**：
- ✅ 偏好选项完整
- ✅ 表单验证正确
- ✅ 加载状态可见

**使用方式**：
```jsx
import RoutePlannerPanel from '../components/scenic/RoutePlannerPanel';

<RoutePlannerPanel
  onRouteGenerated={(routeData) => {
    console.log('路线生成:', routeData);
  }}
  onRouteReset={() => {
    console.log('重置路线');
  }}
/>
```

---

### 3. RouteResultCard - 路线结果卡片

**文件路径**：`front_end/src/components/scenic/RouteResultCard.jsx`

**功能**：
- 显示推荐路线名称和基本信息
- 推荐理由说明
- 行程安排（景点列表、时长、亮点）
- 来源说明
- 匹配度展示

**验收标准**：
- ✅ 路线信息完整
- ✅ 推荐理由清晰
- ✅ 来源可追溯

**使用方式**：
```jsx
import RouteResultCard from '../components/scenic/RouteResultCard';

<RouteResultCard
  routeData={{
    interests: ['历史文化', '自然风光'],
    duration: '2h',
    crowd: 'solo',
    stamina: 'moderate',
    specialNeeds: []
  }}
  onReset={() => {
    console.log('重新规划');
  }}
/>
```

---

### 4. ScenicGuideShell 集�� - 游客导览端

**文件路径**：`front_end/src/shells/ScenicGuideShell.jsx`

**新增功能**：
- Tab标签页切换（问答 / 路线推荐）
- 路线规划面板集成
- 路线结果展示
- 状态管理（currentTab、routeData）

**使用方式**：
```jsx
import ScenicGuideShell from '../shells/ScenicGuideShell';

<ScenicGuideShell
  desktopMode={true}
  platform="win32"
  onWindowControl={(action) => {
    console.log('Window control:', action);
  }}
  onOpenAdminPortal={() => {
    console.log('打开管理后台');
  }}
/>
```

---

## 📦 已安装的依赖

```json
{
  "dependencies": {
    "recharts": "^2.x"  // 图表库
  }
}
```

---

## 🎯 核心攻坚指标：延迟 <5秒

**验收方式**：通过 `LatencyMonitor` 组件的实时延迟仪表盘证明

**当前状态**：
- ✅ 前端组件已完成
- ⏳ 待接入真实延迟数据（需要后端IPC接口）

**后续步骤**：
1. 后端开发者实现延迟数据收集IPC接口
2. 前端通过 `desktopBridge.scenicGuide.getLatencyData()` 获取真实数据
3. 替换Mock数据为真实数据

---

## 🚀 快速开始

### 1. 启动开发服务器

```bash
cd front_end
npm run dev
```

### 2. 查看组件

在浏览器中打开 `http://localhost:5173`，导航到 `ScenicGuideShell`

### 3. 测试路线推荐

1. 点击"路线推荐"标签页
2. 选择兴趣偏好（至少一个）
3. 选择游览时长
4. 点击"生成推荐路线"
5. 查看路线结果卡片

---

## 📋 Week 1 检查点 ✅

**交付物**：
- [x] `LatencyMonitor.jsx` - 实时延迟仪表盘
- [x] `RoutePlannerPanel.jsx` - 路线规划面板
- [x] `RouteResultCard.jsx` - 路线结果卡片
- [x] `ScenicGuideShell.jsx` - 集成Tab标签页

**集成验证**：
- [x] 实时延迟仪表盘可展示（Mock数据）
- [x] 路线规划面板可展示（Mock数据）
- [x] 路线结果卡片可展示（Mock数据）
- [x] Tab标签页切换流畅
- [x] 构建成功（`npm run build`）

---

## 🔄 下一步工作（Week 2）

根据 `Frontend-Development-QuickStart.md`，Week 2 的任务是：

### Day 8-9：AnalyticsDashboard（管理页分析视图）

**文件**：`front_end/src/components/scenic/AnalyticsDashboard.jsx`

**核心功能**：
- 核心指标卡片（今日服务人次、语音问答次数、满意度、知识库命中率）
- 热门问题Top10柱状图
- 游客画像饼图
- 满意度趋势折线图

### Day 10-11：ScenicBigScreen（投影大屏）⭐核心攻坚

**文件**：`front_end/src/components/scenic/ScenicBigScreen.jsx`

**核心功能**：
- 1920x1080投影优化布局
- 深色主题
- 实时数据展示
- 官方数据完整度展示

### Day 12-13：EvalCenter（评测中心）

**文件**：`front_end/src/components/scenic/EvalCenter.jsx`

**核心功能**：
- 运行评测按钮
- 进度条展示
- 结果展示（准确率、拒答率、来源完整率）
- 错题列表

---

## 💡 开发提示

### Mock数据策略

当前所有组件使用Mock数据，待后端接口就绪后替换为真实数据：

```javascript
// 当前（Mock数据）
useEffect(() => {
  const mockData = [...];
  setLatencyData(mockData);
}, []);

// 未来（真实数据）
useEffect(() => {
  const fetchData = async () => {
    const result = await desktopBridge.scenicGuide.getLatencyData();
    if (result?.ok) {
      setLatencyData(result.data);
    }
  };
  fetchData();
}, []);
```

### IPC接口调用规范

```javascript
// front_end/src/services/scenicGuideBridge.js

export const scenicGuideBridge = {
  async planRoute(preferences) {
    if (!window.desktopMode) {
      // Mock数据
      return mockRoutePlanningResult(preferences);
    }

    try {
      const result = await window.electron.ipcRenderer.invoke(
        'scenic-guide:plan-route',
        preferences
      );

      if (result?.ok) {
        return result.data;
      } else {
        throw new Error(result?.error?.message || 'API call failed');
      }
    } catch (error) {
      console.error('scenic-guide:plan-route failed:', error);
      throw error;
    }
  }
};
```

---

## 📞 联系与支持

**遇到问题时**：
1. 查看任务清单文档：`docs/DeveloperB-Tasks-2026-05-10-v2.1.md`
2. 查看快速启动指南：`docs/Frontend-Development-QuickStart.md`
3. 在每日站会提出问题

---

**最后更新**：2026-05-11
**版本**：v1.0

祝你开发顺利！💪
