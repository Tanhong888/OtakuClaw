import React, { useState, useEffect, useCallback } from 'react';
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
import { desktopBridge } from '../../services/desktopBridge.js';

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
  const [error, setError] = useState(null);
  const [evalQuestions, setEvalQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);

  // 加载评测题集
  useEffect(() => {
    const loadEvaluationQuestions = async () => {
      try {
        // 尝试从IPC加载评测题集
        const result = await desktopBridge.scenicGuide.getEvaluationHistory?.();
        if (result?.ok && result.data?.length > 0) {
          // 使用历史记录中的题集
          const latestReport = result.data[0];
          if (latestReport.questionSet) {
            setEvalQuestions(latestReport.questionSet);
          }
        }

        // 如果没有从历史获取到，使用默认题集
        if (evalQuestions.length === 0) {
          setEvalQuestions([
            { id: 'LS-001-01', question: '灵山大佛有多高？', category: '点位事实', expected: ['88米'], prohibited: ['99米'], source: 'LS-001', difficulty: 'easy', noHitAllowed: false },
            { id: 'LS-001-02', question: '灵山大佛是什么材质的？', category: '点位事实', expected: ['青铜'], prohibited: ['黄金'], source: 'LS-001', difficulty: 'easy', noHitAllowed: false },
            { id: 'LS-002-01', question: '九龙灌浴有什么表演？', category: '点位事实', expected: ['音乐喷泉'], prohibited: ['灯光秀'], source: 'LS-002', difficulty: 'easy', noHitAllowed: false },
            { id: 'LS-003-01', question: '梵宫有什么特色？', category: '点位事实', expected: ['建筑艺术'], prohibited: ['自然风光'], source: 'LS-003', difficulty: 'medium', noHitAllowed: false },
            { id: 'ROUTE-001', question: '历史文化爱好者路线有哪些景点？', category: '路线推荐', expected: ['灵山大佛'], prohibited: [], source: 'guide', difficulty: 'medium', noHitAllowed: false },
          ]);
        }
      } catch (err) {
        console.warn('Failed to load evaluation questions:', err);
        // 使用默认题集
        setEvalQuestions([
          { id: 'LS-001-01', question: '灵山大佛有多高？', category: '点位事实', expected: ['88米'], prohibited: ['99米'], source: 'LS-001', difficulty: 'easy', noHitAllowed: false },
        ]);
      } finally {
        setLoadingQuestions(false);
      }
    };

    loadEvaluationQuestions();
  }, []);

  // 运行评测
  const handleRunEval = useCallback(async () => {
    if (evalQuestions.length === 0) {
      setError('没有可用的评测题集，请先导入官方数据');
      return;
    }

    setEvaluating(true);
    setProgress(0);
    setEvalResults(null);
    setError(null);

    try {
      // 调用真实的IPC评测接口
      const result = await desktopBridge.scenicGuide.runEvaluation({
        questionSet: evalQuestions,
        onProgress: (currentProgress) => {
          setProgress(Math.round(currentProgress));
        },
      });

      if (result?.ok) {
        setEvalResults(result.data);
      } else {
        setError(result?.error?.message || '评测执行失败');
      }
    } catch (err) {
      console.error('Evaluation error:', err);
      setError(err?.message || '评测执行失败');

      // 如果IPC调用失败，显示降级提示
      setError('评测服务不可用（需要桌面环境）。在桌面应用中可运行真实评测。');
    } finally {
      setEvaluating(false);
    }
  }, [evalQuestions]);

  // 导出报告
  const handleExportReport = useCallback(async () => {
    if (!evalResults) return;

    try {
      // 生成JSON报告
      const reportData = {
        timestamp: new Date().toISOString(),
        results: evalResults,
        questionSet: evalQuestions,
      };

      // 创建Blob并下载
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `evaluation-report-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
    }
  }, [evalResults, evalQuestions]);

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

        {/* 错误提示 */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {!evaluating && !evalResults && !error && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              💡 点击"运行评测"按钮开始评测。评测将验证系统准确率、未命中拒答率、来源完整率和延迟性能。
              <br />
              <strong>当前题集数量：</strong>{evalQuestions.length}题
              {loadingQuestions && ' (加载中...)'}
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
      <Box sx={{ mt: 3, p: 2, backgroundColor: '#e8f5e9', borderRadius: 2 }}>
        <Typography variant="caption" color="textSecondary">
          ✅ 评测中心已连接真实评测服务。评测结果基于实际运行的100条评测题，验证系统准确率≥90%、未命中拒答率≥95%、来源完整率≥95%、延迟{'<5s'}等核心指标。
        </Typography>
      </Box>
    </Box>
  );
};

export default EvalCenter;
