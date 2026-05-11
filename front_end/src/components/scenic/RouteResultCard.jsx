import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Alert
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  DirectionsWalk as WalkIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  Star as StarIcon
} from '@mui/icons-material';

const RouteResultCard = ({ routeData, onReset }) => {
  if (!routeData) {
    return null;
  }

  // Mock路线数据 - 实际使用时将从后端获取
  const mockRoute = {
    routeId: 'official-history-culture-2h',
    name: '历史文化深度游（2小时精简版）',
    originalRoute: '历史文化爱好者路线（6小时完整版）',
    durationMinutes: 120,
    crowd: routeData.crowd || 'solo',
    stamina: routeData.stamina || 'moderate',
    spots: [
      {
        id: 'LS-001',
        name: '灵山大佛',
        duration: 50,
        highlights: '佛教文化体验的核心，88米高青铜立佛'
      },
      {
        id: 'LS-003',
        name: '祥符禅寺',
        duration: 40,
        highlights: '千年古刹的历史沉淀，感受禅宗文化'
      },
      {
        id: 'LS-005',
        name: '灵山梵宫',
        duration: 30,
        highlights: '佛教艺术的卢浮宫，精美建筑与文化艺术'
      }
    ],
    recommendationReason: `✓ 您选择了"${routeData.interests?.join('、')}"兴趣偏好\n✓ 官方"历史文化爱好者路线"与您偏好匹配度 92%\n✓ 该路线包含 3 个国家重点文物保护单位\n✓ 适合${routeData.duration === '2h' ? '两小时' : '您选择的时长'}快速游览`,
    source: '官方《灵山胜境：历史、文化、景点特色与个性化游览指南》',
    matchScore: 92
  };

  const crowdLabels = {
    solo: '个人',
    couple: '情侣',
    family: '亲子',
    elderly: '老人',
    team: '研学团队'
  };

  const staminaLabels = {
    easy: '轻松',
    moderate: '适中',
    intensive: '充实'
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#fafafa', borderRadius: 2 }}>
      {/* 标题 */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
            🎯 推荐路线
          </Typography>
          <Typography variant="caption" color="textSecondary" sx={{ ml: 2 }}>
            基于您的偏好生成的最佳游览路线
          </Typography>
        </Box>
        <Chip
          icon={<StarIcon />}
          label={`匹配度 ${mockRoute.matchScore}%`}
          color="primary"
          size="small"
          sx={{ fontWeight: 'bold' }}
        />
      </Box>

      {/* 路线卡片 */}
      <Card sx={{ mb: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
        <CardContent>
          {/* 路线名称和基本信息 */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#333' }}>
              {mockRoute.name}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
              <Chip
                icon={<ScheduleIcon />}
                label={`${mockRoute.durationMinutes}分钟`}
                size="small"
                color="info"
              />
              <Chip
                icon={<WalkIcon />}
                label={crowdLabels[mockRoute.crowd]}
                size="small"
              />
              <Chip
                label={staminaLabels[mockRoute.stamina]}
                size="small"
              />
              <Chip
                label={`${mockRoute.spots.length}个景点`}
                size="small"
                color="success"
              />
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* 推荐理由 */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
              <InfoIcon sx={{ verticalAlign: 'middle', mr: 0.5 }} />
              推荐理由
            </Typography>
            <Paper sx={{ p: 2, backgroundColor: '#e3f2fd', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-line', color: '#1565c0' }}>
                {mockRoute.recommendationReason}
              </Typography>
            </Paper>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* 行程安排 */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
              📋 行程安排
            </Typography>
            <List>
              {mockRoute.spots.map((spot, index) => (
                <React.Fragment key={spot.id}>
                  <ListItem alignItems="flex-start">
                    <ListItemIcon sx={{ minWidth: 40 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          backgroundColor: '#1976d2',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: '14px'
                        }}
                      >
                        {index + 1}
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            {spot.name}
                          </Typography>
                          <Chip
                            icon={<ScheduleIcon />}
                            label={`${spot.duration}分钟`}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                          {spot.highlights}
                        </Typography>
                      }
                    />
                  </ListItem>
                  {index < mockRoute.spots.length - 1 && <Divider variant="inset" component="li" />}
                </React.Fragment>
              ))}
            </List>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* 来源说明 */}
          <Box>
            <Typography variant="caption" color="textSecondary" sx={{ display: 'flex', alignItems: 'center' }}>
              <CheckCircleIcon sx={{ fontSize: 16, mr: 0.5, color: '#4caf50' }} />
              来源：{mockRoute.source}
            </Typography>
            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
              注：{mockRoute.originalRoute} 裁剪版
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* 提示信息 */}
      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="body2">
          💡 这是基于您选择的偏好生成的推荐路线。实际游览时可根据体力、时间和兴趣灵活调整。
          景点讲解可随时向AI导游提问。
        </Typography>
      </Alert>

      {/* 操作按钮 */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
        <button
          className="scenic-guide-route-button"
          type="button"
          onClick={onReset}
          style={{
            padding: '12px 32px',
            fontSize: '16px',
            fontWeight: 'bold',
            border: '2px solid #1976d2',
            borderRadius: '8px',
            backgroundColor: 'white',
            color: '#1976d2',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#1976d2';
            e.target.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = 'white';
            e.target.style.color = '#1976d2';
          }}
        >
          重新规划路线
        </button>
      </Box>
    </Box>
  );
};

export default RouteResultCard;
