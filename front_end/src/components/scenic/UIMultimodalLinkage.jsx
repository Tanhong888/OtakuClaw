import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  Chip,
  Divider,
} from '@mui/material';
import {
  Image as ImageIcon,
  Place as PlaceIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import LatencyMonitor from './LatencyMonitor.jsx';

const UIMultimodalLinkage = ({ answerResult, latencyData }) => {
  const [matchedSpot, setMatchedSpot] = useState(null);
  const [routePath, setRoutePath] = useState([]);
  const [showMap, setShowMap] = useState(false);

  // 根据回答内容匹配景点
  useEffect(() => {
    if (!answerResult?.answer) {
      setMatchedSpot(null);
      setRoutePath([]);
      setShowMap(false);
      return;
    }

    // Mock景点匹配逻辑
    const spots = [
      {
        id: 'LS-001',
        name: '灵山大佛',
        imageUrl: '/images/lingshan-buddha.jpg', // Mock图片路径
        confidence: 95,
        keywords: ['灵山大佛', '大佛', '88米', '佛教'],
      },
      {
        id: 'LS-003',
        name: '祥符禅寺',
        imageUrl: '/images/xiangfu-temple.jpg',
        confidence: 88,
        keywords: ['祥符禅寺', '禅寺', '千年古刹'],
      },
      {
        id: 'LS-005',
        name: '灵山梵宫',
        imageUrl: '/images/brahma-palace.jpg',
        confidence: 92,
        keywords: ['灵山梵宫', '梵宫', '佛教艺术', '卢浮宫'],
      },
      {
        id: 'NH-001',
        name: '拈花湾',
        imageUrl: '/images/nianhua-bay.jpg',
        confidence: 85,
        keywords: ['拈花湾', '禅意小镇', '五印坛城'],
      },
    ];

    // 匹配逻辑
    const answer = answerResult.answer.toLowerCase();
    let matched = null;

    for (const spot of spots) {
      if (spot.keywords.some(keyword => answer.includes(keyword.toLowerCase()))) {
        matched = spot;
        break;
      }
    }

    setMatchedSpot(matched);

    // 如果匹配到景点，生成路线路径
    if (matched) {
      setRoutePath([
        { id: 'entrance', name: '景区入口', x: 10, y: 50 },
        { id: matched.id, name: matched.name, x: 50, y: 50 },
      ]);
      setShowMap(true);
    }
  }, [answerResult]);

  return (
    <Box sx={{ p: 3, backgroundColor: '#fafafa', borderRadius: 2 }}>
      {/* 标题 */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
            🎭 前端UI联动展示
          </Typography>
          <Typography variant="caption" color="textSecondary" sx={{ ml: 2 }}>
            多模态联动：数字人+景点图片+地图+延迟监控
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* 左侧：数字人讲解员 + 景点图片联动 */}
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 3,
              height: '100%',
              backgroundColor: 'white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              borderRadius: 2,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* 数字人讲解员 */}
            <Box sx={{ mb: 3, textAlign: 'center' }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                数字人讲解员
              </Typography>
              <Box
                sx={{
                  width: 200,
                  height: 200,
                  margin: '0 auto',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '0.875rem',
                  boxShadow: '0 8px 24px rgba(118, 75, 162, 0.3)',
                }}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                    灵山胜境
                  </Typography>
                  <Typography variant="body2">AI 导游</Typography>
                </Box>
              </Box>
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
                {answerResult ? '正在讲解中...' : '等待提问...'}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* 景点图片联动展示 */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                📸 景点图片联动展示
              </Typography>
              {matchedSpot ? (
                <Card
                  sx={{
                    height: 280,
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: 2,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'scale(1.02)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                    },
                  }}
                >
                  {/* 模拟景点图片 */}
                  <Box
                    sx={{
                      height: 200,
                      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '1.5rem',
                      fontWeight: 'bold',
                    }}
                  >
                    <Box sx={{ textAlign: 'center' }}>
                      <ImageIcon sx={{ fontSize: 64, mb: 1 }} />
                      <Typography variant="body1">{matchedSpot.name}</Typography>
                      <Typography variant="caption" sx={{ opacity: 0.9 }}>
                        （景点实景图）
                      </Typography>
                    </Box>
                  </Box>
                  <CardContent sx={{ pt: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="textSecondary">
                        匹配度:
                      </Typography>
                      <Chip
                        label={`${matchedSpot.confidence}%`}
                        size="small"
                        color={matchedSpot.confidence >= 90 ? 'success' : 'primary'}
                      />
                    </Box>
                    <Box sx={{ mt: 1 }}>
                      <Chip
                        label={`来源: ${matchedSpot.id}`}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </CardContent>
                </Card>
              ) : (
                <Box
                  sx={{
                    height: 280,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f5f5f5',
                    borderRadius: 2,
                    border: '2px dashed #e0e0e0',
                    color: '#999',
                  }}
                >
                  <Box sx={{ textAlign: 'center' }}>
                    <ImageIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                    <Typography variant="body2">
                      提问后将自动展示相关景点图片
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* 右侧：地图位置标记 + 延迟实时监控 */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* 地图位置标记 */}
            <Paper
              sx={{
                p: 3,
                backgroundColor: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                borderRadius: 2,
                height: 300,
              }}
            >
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                📍 地图位置标记
              </Typography>
              {showMap ? (
                <Box
                  sx={{
                    height: 220,
                    position: 'relative',
                    backgroundColor: '#e3f2fd',
                    borderRadius: 2,
                    border: '2px solid #2196f3',
                    overflow: 'hidden',
                  }}
                >
                  {/* 模拟地图 */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 49px, #e0e0e0 50%)',
                      backgroundSize: '100% 100%',
                      opacity: 0.3,
                    }}
                  />
                  {/* 路径线 */}
                  <svg
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                    }}
                  >
                    <defs>
                      <marker
                        id="arrowhead"
                        markerWidth="10"
                        markerHeight="7"
                        refX="9"
                        refY="3.5"
                        orient="auto"
                      >
                        <polygon points="0 0, 10 3.5, 0 7" fill="#2196f3" />
                      </marker>
                    </defs>
                    {routePath.length > 1 && (
                      <line
                        x1={`${routePath[0].x}%`}
                        y1={`${routePath[0].y}%`}
                        x2={`${routePath[routePath.length - 1].x}%`}
                        y2={`${routePath[routePath.length - 1].y}%`}
                        stroke="#2196f3"
                        strokeWidth="3"
                        markerEnd="url(#arrowhead)"
                        strokeDasharray="5,5"
                      >
                        <animate
                          attributeName="stroke-dashoffset"
                          from="10"
                          to="0"
                          dur="1s"
                          repeatCount="indefinite"
                        />
                      </line>
                    )}
                  </svg>
                  {/* 路径点 */}
                  {routePath.map((point, index) => (
                    <Box
                      key={point.id}
                      sx={{
                        position: 'absolute',
                        left: `${point.x}%`,
                        top: `${point.y}%`,
                        transform: 'translate(-50%, -50%)',
                        width: index === routePath.length - 1 ? 16 : 12,
                        height: index === routePath.length - 1 ? 16 : 12,
                        borderRadius: '50%',
                        backgroundColor: index === 0 ? '#4caf50' : index === routePath.length - 1 ? '#f44336' : '#2196f3',
                        border: '2px solid white',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.625rem',
                        color: 'white',
                        fontWeight: 'bold',
                        zIndex: 1,
                      }}
                    >
                      {index === 0 ? '起' : index === routePath.length - 1 ? '终' : ''}
                    </Box>
                  ))}
                  {/* 当前位置标记 */}
                  {matchedSpot && (
                    <Box
                      sx={{
                        position: 'absolute',
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center',
                      }}
                    >
                      <PlaceIcon
                        sx={{
                          fontSize: 40,
                          color: '#f44336',
                          filter: 'drop-shadow(0 2px 8px rgba(244, 63, 54, 0.5))',
                        }}
                      />
                      <Chip
                        label={matchedSpot.name}
                        size="small"
                        color="error"
                        sx={{
                          position: 'absolute',
                          top: -40,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          fontWeight: 'bold',
                        }}
                      />
                    </Box>
                  )}
                </Box>
              ) : (
                <Box
                  sx={{
                    height: 220,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f5f5f5',
                    borderRadius: 2,
                    border: '2px dashed #e0e0e0',
                    color: '#999',
                  }}
                >
                  <Box sx={{ textAlign: 'center' }}>
                    <PlaceIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
                    <Typography variant="body2">
                      提问后将自动显示地图路径
                    </Typography>
                  </Box>
                </Box>
              )}
            </Paper>

            {/* 延迟实时监控 */}
            <Paper
              sx={{
                p: 3,
                backgroundColor: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                borderRadius: 2,
                flex: 1,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  ⚡ 延迟实时监控
                </Typography>
                <SpeedIcon sx={{ color: '#4caf50' }} />
              </Box>
              <LatencyMonitor />
            </Paper>
          </Box>
        </Grid>
      </Grid>

      {/* 说明文字 */}
      <Box sx={{ mt: 3, p: 2, backgroundColor: '#e3f2fd', borderRadius: 2 }}>
        <Typography variant="caption" color="primary">
          💡 <strong>前端UI联动展示</strong>：当数字人讲解景点时，前端UI同步展示相关视觉内容。
          景点图片根据回答内容自动切换，地图路径动态绘制，延迟数据实时监控。
          当前使用Mock数据，实际使用时将接入真实的图片URL和地图服务。
        </Typography>
      </Box>
    </Box>
  );
};

export default UIMultimodalLinkage;
