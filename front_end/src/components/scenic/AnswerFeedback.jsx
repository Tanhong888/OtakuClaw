import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Chip,
  Paper,
  Collapse,
  Alert,
} from '@mui/material';
import {
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  SentimentSatisfied as GoodIcon,
  SentimentDissatisfied as BadIcon,
  SentimentVeryDissatisfied as VeryBadIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';

const AnswerFeedback = ({ onFeedback, disabled = false }) => {
  const [rating, setRating] = useState(null);
  const [selectedReasons, setSelectedReasons] = useState([]);
  const [showDetails, setShowDetails] = useState(false);

  // 快捷反馈选项
  const quickFeedbackOptions = [
    {
      id: 'too_long',
      label: '太长了',
      icon: '⏱️',
      color: '#ff9800',
    },
    {
      id: 'unclear',
      label: '没听懂',
      icon: '❓',
      color: '#2196f3',
    },
    {
      id: 'inaccurate',
      label: '不准确',
      icon: '❌',
      color: '#f44336',
    },
    {
      id: 'not_relevant',
      label: '不相关',
      icon: '🚫',
      color: '#9e9e9e',
    },
  ];

  // 处理点赞
  const handleThumbsUp = () => {
    const feedback = {
      type: 'positive',
      rating: 'up',
      timestamp: new Date().toISOString(),
    };
    setRating('up');
    setSelectedReasons([]);
    setShowDetails(false);
    if (onFeedback) {
      onFeedback(feedback);
    }
  };

  // 处理点踩
  const handleThumbsDown = () => {
    setRating('down');
    setShowDetails(true);
  };

  // 处理快捷反馈选择
  const handleQuickFeedback = (optionId) => {
    let newReasons = [...selectedReasons];

    if (newReasons.includes(optionId)) {
      // 取消选择
      newReasons = newReasons.filter(id => id !== optionId);
    } else {
      // 添加选择
      newReasons = [...newReasons, optionId];
    }

    setSelectedReasons(newReasons);

    // 自动提交反馈
    if (newReasons.length > 0) {
      const feedback = {
        type: 'negative',
        rating: 'down',
        reasons: newReasons,
        timestamp: new Date().toISOString(),
      };
      if (onFeedback) {
        onFeedback(feedback);
      }
    }
  };

  // 提交详细反馈
  const handleSubmitDetailed = () => {
    const feedback = {
      type: 'negative',
      rating: 'down',
      reasons: selectedReasons,
      comment: '���户未填写详细评论',
      timestamp: new Date().toISOString(),
    };
    if (onFeedback) {
      onFeedback(feedback);
    }
  };

  // 重置反馈
  const handleReset = () => {
    setRating(null);
    setSelectedReasons([]);
    setShowDetails(false);
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#fafafa', borderRadius: 2 }}>
      {/* 标题 */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
          这个回答有帮助吗？
        </Typography>
      </Box>

      {/* 点赞点踩按钮 */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <IconButton
          onClick={handleThumbsUp}
          disabled={disabled}
          sx={{
            p: 1.5,
            border: '2px solid #e0e0e0',
            borderRadius: 2,
            transition: 'all 0.3s ease',
            backgroundColor: rating === 'up' ? '#e8f5e9' : 'white',
            borderColor: rating === 'up' ? '#4caf50' : '#e0e0e0',
            '&:hover': {
              backgroundColor: '#e8f5e9',
              borderColor: '#4caf50',
            },
            '&:disabled': {
              opacity: 0.5,
              cursor: 'not-allowed',
            },
          }}
        >
          <ThumbUpIcon sx={{ fontSize: 28, color: rating === 'up' ? '#4caf50' : '#757575' }} />
        </IconButton>

        <IconButton
          onClick={handleThumbsDown}
          disabled={disabled}
          sx={{
            p: 1.5,
            border: '2px solid #e0e0e0',
            borderRadius: 2,
            transition: 'all 0.3s ease',
            backgroundColor: rating === 'down' ? '#ffebee' : 'white',
            borderColor: rating === 'down' ? '#f44336' : '#e0e0e0',
            '&:hover': {
              backgroundColor: '#ffebee',
              borderColor: '#f44336',
            },
            '&:disabled': {
              opacity: 0.5,
              cursor: 'not-allowed',
            },
          }}
        >
          <ThumbDownIcon sx={{ fontSize: 28, color: rating === 'down' ? '#f44336' : '#757575' }} />
        </IconButton>

        {/* 反馈状态提示 */}
        {rating && (
          <Chip
            label={rating === 'up' ? '感谢您的评价！' : '感谢您的反馈！'}
            size="small"
            color={rating === 'up' ? 'success' : 'warning'}
            sx={{ fontWeight: 'bold' }}
          />
        )}
      </Box>

      {/* 点踩后的快捷反馈选项 */}
      <Collapse in={rating === 'down' && showDetails}>
        <Paper
          sx={{
            p: 2,
            backgroundColor: 'white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            borderRadius: 2,
            mb: 2,
          }}
        >
          <Typography variant="caption" display="block" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
            请选择原因（可多选）：
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {quickFeedbackOptions.map((option) => (
              <Button
                key={option.id}
                variant={selectedReasons.includes(option.id) ? 'contained' : 'outlined'}
                size="small"
                onClick={() => handleQuickFeedback(option.id)}
                disabled={disabled}
                startIcon={<span>{option.icon}</span>}
                sx={{
                  borderColor: selectedReasons.includes(option.id) ? option.color : undefined,
                  backgroundColor: selectedReasons.includes(option.id) ? option.color : undefined,
                  color: selectedReasons.includes(option.id) ? 'white' : option.color,
                  fontWeight: selectedReasons.includes(option.id) ? 'bold' : 'normal',
                }}
              >
                {option.label}
              </Button>
            ))}
          </Box>

          {/* 选中的原因标签 */}
          {selectedReasons.length > 0 && (
            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
              <Typography variant="caption" color="textSecondary">
                已选择：
              </Typography>
              {selectedReasons.map((reasonId) => {
                const option = quickFeedbackOptions.find((opt) => opt.id === reasonId);
                return (
                  <Chip
                    key={reasonId}
                    label={`${option.icon} ${option.label}`}
                    size="small"
                    onDelete={() => handleQuickFeedback(reasonId)}
                    sx={{
                      backgroundColor: option.color,
                      color: 'white',
                      fontWeight: 'bold',
                    }}
                  />
                );
              })}
            </Box>
          )}
        </Paper>
      </Collapse>

      {/* 说明提示 */}
      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="caption">
          💡 您的反馈将帮助我们改进服务质量。点赞会让数字人开心，点踩会帮助我们发现问题。
        </Typography>
      </Alert>

      {/* 开发调试信息（仅开发环境显示） */}
      {process.env.NODE_ENV === 'development' && (
        <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 2 }}>
          <Box
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
            onClick={() => setShowDetails(!showDetails)}
          >
            <Typography variant="caption" sx={{ fontWeight: 'bold', mr: 1 }}>
              开发信息
            </Typography>
            {showDetails ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </Box>
          <Collapse in={showDetails}>
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" component="div" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                反馈数据结构：<br />
                {'{'}
                {'  type: \'positive\' | \'negative\','}
                {'  rating: \'up\' | \'down\','}
                {'  reasons?: string[],'}
                {'  timestamp: string,'}
                {'}'}
              </Typography>
            </Box>
          </Collapse>
        </Box>
      )}
    </Box>
  );
};

export default AnswerFeedback;
