import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Alert,
  Chip,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import GetAppIcon from '@mui/icons-material/GetApp';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';

// 结果卡片组件
const ResultCard = ({ label, value, target, status }) => {
  const statusConfig = {
    success: {
      bgColor: '#e8f5e9',
      borderColor: '#4caf50',
      textColor: '#2e7d32',
    },
    warning: {
      bgColor: '#fff3e0',
      borderColor: '#ff9800',
      textColor: '#ef6c00',
    },
    error: {
      bgColor: '#ffebee',
      borderColor: '#f44336',
      textColor: '#c62828',
    },
  };

  const config = statusConfig[status] || statusConfig.success;

  return (
    <Paper
      sx={{
        p: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: config.bgColor,
        border: `2px solid ${config.borderColor}`,
        borderRadius: 2,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 3,
        },
      }}
    >
      <Typography variant="body2" color="textSecondary" gutterBottom sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
      <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', color: config.textColor, mb: 1 }}>
        {value}
      </Typography>
      {target && (
        <Chip
          label={`目标: ${target}`}
          size="small"
          color={status === 'success' ? 'success' : status === 'warning' ? 'warning' : 'error'}
        />
      )}
    </Paper>
  );
};

const EvalCenter = () => {
  const [evaluating, setEvaluating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [evalResults, setEvalResults] = useState(null);

  // Mock评测题集
  const [evalQuestions] = useState([
    { id: 1, category: '点位事实', question: '灵山大佛的高度是多少？', answer: '88米', status: 'pass' },
    { id: 2, category: '点位事实', question: '祥符禅寺的历史有多久？', answer: '千年古刹', status: 'pass' },
    { id: 3, category: '历史文化', question: '灵山胜境的佛教文化特色是什么？', answer: '提到佛教文化', status: 'pass' },
    { id: 4, category: '景点讲解', question: '灵山梵宫为什么被称为佛教艺术的卢浮宫？', answer: '讲解不完整', status: 'fail' },
    { id: 5, category: '路线推荐', question: '历史文化爱好者路线包含哪些景点？', answer: '正确列举', status: 'pass' },
  ]);

  // 运行评测
  const handleRunEval = async () => {
    setEvaluating(true);
    setProgress(0);
    setEvalResults(null);

    // 模拟评测过程
    const steps = 100;
    for (let i = 0; i <= steps; i++) {
      await new Promise(resolve => setTimeout(resolve, 30));
      setProgress(i);
    }

    // Mock评测结果
    setEvalResults({
      totalAccuracy: 92.3,
      totalQuestions: 100,
      passedQuestions: 92,
      noHitAccuracy: 96.7,
      noHitTotal: 30,
      noHitPassed: 29,
      sourceIntegrity: 98.0,
      avgLatency: 2.0,
      categoryAccuracy: [
        { category: '点位事实', accuracy: 93.3, passed: 28, total: 30 },
        { category: '拈花湾点位', accuracy: 91.7, passed: 11, total: 12 },
        { category: '历史文化', accuracy: 91.3, passed: 21, total: 23 },
        { category: '景点讲解', accuracy: 93.3, passed: 14, total: 15 },
        { category: '路线推荐', accuracy: 90.0, passed: 9, total: 10 },
        { category: '实用贴士', accuracy: 90.0, passed: 9, total: 10 },
      ],
      wrongAnswers: [
        {
          id: 4,
          question: '灵山梵宫的建筑风格是什么？',
          reason: '回答不完整',
          detail: '原因：知识块分割过细，未包含完整建筑风格描述',
        },
        {
          id: 17,
          question: '九龙灌浴的表演时间？',
          reason: '未命中',
          detail: '原因：官方资料未收录具体表演时间信息',
        },
      ],
    });

    setEvaluating(false);
  };

  // 导出报告
  const handleExportReport = () => {
    // TODO: 实现报告导出功能
    console.log('导出评测报告');
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#fafafa', borderRadius: 2 }}>
      {/* 标题 */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
            📋 评测中心
          </Typography>
          <Typography variant="caption" color="textSecondary" sx={{ ml: 2 }}>
            运行100条评测题，验证系统准确率和性能
          </Typography>
        </Box>
      </Box>

      {/* 控制面板 */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            评测控制
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleRunEval}
              disabled={evaluating}
              startIcon={<PlayArrowIcon />}
              sx={{ minWidth: 180 }}
            >
              {evaluating ? '评测中...' : '运行评测（100题）'}
            </Button>
            <Button
              variant="outlined"
              onClick={handleExportReport}
              disabled={!evalResults}
              startIcon={<GetAppIcon />}
            >
              导出报告
            </Button>
          </Box>
        </Box>

        {/* 进度条 */}
        {evaluating && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="textSecondary">
                评测进度
              </Typography>
              <Typography variant="body2" color="primary" sx={{ fontWeight: 'bold' }}>
                {progress}%
              </Typography>
            </Box>
            <LinearProgress variant="determinate" value={progress} sx={{ height: 10, borderRadius: 2 }} />
          </Box>
        )}

        {!evaluating && !evalResults && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              💡 点击"运行评测"按钮开始100条评测题测试。评测将验证系统准确率、未命中拒答率、来源完整率和延迟性能。
            </Typography>
          </Alert>
        )}
      </Paper>

      {/* 评测结果 */}
      {evalResults && (
        <Box>
          {/* 总体结果 */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
              总体评测结果
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <ResultCard
                  label="总准确率"
                  value={`${evalResults.totalAccuracy}%`}
                  target="≥90%"
                  status={evalResults.totalAccuracy >= 90 ? 'success' : 'error'}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <ResultCard
                  label="未命中拒答率"
                  value={`${evalResults.noHitAccuracy}%`}
                  target="≥95%"
                  status={evalResults.noHitAccuracy >= 95 ? 'success' : 'warning'}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <ResultCard
                  label="来源完整率"
                  value={`${evalResults.sourceIntegrity}%`}
                  target="≥95%"
                  status={evalResults.sourceIntegrity >= 95 ? 'success' : 'warning'}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <ResultCard
                  label="平均延迟"
                  value={`${evalResults.avgLatency}s`}
                  target="<5s"
                  status={evalResults.avgLatency < 5 ? 'success' : 'error'}
                />
              </Grid>
            </Grid>
          </Box>

          {/* 分类准确率 */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
              分类准确率
            </Typography>
            <Paper sx={{ backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>类别</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>准确率</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>通过/总数</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>状态</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {evalResults.categoryAccuracy.map((cat) => (
                      <TableRow key={cat.category}>
                        <TableCell component="th" scope="row">
                          {cat.category}
                        </TableCell>
                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 'bold',
                              color: cat.accuracy >= 90 ? '#2e7d32' : cat.accuracy >= 80 ? '#ef6c00' : '#c62828',
                            }}
                          >
                            {cat.accuracy}%
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          {cat.passed}/{cat.total}
                        </TableCell>
                        <TableCell align="center">
                          {cat.accuracy >= 90 ? (
                            <CheckCircleIcon sx={{ color: '#4caf50' }} />
                          ) : cat.accuracy >= 80 ? (
                            <WarningIcon sx={{ color: '#ff9800' }} />
                          ) : (
                            <ErrorIcon sx={{ color: '#f44336' }} />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>

          {/* 错题分析 */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
              错题分析
            </Typography>
            <Paper sx={{ backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <List>
                {evalResults.wrongAnswers.map((item) => (
                  <ListItem
                    key={item.id}
                    sx={{
                      borderBottom: '1px solid #e0e0e0',
                      '&:last-child': { borderBottom: 'none' },
                    }}
                  >
                    <ListItemIcon>
                      <ErrorIcon sx={{ color: '#f44336' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            {item.question}
                          </Typography>
                          <Chip label={item.reason} size="small" color="error" />
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                          {item.detail}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Box>

          {/* 改进建议 */}
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
              💡 改进建议
            </Typography>
            <Typography variant="body2" component="div">
              <ol style={{ margin: 0, paddingLeft: '1.5rem' }}>
                <li>针对回答不完整的问题，建议增加知识块的语义关联</li>
                <li>对于未命中问题，建议补充官方资料中的实用信息</li>
                <li>优化知识块分割策略，确保描述的完整性</li>
                <li>定期更新评测题集，覆盖更多边界情况</li>
              </ol>
            </Typography>
          </Alert>
        </Box>
      )}

      {/* 说明文字 */}
      <Box sx={{ mt: 3, p: 2, backgroundColor: '#fff3e0', borderRadius: 2 }}>
        <Typography variant="caption" color="textSecondary">
          ℹ️ 当前显示的是Mock评测数据，实际使用时将运行真实的100条评测题。
          评测结果将验证系统准确率≥90%、未命中拒答率≥95%、来源完整率≥95%、延迟{'<5s'}等核心指标。
        </Typography>
      </Box>
    </Box>
  );
};

export default EvalCenter;
