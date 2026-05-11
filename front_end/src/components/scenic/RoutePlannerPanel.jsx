import React, { useState } from 'react';
import {
  Box,
  Typography,
  FormGroup,
  FormLabel,
  FormControlLabel,
  Checkbox,
  Button,
  ToggleButtonGroup,
  ToggleButton,
  CircularProgress,
  Paper,
  Divider,
  Alert
} from '@mui/material';
import {
  History as HistoryIcon,
  Landscape as LandscapeIcon,
  FamilyRestroom as FamilyIcon,
  DirectionsWalk as WalkIcon,
  Accessibility as AccessibilityIcon,
  WaterDrop as WaterDropIcon,
  Speed as SpeedIcon,
  Restaurant as RestaurantIcon,
  Groups as GroupsIcon
} from '@mui/icons-material';

const RoutePlannerPanel = ({ onRouteGenerated, onRouteReset }) => {
  // 表单状态
  const [interests, setInterests] = useState([]);
  const [duration, setDuration] = useState('2h');
  const [crowd, setCrowd] = useState('solo');
  const [stamina, setStamina] = useState('moderate');
  const [specialNeeds, setSpecialNeeds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 选项定义
  const interestOptions = [
    { value: '历史文化', label: '历史文化', icon: <HistoryIcon fontSize="small" /> },
    { value: '自然风光', label: '自然风光', icon: <LandscapeIcon fontSize="small" /> },
    { value: '亲子互动', label: '亲子互动', icon: <FamilyIcon fontSize="small" /> },
    { value: '拍照打卡', label: '拍照打卡', icon: <LandscapeIcon fontSize="small" /> },
    { value: '轻松休闲', label: '轻松休闲', icon: <WalkIcon fontSize="small" /> }
  ];

  const durationOptions = [
    { value: '1h', label: '1小时' },
    { value: '2h', label: '2小时' },
    { value: 'half', label: '半日' },
    { value: 'full', label: '一日' }
  ];

  const crowdOptions = [
    { value: 'solo', label: '个人' },
    { value: 'couple', label: '情侣' },
    { value: 'family', label: '亲子' },
    { value: 'elderly', label: '老人' },
    { value: 'team', label: '研学团队' }
  ];

  const staminaOptions = [
    { value: 'easy', label: '轻松' },
    { value: 'moderate', label: '适中' },
    { value: 'intensive', label: '充实' }
  ];

  const specialNeedOptions = [
    { value: '无障碍', label: '无障碍' },
    { value: '雨天', label: '雨天' },
    { value: '少排队', label: '少排队' },
    { value: '餐饮优先', label: '餐饮优先' }
  ];

  // 处理兴趣选择
  const handleInterestToggle = (value) => {
    if (interests.includes(value)) {
      setInterests(interests.filter(i => i !== value));
    } else {
      setInterests([...interests, value]);
    }
    setError('');
  };

  // 处理特殊需求选择
  const handleSpecialNeedToggle = (value) => {
    if (specialNeeds.includes(value)) {
      setSpecialNeeds(specialNeeds.filter(n => n !== value));
    } else {
      setSpecialNeeds([...specialNeeds, value]);
    }
  };

  // 处理生成路线
  const handleGenerate = async () => {
    // 验证
    if (interests.length === 0) {
      setError('请至少选择一个兴趣偏好');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // TODO: 调用IPC接口生成路线
      // const result = await window.electron.ipcRenderer.invoke('scenic-guide:plan-route', {
      //   interests,
      //   duration,
      //   crowd,
      //   stamina,
      //   specialNeeds
      // });

      // Mock延迟
      await new Promise(resolve => setTimeout(resolve, 1500));

      const routeData = {
        interests,
        duration,
        crowd,
        stamina,
        specialNeeds,
        timestamp: Date.now()
      };

      if (onRouteGenerated) {
        onRouteGenerated(routeData);
      }
    } catch (err) {
      console.error('路线生成失败:', err);
      setError('路线生成失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 重置表单
  const handleReset = () => {
    setInterests([]);
    setDuration('2h');
    setCrowd('solo');
    setStamina('moderate');
    setSpecialNeeds([]);
    setError('');
    if (onRouteReset) {
      onRouteReset();
    }
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#fafafa', borderRadius: 2 }}>
      {/* 标题 */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
            🗺️ 路线规划
          </Typography>
          <Typography variant="caption" color="textSecondary" sx={{ ml: 2 }}>
            根据您的偏好推荐最佳游览路线
          </Typography>
        </Box>
      </Box>

      <Paper sx={{ p: 3, mb:3, backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        {/* 兴趣偏好 */}
        <FormGroup sx={{ mb: 3 }}>
          <FormLabel component="legend" sx={{ fontWeight: 'bold', mb: 2, color: '#333' }}>
            兴趣偏好（可多选）
          </FormLabel>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {interestOptions.map((option) => (
              <FormControlLabel
                key={option.value}
                control={
                  <Checkbox
                    checked={interests.includes(option.value)}
                    onChange={() => handleInterestToggle(option.value)}
                    sx={{ m: 0 }}
                  />
                }
                label={option.label}
              />
            ))}
          </Box>
        </FormGroup>

        <Divider sx={{ my: 3 }} />

        {/* 游览时长 */}
        <FormGroup sx={{ mb: 3 }}>
          <FormLabel component="legend" sx={{ fontWeight: 'bold', mb: 2, color: '#333' }}>
            游览时长
          </FormLabel>
          <ToggleButtonGroup
            value={duration}
            exclusive
            onChange={(e) => setDuration(e.target.value)}
            fullWidth
            sx={{ justifyContent: 'flex-start' }}
          >
            {durationOptions.map((option) => (
              <ToggleButton key={option.value} value={option.value} sx={{ flex: 1 }}>
                {option.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </FormGroup>

        <Divider sx={{ my: 3 }} />

        {/* 同行人群 */}
        <FormGroup sx={{ mb: 3 }}>
          <FormLabel component="legend" sx={{ fontWeight: 'bold', mb: 2, color: '#333' }}>
            同行人群
          </FormLabel>
          <ToggleButtonGroup
            value={crowd}
            exclusive
            onChange={(e) => setCrowd(e.target.value)}
            fullWidth
            sx={{ justifyContent: 'flex-start' }}
          >
            {crowdOptions.map((option) => (
              <ToggleButton key={option.value} value={option.value} sx={{ flex: 1 }}>
                {option.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </FormGroup>

        <Divider sx={{ my: 3 }} />

        {/* 体力偏好 */}
        <FormGroup sx={{ mb: 3 }}>
          <FormLabel component="legend" sx={{ fontWeight: 'bold', mb: 2, color: '#333' }}>
            体力偏好
          </FormLabel>
          <ToggleButtonGroup
            value={stamina}
            exclusive
            onChange={(e) => setStamina(e.target.value)}
            fullWidth
            sx={{ justifyContent: 'flex-start' }}
          >
            {staminaOptions.map((option) => (
              <ToggleButton key={option.value} value={option.value} sx={{ flex: 1 }}>
                {option.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </FormGroup>

        <Divider sx={{ my: 3 }} />

        {/* 特殊需求 */}
        <FormGroup sx={{ mb: 3 }}>
          <FormLabel component="legend" sx={{ fontWeight: 'bold', mb: 2, color: '#333' }}>
            特殊需求（可多选）
          </FormLabel>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {specialNeedOptions.map((option) => (
              <FormControlLabel
                key={option.value}
                control={
                  <Checkbox
                    checked={specialNeeds.includes(option.value)}
                    onChange={() => handleSpecialNeedToggle(option.value)}
                    sx={{ m: 0 }}
                  />
                }
                label={option.label}
              />
            ))}
          </Box>
        </FormGroup>

        {/* 错误提示 */}
        {error && (
          <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* 操作按钮 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={handleReset}
            disabled={loading}
            sx={{ minWidth: 120 }}
          >
            重置
          </Button>
          <Button
            variant="contained"
            onClick={handleGenerate}
            disabled={loading || interests.length === 0}
            sx={{ minWidth: 200, position: 'relative' }}
          >
            {loading ? (
              <>
                <CircularProgress size={24} sx={{ position: 'absolute', left: '50%', marginLeft: '-12px' }} />
                生成中...
              </>
            ) : '生成推荐路线'}
          </Button>
        </Box>
      </Paper>

      {/* 说明文字 */}
      <Box sx={{ mt: 2, p: 2, backgroundColor: '#fff3e0', borderRadius: 2 }}>
        <Typography variant="caption" color="textSecondary">
          💡 提示：选择至少一个兴趣偏好后点击"生成推荐路线"。系统将基于官方资料为您推荐最佳游览路线。
          当前显示的是前端界面，实际路线生成由后端服务完成。
        </Typography>
      </Box>
    </Box>
  );
};

export default RoutePlannerPanel;
