import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckCircleIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';

// 大屏指标卡片组件
const BigScreenMetricCard = ({ label, value, status, size = 'medium' }) => {
  const getSizeStyle = () => {
    switch (size) {
      case 'large':
        return { height: 180, fontSize: '3rem' };
      case 'medium':
        return { height: 140, fontSize: '2.2rem' };
      case 'small':
        return { height: 120, fontSize: '1.8rem' };
      default:
        return { height: 140, fontSize: '2.2rem' };
    }
  };

  const statusColors = {
    success: { bg: 'rgba(76, 175, 80, 0.15)', border: '#4caf50', text: '#4caf50' },
    warning: { bg: 'rgba(255, 152, 0, 0.15)', border: '#ff9800', text: '#ff9800' },
    info: { bg: 'rgba(33, 150, 243, 0.15)', border: '#2196f3', text: '#2196f3' },
  };

  const colorSet = statusColors[status] || statusColors.info;
  const sizeStyle = getSizeStyle();

  return (
    <Paper
      sx={{
        p: 2,
        height: sizeStyle.height,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(13, 71, 161, 0.08)',
        border: `2px solid ${colorSet.border}`,
        borderRadius: 3,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'scale(1.05)',
          backgroundColor: 'rgba(13, 71, 161, 0.12)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        },
      }}
    >
      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.87)', mb: 1, fontSize: '0.9rem' }}>
        {label}
      </Typography>
      <Typography
        variant="h3"
        sx={{
          fontWeight: 'bold',
          color: colorSet.text,
          fontSize: sizeStyle.fontSize,
          textShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}
      >
        {value}
      </Typography>
    </Paper>
  );
};

const ScenicBigScreen = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // 更新时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 实时延迟监控数据
  const latencyHistory = [
    { time: '10:00', latency: 1.8 },
    { time: '10:05', latency: 2.1 },
    { time: '10:10', latency: 1.6 },
    { time: '10:15', latency: 2.3 },
    { time: '10:20', latency: 1.9 },
    { time: '10:25', latency: 1.7 },
    { time: '10:30', latency: 2.0 },
  ];

  // 游客画像雷达图数据
  const visitorPortraitRadar = [
    { subject: '年龄', value: 75, fullMark: 100 },
    { subject: '性别', value: 82, fullMark: 100 },
    { subject: '消费', value: 68, fullMark: 100 },
    { subject: '停留时长', value: 90, fullMark: 100 },
    { subject: '满意度', value: 88, fullMark: 100 },
    { subject: '复游率', value: 72, fullMark: 100 },
  ];

  // 消费结构数据
  const consumptionStructure = [
    { name: '票务', value: 58, color: '#1976d2' },
    { name: '餐饮', value: 25, color: '#4caf50' },
    { name: '购物', value: 12, color: '#ff9800' },
    { name: '其他', value: 5, color: '#9c27b0' },
  ];

  // 核心指标数据
  const coreMetrics = {
    todayVisitors: 1247,
    voiceQA: 856,
    routeRec: 124,
    avgLatency: 1.8,
    maxLatency: 4.2,
    targetRate: 95,
    officialSpots: 22,
    behaviorRecords: '14万+',
    evalAccuracy: 92.3,
    satisfaction: 4.6,
  };

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0d47a1 0%, #1565c0 50%, #1976d2 100%)',
        color: 'white',
        p: 3,
        fontFamily: "'Microsoft YaHei', sans-serif",
      }}
    >
      {/* 头部 */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 'bold',
            mb: 1,
            textShadow: '0 4px 12px rgba(0,0,0,0.4)',
            fontSize: { xs: '1.8rem', md: '2.5rem' },
          }}
        >
          灵山胜境AI数字人导览系统 - 实时运营监控大屏
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 3, mt: 2 }}>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.87)' }}>
            📅 {currentTime.toLocaleDateString('zh-CN')}
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.87)' }}>
            🕐 {currentTime.toLocaleTimeString('zh-CN')}
          </Typography>
        </Box>
      </Box>

      {/* 主要内容区域 */}
      <Grid container spacing={3}>
        {/* 左侧：今日服务统计 */}
        <Grid item xs={12} md={3}>
          <Paper
            sx={{
              p: 3,
              height: 500,
              backgroundColor: 'rgba(13, 71, 161, 0.3)',
              border: '2px solid rgba(255,255,255,0.2)',
              borderRadius: 3,
              backdropFilter: 'blur(10px)',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, color: 'rgba(255,255,255,0.95)' }}>
              📊 今日服务
            </Typography>
            <BigScreenMetricCard
              label="服务人次"
              value={coreMetrics.todayVisitors.toLocaleString()}
              status="success"
              size="large"
            />
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.87)', mb: 1 }}>
                语音问答：{coreMetrics.voiceQA}次
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.87)', mb: 1 }}>
                路线推荐：{coreMetrics.routeRec}次
              </Typography>
            </Box>
            <Box sx={{ mt: 3, p: 2, backgroundColor: 'rgba(76, 175, 80, 0.15)', borderRadius: 2 }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.87)' }}>
                ⬆️ 较昨日增长 12.5%
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* 中间：实时延迟监控 */}
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 3,
              height: 500,
              backgroundColor: 'rgba(13, 71, 161, 0.3)',
              border: '2px solid rgba(255,255,255,0.2)',
              borderRadius: 3,
              backdropFilter: 'blur(10px)',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'rgba(255,255,255,0.95)' }}>
              ⚡ 实时问答延迟监控
            </Typography>
            <Box sx={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={latencyHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.2)" />
                  <XAxis
                    dataKey="time"
                    stroke="rgba(255,255,255,0.87)"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.87)"
                    label={{ value: '延迟（秒）', angle: -90, position: 'insideLeft', style: { fill: 'rgba(255,255,255,0.87)' } }}
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(0, 0, 0, 0.87)',
                      borderRadius: '4px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: 'white',
                    }}
                    formatter={(value) => [`${value}s`, '延迟']}
                  />
                  <Line
                    type="monotone"
                    dataKey="latency"
                    stroke="#4caf50"
                    strokeWidth={3}
                    dot={{ fill: '#4caf50', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="h5" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                平均: {coreMetrics.avgLatency}s | 最大: {coreMetrics.maxLatency}s | 目标: {'<5s'}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* 右侧：游客画像分布 */}
        <Grid item xs={12} md={3}>
          <Paper
            sx={{
              p: 3,
              height: 500,
              backgroundColor: 'rgba(13, 71, 161, 0.3)',
              border: '2px solid rgba(255,255,255,0.2)',
              borderRadius: 3,
              backdropFilter: 'blur(10px)',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: 'rgba(255,255,255,0.95)' }}>
              👥 游客画像分布
            </Typography>
            <Box sx={{ height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={visitorPortraitRadar}>
                  <PolarGrid stroke="rgba(255,255,255,0.2)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.87)', fontSize: 12 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: 'rgba(255,255,255,0.87)', fontSize: 10 }} />
                  <Radar
                    name="游客画像"
                    dataKey="value"
                    stroke="#ff9800"
                    fill="#ff9800"
                    fillOpacity={0.6}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </Box>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.87)', mb: 1, fontWeight: 'bold' }}>
                消费结构：
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {consumptionStructure.map((item) => (
                  <Box
                    key={item.name}
                    sx={{
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1,
                      backgroundColor: `${item.color}30`,
                      border: `1px solid ${item.color}`,
                      fontSize: '0.75rem',
                    }}
                  >
                    {item.name} {item.value}%
                  </Box>
                ))}
              </Box>
            </Box>
            <Box sx={{ mt: 2, p: 2, backgroundColor: 'rgba(33, 150, 243, 0.15)', borderRadius: 2 }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.87)' }}>
                📊 基于140,447条行为数据分析
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* 底部：核心指标展示 */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <BigScreenMetricCard label="官方点位" value={`${coreMetrics.officialSpots}个✅`} status="success" size="small" />
            <BigScreenMetricCard label="行为记录" value={coreMetrics.behaviorRecords} status="success" size="small" />
            <BigScreenMetricCard label="评测准确率" value={`${coreMetrics.evalAccuracy}%✅`} status="success" size="small" />
            <BigScreenMetricCard label="满意度" value={coreMetrics.satisfaction} status="success" size="small" />
          </Box>
        </Grid>

        {/* 热门问题Top5 */}
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 3,
              backgroundColor: 'rgba(13, 71, 161, 0.3)',
              border: '2px solid rgba(255,255,255,0.2)',
              borderRadius: 3,
              backdropFilter: 'blur(10px)',
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3, color: 'rgba(255,255,255,0.95)' }}>
              🔥 热门问题 Top 5
            </Typography>
            <Grid container spacing={2}>
              {[
                { rank: 1, question: '灵山大佛有什么特色？', count: 156 },
                { rank: 2, question: '九龙灌浴适合什么时候看？', count: 142 },
                { rank: 3, question: '亲子家庭适合走哪条路线？', count: 128 },
                { rank: 4, question: '灵山梵宫为什么值得看？', count: 115 },
                { rank: 5, question: '第一次来怎么逛比较好？', count: 108 },
              ].map((item) => (
                <Grid item xs={12} sm={6} md={2.4} key={item.rank}>
                  <Box
                    sx={{
                      p: 2,
                      backgroundColor: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.12)',
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          backgroundColor: item.rank <= 3 ? '#ff9800' : '#1976d2',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          mr: 1,
                        }}
                      >
                        {item.rank}
                      </Box>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.87)', fontSize: '0.75rem' }}>
                        {item.count}次
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'rgba(255,255,255,0.95)',
                        fontSize: '0.85rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {item.question}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* 底部说明 */}
      <Box sx={{ mt: 4, textAlign: 'center', p: 2, backgroundColor: 'rgba(13, 71, 161, 0.2)', borderRadius: 2 }}>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)' }}>
          ℹ️ 当前显示的是Mock数据，实际使用时将从IPC接口获取真实的运营数据。
          数据大屏优化分辨率：1920x1080 | 刷新频率：实时更新
        </Typography>
      </Box>
    </Box>
  );
};

export default ScenicBigScreen;
