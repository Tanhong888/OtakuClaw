# 准确率评测运行指南

## 评测目标

验证灵山胜境 AI 数字人导览系统的核心指标：
- **总准确率** ≥ 90%
- **未命中拒答率** ≥ 95%
- **来源完整率** ≥ 95%
- **平均延迟** < 5秒

---

## 方法一：通过桌面应用评测中心（推荐）

### 步骤

1. **启动应用**
   ```bash
   pnpm run desktop:dev
   ```

2. **导入官方资料**（首次运行）
   - 打开管理端
   - 进入「知识库管理」
   - 点击「导入资料包」
   - 选择灵山胜境官方资料目录
   - 等待导入完成

3. **运行评测**
   - 进入管理端「评测中心」
   - 确认100题已加载
   - 点击「运行评测」
   - 等待评测完成（约5-10分钟）

4. **查看报告**
   - 评测完成后自动显示报告
   - 检查各项指标是否达标

---

## 方法二：通过独立评测脚本

### 前置条件

必须先通过桌面应用导入官方资料包，因为评测脚本会复用应用的用户数据。

### 运行命令

```bash
# 方法1：直接运行（使用应用的用户数据）
node desktop/electron/scripts/run-evaluation.js

# 方法2：指定数据目录
set OTAKUCLAW_DATA_DIR=C:\Users\YourName\AppData\Roaming\otakuclaw-desktop
node desktop/electron/scripts/run-evaluation.js
```

### 评测脚本位置

`desktop/electron/scripts/run-evaluation.js`

---

## 评测题目说明

### 题目分布

| 类别 | 数量 | 说明 |
|------|------|------|
| 灵山胜境点位事实 | 30题 | 测试景点基本信息查询 |
| 拈花湾点位事实 | 12题 | 测试拈花湾景点信息 |
| 历史文化与景点讲解 | 23题 | 测试文化讲解能力 |
| 官方路线推荐 | 15题 | 测试路线推荐功能 |
| 门票与贴士 | 10题 | 测试实用信息 |
| 未收录和边界问题 | 10题 | 测试拒答能力 |

### 题目示例

```json
{
  "id": "LS-001-01",
  "question": "灵山大佛有多高？",
  "category": "点位事实",
  "expected": ["88米", "八十八米"],
  "prohibited": ["99米", "100米", "108米"],
  "source": "LS-001",
  "difficulty": "easy",
  "noHitAllowed": false
}
```

---

## 预期结果

### 通过标准

```
✅ 总准确率: ≥90%
✅ 未命中拒答率: ≥95%
✅ 来源完整率: ≥95%
✅ 平均延迟: <5秒
```

### 典型报告示例

```
📊 EVALUATION RESULTS
���═══════════════════════════════════════════════════════════

📈 Overall Accuracy:
   Total Questions: 100
   Passed: 92
   Failed: 8
   Accuracy: 92.0%
   Target: ≥90%
   Status: ✅ PASS

🚫 No-Hit Refusal Rate:
   No-Hit Questions: 10
   Correct Refusal: 10
   Rate: 100.0%
   Target: ≥95%
   Status: ✅ PASS

📚 Source Completeness:
   With Sources: 98
   Rate: 98.0%
   Target: ≥95%
   Status: ✅ PASS

⏱️  Latency Metrics:
   Average: 1.2s
   Min: 0.5s
   Max: 3.8s
   Target: <5s
   Status: ✅ PASS

════════════════════════════════════════════════════════════
🎉 ALL TARGETS MET! System ready for delivery.
════════════════════════════════════════════════════════════
```

---

## 常见问题

### Q1: 评测脚本报错 "No knowledge data found"

**原因**: 没有导入官方资料包

**解决**: 先启动桌面应用，通过管理端导入资料包

### Q2: 准确率低于90%

**可能原因**:
1. 知识库数据不完整
2. RAG检索参数需要调整
3. LLM模型回答质量不稳定

**排查步骤**:
1. 检查错误答案分布
2. 分析失败原因（未命中/幻觉/内容不匹配）
3. 针对性优化

### Q3: 评测运行时间过长

**正常范围**: 5-10分钟（100题）

**优化建议**:
1. 确保使用缓存（第二次运行会更快）
2. 检查网络连接（LLM API调用）

---

## 评测结果位置

### 桌面应用
- 存储位置: `%APPDATA%\otakuclaw-desktop\scenic-guide-eval-results.json`

### 独立脚本
- 存储位置: `eval-data\latest-evaluation-report.json`

---

## 下一步

1. **如果评测通过** ✅
   - 进行演示准备
   - 执行打包部署
   - 完成最终验收

2. **如果评测未通过** ❌
   - 分析失败题目
   - 优化相关服务
   - 重新运行评测

---

**最后更新**: 2026-05-12
**文档版本**: v1.0
