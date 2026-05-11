import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  CircularProgress,
  Grid,
} from '@mui/material';
import {
  SentimentSatisfied as HappyIcon,
  SentimentNeutral as NeutralIcon,
  RecordVoiceOver as ListeningIcon,
  Psychology as ThinkingIcon,
  VolumeUp as SpeakingIcon,
  LocationOn as GuidingIcon,
  Favorite as HeartIcon,
  Wc as RespectIcon,
  Park as CheerfulIcon,
  ReportProblem as ApologizingIcon,
} from '@mui/icons-material';

// 数字人情感状态常量
export const DIGITAL_HUMAN_STATES = {
  IDLE: {
    key: 'IDLE',
    label: '待机',
    animation: 'breathing',
    expression: 'neutral',
    icon: <NeutralIcon />,
    color: '#757575',
    description: '等待用户提问',
  },
  LISTENING: {
    key: 'LISTENING',
    label: '聆听中',
    animation: 'nodding',
    expression: 'attentive',
    icon: <ListeningIcon />,
    color: '#2196f3',
    description: '正在聆听用户提问',
  },
  THINKING: {
    key: 'THINKING',
    label: '思考中',
    animation: 'thinking',
    expression: 'focused',
    icon: <ThinkingIcon />,
    color: '#ff9800',
    description: '正在检索知识库',
  },
  SPEAKING: {
    key: 'SPEAKING',
    label: '讲解中',
    animation: 'speaking',
    expression: 'dynamic',
    icon: <SpeakingIcon />,
    color: '#4caf50',
    description: '正在讲解回答',
    lipsync: true,
  },
  GUIDING: {
    key: 'GUIDING',
    label: '推荐路线',
    animation: 'pointing',
    expression: 'enthusiastic',
    icon: <GuidingIcon />,
    color: '#9c27b0',
    description: '正在推荐路线',
  },
  APOLOGIZING: {
    key: 'APOLOGIZING',
    label: '抱歉',
    animation: 'bowing',
    expression: 'regretful',
    icon: <ApologizingIcon />,
    color: '#f44336',
    description: '未命中或收到差评',
  },
  HAPPY: {
    key: 'HAPPY',
    label: '开心',
    animation: 'celebrating',
    expression: 'joyful',
    icon: <HappyIcon />,
    color: '#ff5722',
    description: '收到好评',
  },
  SOLEMN: {
    key: 'SOLEMN',
    label: '恭敬',
    animation: 'respectful',
    expression: 'reverent',
    icon: <RespectIcon />,
    color: '#7b1fa2',
    description: '讲述佛教文化',
  },
  CHEERFUL: {
    key: 'CHEERFUL',
    label: '愉快',
    animation: 'relaxed',
    expression: 'cheerful',
    icon: <CheerfulIcon />,
    color: '#00bcd4',
    description: '讲述自然风光',
  },
};

const DigitalHumanState = ({ currentState, emotion, confidence = 0 }) => {
  const state = DIGITAL_HUMAN_STATES[currentState] || DIGITAL_HUMAN_STATES.IDLE;

  return (
    <Box sx={{ p: 3, backgroundColor: '#fafafa', borderRadius: 2 }}>
      {/* 标题 */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
            🎭 数字人情感状态
          </Typography>
          <Typography variant="caption" color="textSecondary" sx={{ ml: 2 }}>
            状态机：{state.label}
          </Typography>
        </Box>
        <Chip
          label={`置信度: ${(confidence * 100).toFixed(0)}%`}
          size="small"
          color={confidence >= 0.8 ? 'success' : confidence >= 0.5 ? 'warning' : 'default'}
        />
      </Box>

      {/* 当前状态展示 */}
      <Grid container spacing={3}>
        {/* 状态卡片 */}
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 4,
              height: '100%',
              minHeight: 280,
              backgroundColor: 'white',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              borderRadius: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              },
            }}
          >
            {/* 背景动画效果 */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `linear-gradient(135deg, ${state.color}15 0%, ${state.color}05 100%)`,
                opacity: 0.5,
                animation: 'pulse 2s ease-in-out infinite',
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 0.3 },
                  '50%': { opacity: 0.5 },
                },
              }}
            />

            {/* 状态图标 */}
            <Box
              sx={{
                fontSize: 80,
                color: state.color,
                mb: 2,
                animation: `${state.animation} 2s ease-in-out infinite`,
                '@keyframes breathing': {
                  '0%, 100%': { transform: 'scale(1)' },
                  '50%': { transform: 'scale(1.05)' },
                },
                '@keyframes nodding': {
                  '0%, 100%': { transform: 'rotate(0deg)' },
                  '25%': { transform: 'rotate(-5deg)' },
                  '75%': { transform: 'rotate(5deg)' },
                },
                '@keyframes thinking': {
                  '0%, 100%': { transform: 'translateX(-5px)' },
                  '50%': { transform: 'translateX(5px)' },
                },
                '@keyframes speaking': {
                  '0%, 100%': { transform: 'scale(1)' },
                  '50%': { transform: 'scale(1.02)' },
                },
                '@keyframes pointing': {
                  '0%, 100%': { transform: 'translateX(0)' },
                  '25%': { transform: 'translateX(5px)' },
                  '75%': { transform: 'translateX(-5px)' },
                },
                '@keyframes bowing': {
                  '0%, 100%': { transform: 'rotate(0deg)' },
                  '50%': { transform: 'rotate(10deg)' },
                },
                '@keyframes celebrating': {
                  '0%, 100%': { transform: 'scale(1) rotate(0deg)' },
                  '25%': { transform: 'scale(1.1) rotate(-5deg)' },
                  '75%': { transform: 'scale(1.1) rotate(5deg)' },
                },
                '@keyframes respectful': {
                  '0%, 100%': { transform: 'scale(1)' },
                  '50%': { transform: 'scale(1.02)' },
                },
                '@keyframes relaxed': {
                  '0%, 100%': { transform: 'translateY(0)' },
                  '50%': { transform: 'translateY(-3px)' },
                },
              }}
            >
              {state.icon}
            </Box>

            {/* 状态标签 */}
            <Chip
              label={state.label}
              sx={{
                fontSize: '1.25rem',
                padding: '8px 16px',
                height: 'auto',
                backgroundColor: state.color,
                color: 'white',
                fontWeight: 'bold',
                borderRadius: 2,
              }}
            />

            {/* 状态描述 */}
            <Typography variant="body1" color="textSecondary" sx={{ mt: 2, textAlign: 'center' }}>
              {state.description}
            </Typography>

            {/* 动画类型 */}
            <Box sx={{ mt: 2 }}>
              <Chip
                label={`动画: ${state.animation}`}
                size="small"
                variant="outlined"
              />
            </Box>
          </Paper>
        </Grid>

        {/* 状态信息 */}
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
            {/* 状态详情 */}
            <Paper
              sx={{
                p: 3,
                flex: 1,
                backgroundColor: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                borderRadius: 2,
              }}
            >
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                状态详情
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    当前状态
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', color: state.color }}>
                    {state.label} ({currentState})
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    表情类型
                  </Typography>
                  <Typography variant="body1">
                    {state.expression}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    动画效果
                  </Typography>
                  <Typography variant="body1">
                    {state.animation}
                  </Typography>
                </Box>
                {state.lipsync && (
                  <Box>
                    <Typography variant="caption" color="textSecondary">
                      口型同步
                    </Typography>
                    <Chip label="已启用" size="small" color="success" />
                  </Box>
                )}
              </Box>
            </Paper>

            {/* 情感检测说明 */}
            <Paper
              sx={{
                p: 3,
                flex: 1,
                backgroundColor: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                borderRadius: 2,
              }}
            >
              <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                情感检测规则
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <Chip label="恭敬" size="small" sx={{ backgroundColor: '#7b1fa220', color: '#7b1fa2', minWidth: 60 }} />
                  <Typography variant="body2">
                    讲述佛教文化/历史典故
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <Chip label="愉快" size="small" sx={{ backgroundColor: '#00bcd420', color: '#00bcd4', minWidth: 60 }} />
                  <Typography variant="body2">
                    讲述自然风光/拍照点
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <Chip label="推荐" size="small" sx={{ backgroundColor: '#9c27b020', color: '#9c27b0', minWidth: 60 }} />
                  <Typography variant="body2">
                    推荐路线/亮点介绍
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <Chip label="抱歉" size="small" sx={{ backgroundColor: '#f4433620', color: '#f44336', minWidth: 60 }} />
                  <Typography variant="body2">
                    未命中/收到差评
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <Chip label="开心" size="small" sx={{ backgroundColor: '#ff572220', color: '#ff5722', minWidth: 60 }} />
                  <Typography variant="body2">
                    收到好评
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Box>
        </Grid>

        {/* 所有状态展示 */}
        <Grid item xs={12}>
          <Paper
            sx={{
              p: 3,
              backgroundColor: 'white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              borderRadius: 2,
            }}
          >
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
              所有可用状态（9种）
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {Object.values(DIGITAL_HUMAN_STATES).map((s) => (
                <Chip
                  key={s.key}
                  icon={s.icon}
                  label={s.label}
                  sx={{
                    backgroundColor: s.color,
                    color: 'white',
                    fontWeight: 'bold',
                    '&:hover': {
                      opacity: 0.9,
                    },
                  }}
                />
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* 说明文字 */}
      <Box sx={{ mt: 3, p: 2, backgroundColor: '#e3f2fd', borderRadius: 2 }}>
        <Typography variant="caption" color="primary">
          💡 <strong>数字人情感状态系统</strong>：根据回答内容自动检测情感，切换数字人的表情和动画。
          支持恭敬、愉快、推荐、抱歉、开心等多种情感状态，提升导览体验的沉浸感。
          当前状态可通过useDigitalHumanState Hook管理和切换。
        </Typography>
      </Box>
    </Box>
  );
};

export default DigitalHumanState;
