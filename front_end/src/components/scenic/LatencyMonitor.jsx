import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Chip
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// 指标卡片组件
const MetricCard = ({ label, value, target, status }) => {
  const getStatusColor = () => {
    if (status === 'success') return '#4caf50';
    if (status === 'warning') return '#ff9800';
    return '#757575';
  };

  return (
    <Paper
      sx={{
        p: 2,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: status === 'success' ? '#e8f5e9' : status === 'warning' ? '#fff3e0' : '#f5f5f5',
        border: `2px solid ${getStatusColor()}`,
        borderRadius: 2,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 3
        }
      }}
    >
      <Typography variant="caption" color="textSecondary" gutterBottom>
        {label}
      </Typography>
      <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', my: 1 }}>
        {value}
      </Typography>
      <Chip
        label={`目标: ${target}`}
        size="small"
        color={status === 'success' ? 'success' : status === 'warning' ? 'warning' : 'default'}
      />
    </Paper>
  );
};

const LatencyMonitor = () => {
  const [latencyData, setLatencyData] = useState([]);
  const [avgLatency, setAvgLatency] = useState(0);
  const [firstSentenceLatency, setFirstSentenceLatency] = useState(0);
  const [maxLatency, setMaxLatency] = useState(0);
  const [within5sRate, setWithin5sRate] = useState(0);

  // Mock数据 - 后续接入真实数据
  useEffect(() => {
    const mockData = [
      { time: '10:00:00', asr: 0.6, rag: 0.3, llm: 0.7, tts: 0.4, complete: 2.0 },
      { time: '10:00:05', asr: 0.5, rag: 0.2, llm: 0.6, tts: 0.3, complete: 1.6 },
      { time: '10:00:10', asr: 0.7, rag: 0.3, llm: 0.8, tts: 0.5, complete: 2.3 },
      { time: '10:00:15', asr: 0.6, rag: 0.2, llm: 0.5, tts: 0.4, complete: 1.7 },
      { time: '10:00:20', asr: 0.5, rag: 0.3, llm: 0.7, tts: 0.3, complete: 1.8 },
      { time: '10:00:25', asr: 0.6, rag: 0.2, llm: 0.6, tts: 0.4, complete: 1.8 },
      { time: '10:00:30', asr: 0.5, rag: 0.3, llm: 0.7, tts: 0.3, complete: 1.9 },
    ];

    setLatencyData(mockData);

    // 计算统计数据
    const completeLatencies = mockData.map(d => d.complete);
    const avg = completeLatencies.reduce((a, b) => a + b, 0) / completeLatencies.length;
    const max = Math.max(...completeLatencies);
    const within5s = (completeLatencies.filter(l => l < 5).length / completeLatencies.length) * 100;

    setAvgLatency(avg.toFixed(1));
    setFirstSentenceLatency((avg * 0.6).toFixed(1)); // 假设首句是平均的60%
    setMaxLatency(max.toFixed(1));
    setWithin5sRate(Math.round(within5s));
  }, []);

  return (
    <Box sx={{ p: 3, backgroundColor: '#fafafa', borderRadius: 2 }}>
      {/* 标题和说明 */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
            📊 实时问答延迟监控
          </Typography>
          <Typography variant="caption" color="textSecondary" sx={{ ml: 2 }}>
            监控ASR/RAG/LLM/TTS各环节延迟，确保{'<5秒'}达标
          </Typography>
        </Box>
        <Chip
          label="核心攻坚指标"
          color="primary"
          size="small"
          sx={{ fontWeight: 'bold' }}
        />
      </Box>

      {/* 延迟折线图 */}
      <Paper
        sx={{
          p: 2,
          mb: 3,
          height: 350,
          backgroundColor: 'white',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderRadius: 2
        }}
      >
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
          延迟趋势图（最近7次问答）
        </Typography>
        <ResponsiveContainer width="100%" height="90%">
          <LineChart data={latencyData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
            <XAxis
              dataKey="time"
              stroke="#666"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#666"
              label="延迟（秒）"
              style={{ fontSize: '12px' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.87)',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}
              formatter={(value) => `${value}s`}
              labelFormatter={(label) => label}
            />
            <Legend wrapperStyle={{ paddingTop: 20 }} />
            <Line
              type="monotone"
              dataKey="asr"
              stroke="#8884d8"
              name="ASR"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="rag"
              stroke="#82ca9d"
              name="RAG"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="llm"
              stroke="#ffc658"
              name="LLM首token"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="tts"
              stroke="#ff7300"
              name="TTS首音"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="complete"
              stroke="#000000"
              name="完整链路"
              strokeWidth={3}
              dot={{ r: 5 }}
              activeDot={{ r: 7 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Paper>

      {/* 核心指标卡片 */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
          核心性能指标
        </Typography>
      </Box>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            label="平均延迟"
            value={`${avgLatency}s`}
            target="<5s"
            status={avgLatency < 5 ? 'success' : 'warning'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            label="首句延迟"
            value={`${firstSentenceLatency}s`}
            target="<2s"
            status={firstSentenceLatency < 2 ? 'success' : 'warning'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            label="最大延迟"
            value={`${maxLatency}s`}
            target="<5s"
            status={maxLatency < 5 ? 'success' : 'warning'}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            label="目标达成率"
            value={`${within5sRate}%`}
            target=">95%"
            status={within5sRate >= 95 ? 'success' : 'warning'}
          />
        </Grid>
      </Grid>

      {/* 说明文字 */}
      <Box sx={{ mt: 3, p: 2, backgroundColor: '#e3f2fd', borderRadius: 2 }}>
        <Typography variant="caption" color="primary">
          ℹ️ 当前显示的是Mock数据，实际使用时将从IPC接口获取真实的延迟数据。
          此仪表盘用于证明系统延迟{'<5秒'}达标，是比赛核心攻坚指标之一。
        </Typography>
      </Box>
    </Box>
  );
};

export default LatencyMonitor;
