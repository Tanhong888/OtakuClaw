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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import {
  People as PeopleIcon,
  Mic as MicIcon,
  Star as StarIcon,
  CheckCircle as CheckCircleIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';

// 统计卡片组件
const StatCard = ({ title, value, icon, color, trend }) => {
  const colors = {
    primary: '#1976d2',
    success: '#4caf50',
    warning: '#ff9800',
    info: '#2196f3',
    purple: '#9c27b0',
  };

  return (
    <Card
      sx={{
        height: '100%',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6,
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: `${colors[color]}15`,
              color: colors[color],
            }}
          >
            {icon}
          </Box>
          {trend && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                color: trend > 0 ? 'success.main' : 'error.main',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              <TrendingUpIcon fontSize="small" />
              <span>{Math.abs(trend)}%</span>
            </Box>
          )}
        </Box>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color: colors[color] }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
};

const AnalyticsDashboard = () => {
  const [loading, setLoading] = useState(true);

  // Mock数据 - 后续接入真实数据
  useEffect(() => {
    // 模拟数据加载
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // 核心指标数据
  const statsData = [
    {
      title: '今日服务人次',
      value: '1,247',
      icon: <PeopleIcon sx={{ fontSize: 32 }} />,
      color: 'primary',
      trend: 12.5,
    },
    {
      title: '语音问答次数',
      value: '856',
      icon: <MicIcon sx={{ fontSize: 32 }} />,
      color: 'info',
      trend: 8.3,
    },
    {
      title: '平均满意度',
      value: '4.6/5',
      icon: <StarIcon sx={{ fontSize: 32 }} />,
      color: 'warning',
      trend: 3.2,
    },
    {
      title: '知识库命中率',
      value: '87.5%',
      icon: <CheckCircleIcon sx={{ fontSize: 32 }} />,
      color: 'success',
      trend: -2.1,
    },
  ];

  // 热门问题Top10数据
  const hotQuestionsData = [
    { question: '灵山大佛有什么特色？', count: 156 },
    { question: '九龙灌浴适合什么时候看？', count: 142 },
    { question: '亲子家庭适合走哪条路线？', count: 128 },
    { question: '灵山梵宫为什么值得看？', count: 115 },
    { question: '第一次来怎么逛比较好？', count: 108 },
    { question: '门票价格是多少？', count: 97 },
    { question: '开放时间是几点到几点？', count: 89 },
    { question: '有停车场吗？', count: 78 },
    { question: '景区内有餐厅吗？', count: 72 },
    { question: '需要多长时间游览完？', count: 65 },
  ];

  // 游客画像数据
  const visitorPortraitData = [
    { name: '历史文化', value: 35, color: '#1976d2' },
    { name: '自然风光', value: 28, color: '#4caf50' },
    { name: '亲子互动', value: 18, color: '#ff9800' },
    { name: '拍照打卡', value: 12, color: '#f44336' },
    { name: '其他', value: 7, color: '#9c27b0' },
  ];

  // 满意度趋势数据
  const satisfactionTrendData = [
    { date: '5/1', satisfaction: 4.2, count: 856 },
    { date: '5/2', satisfaction: 4.3, count: 1024 },
    { date: '5/3', satisfaction: 4.4, count: 1247 },
    { date: '5/4', satisfaction: 4.5, count: 1156 },
    { date: '5/5', satisfaction: 4.6, count: 1389 },
    { date: '5/6', satisfaction: 4.5, count: 1423 },
    { date: '5/7', satisfaction: 4.6, count: 1567 },
    { date: '5/8', satisfaction: 4.7, count: 1634 },
    { date: '5/9', satisfaction: 4.6, count: 1589 },
    { date: '5/10', satisfaction: 4.6, count: 1724 },
  ];

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>加载中...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, backgroundColor: '#fafafa', borderRadius: 2 }}>
      {/* 标题 */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
            📊 数据分析
          </Typography>
          <Typography variant="caption" color="textSecondary" sx={{ ml: 2 }}>
            游客行为数据统计与分析
          </Typography>
        </Box>
      </Box>

      {/* 核心指标卡片 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
          核心指标
        </Typography>
        <Grid container spacing={2}>
          {statsData.map((stat, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <StatCard
                title={stat.title}
                value={stat.value}
                icon={stat.icon}
                color={stat.color}
                trend={stat.trend}
              />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* 图表区域 */}
      <Grid container spacing={3}>
        {/* 热门问题Top10 */}
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 2,
              height: 450,
              backgroundColor: 'white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              borderRadius: 2,
            }}
          >
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
              📈 热门问题 Top 10
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={hotQuestionsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis type="number" stroke="#666" style={{ fontSize: '12px' }} />
                <YAxis
                  dataKey="question"
                  type="category"
                  width={120}
                  stroke="#666"
                  style={{ fontSize: '11px' }}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.87)',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                  }}
                  formatter={(value) => [`${value}次`, '提问次数']}
                />
                <Bar dataKey="count" fill="#1976d2" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* 游客画像分布 */}
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 2,
              height: 450,
              backgroundColor: 'white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              borderRadius: 2,
            }}
          >
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
              👥 游客画像分布（基于14万+行为数据）
            </Typography>
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie
                  data={visitorPortraitData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {visitorPortraitData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.87)',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                  }}
                  formatter={(value) => [`${value}%`, '占比']}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="caption" color="textSecondary">
                💡 基于140,447条行为数据分析
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* 满意度趋势 */}
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 2,
              height: 400,
              backgroundColor: 'white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              borderRadius: 2,
            }}
          >
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
              ⭐ 满意度趋势（最近10天）
            </Typography>
            <ResponsiveContainer width="100%" height="85%">
              <LineChart data={satisfactionTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis
                  dataKey="date"
                  stroke="#666"
                  style={{ fontSize: '12px' }}
                />
                <YAxis
                  yAxisId="left"
                  stroke="#666"
                  domain={[4, 5]}
                  style={{ fontSize: '12px' }}
                  label={{ value: '满意度', angle: -90, position: 'insideLeft' }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="#666"
                  style={{ fontSize: '12px' }}
                  label={{ value: '人次', angle: 90, position: 'insideRight' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.87)',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: 10 }} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="satisfaction"
                  stroke="#ff9800"
                  strokeWidth={3}
                  name="平均满意度"
                  dot={{ r: 5 }}
                  activeDot={{ r: 7 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="count"
                  stroke="#1976d2"
                  strokeWidth={2}
                  name="服务人次"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* 说明文字 */}
      <Box sx={{ mt: 3, p: 2, backgroundColor: '#e3f2fd', borderRadius: 2 }}>
        <Typography variant="caption" color="primary">
          ℹ️ 当前显示的是Mock数据，实际使用时将从IPC接口获取真实的分析数据。
          所有统计数据基于官方资料包导入后的游客交互行为分析。
        </Typography>
      </Box>
    </Box>
  );
};

export default AnalyticsDashboard;
