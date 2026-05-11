# ScenicGuideShell 集成指南

## 📝 需要修改的文件

`front_end/src/shells/ScenicGuideShell.jsx`

## 🔧 修改步骤

### 1. 添加导入（在文件顶部import区域）

```jsx
// 在第18-19行附近添加
import RoutePlannerPanel from '../components/scenic/RoutePlannerPanel';
```

### 2. 添加Tabs组件导入

```jsx
// 添加到Material-UI导入中
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  TextField,
  Tooltip,
  Tabs,
  Tab,
} from '@mui/material';
```

### 3. 在组件中添加状态管理

在ScenicGuideShell函数内，大约第45-51行附近（状态声明区域），添加：

```jsx
const [currentTab, setCurrentTab] = useState('qa'); // 添加这行
```

### 4. 添加Tab标签页结构

在主内容区域（`<Box className="scenic-guide-content">`内），找到合适位置添加Tabs。

推荐位置：在推荐问法section之前添加

```jsx
{/* 添加路线推荐标签页 */}
<Tabs
  value={currentTab}
  onChange={(e, newValue) => setCurrentTab(newValue)}
  sx={{
    borderBottom: 1,
    borderColor: 'divider',
    '& .MuiTabs-flexContainer': {
      borderBottom: '1px solid #e0e0e0'
    }
  }}
>
  <Tab label="问答" value="qa" sx={{ fontWeight: 'bold' }} />
  <Tab label="路线推荐" value="route" sx={{ fontWeight: 'bold' }} />
</Tabs>

{/* 根据currentTab显示内容 */}
{currentTab === 'qa' && (
  <>
    {/* 原有的问答区域 */}
    <section className="scenic-guide-stage" aria-label="数字人导览台">
      {/* ... 原有代码 ... */}
    </section>

    {/* 原有的推荐问法区域 */}
    <section className="scenic-guide-recommended" aria-label="推荐问法">
      {/* ... 原有代码 ... */}
    </section>

    {/* 原有的统计数据区域 */}
    <section className="scenic-guide-stat-section" aria-label="导入统计">
      {/* ... 原有代码 ... */}
    </section>

    {/* 原有的官方路线区域 */}
    <section className="scenic-guide-routes-section" aria-label="官方路线">
      {/* ... 原有代码 ... */}
    </section>
  </>
)}

{currentTab === 'route' && (
  <Box sx={{ p: 3 }}>
    <RoutePlannerPanel
      onRouteGenerated={(routeData) => {
        console.log('路线生成数据:', routeData);
        // TODO: 处理路线生成结果
      }}
      onRouteReset={() => {
        console.log('重置路线规划');
      }}
    />
  </Box>
)}
```

## 📝 完整示例代码片段

```javascript
// 1. 导入组件（在顶部）
import RoutePlannerPanel from '../components/scenic/RoutePlannerPanel';

// 2. 在ScenicGuideShell函数内添加状态
export default function ScenicGuideShell({ ... }) {
  // ... 现有状态 ...
  const [currentTab, setCurrentTab] = useState('qa'); // 新增

  // ... 现有代码 ...

  return (
    <Box className="scenic-guide-shell">
      {/* ... 现有代码 ... */}

      <Box className="scenic-guide-content">
        {/* 添加Tab标签页 */}
        <Tabs
          value={currentTab}
          onChange={(e, newValue) => setCurrentTab(newValue)}
        >
          <Tab label="问答" value="qa" />
          <Tab label="路线推荐" value="route" />
        </Tabs>

        {/* 根据currentTab显示内容 */}
        {currentTab === 'qa' && (
          <>
            {/* 原有的所有问答区域代码 */}
            <section className="scenic-guide-stage">
              {/* ... */}
            </section>
            <section className="scenic-guide-recommended">
              {/* ... */}
            </section>
            {/* 其他区域... */}
          </>
        )}

        {currentTab === 'route' && (
          <Box sx={{ p: 3 }}>
            <RoutePlannerPanel
              onRouteGenerated={(routeData) => {
                console.log('路线生成数据:', routeData);
                // TODO: 显示路线结果
              }}
              onRouteReset={() => {
                console.log('重置路线规划');
              }}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}
```

## ✅ 验证

完成修改后，你应该能够：

1. 在ScenicGuideShell界面看到"问答"和"路线推荐"两个Tab标签
2. 点击"路线推荐"标签，看到RoutePlannerPanel组件
3. 选择兴趣偏好、时长等选项后点击"生成推荐路线"
4. 看到加载状态

## 🎨 样式优化（可选）

如果需要美化Tab标签页，可以在CSS文件中添加：

```css
/* ScenicGuideShell.css */
.scenic-guide-tabs {
  background: white;
  border-bottom: 2px solid #1976d2;
}

.scenic-guide-tab {
  font-weight: bold;
  color: rgba(0, 0, 0, 0.6);
  text-transform: none;
  min-width: 80px;
}

.scenic-guide-tab.Mui-selected {
  color: #1976d2;
  font-weight: bold;
}
```

## 🚨 注意事项

1. **不要删除现有代码**：只是在原有结构上添加Tab切换功能
2. **保持原有功能不变**：问答Tab��的所有原有功能保持不变
3. **导入路径正确**：确保RoutePlannerPanel的导入路径正确

## 📞 需要帮助？

如果遇到任何问题：
- 检查控制台错误信息
- 确认所有导入路径正确
- 确保Material-UI的Tabs组件已正确导入
