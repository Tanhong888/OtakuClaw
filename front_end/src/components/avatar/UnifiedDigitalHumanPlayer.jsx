import { useCallback, useEffect, useState, useMemo } from 'react';
import { Box, CircularProgress, Alert, ToggleButtonGroup, ToggleButton, Chip } from '@mui/material';
import {
  Person as PersonIcon,
  SmartToy as RobotIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import Live2DViewer from '../live2d/Live2DViewer';
import IFlyAvatarPlayer from './IFlyAvatarPlayer';
import { digitalHumanConfig, DIGITAL_HUMAN_TYPE } from '../../services/digitalHumanConfig';

/**
 * 统一数字人播放器
 * 支持 Live2D 和 科大讯飞 AI 虚拟人切换
 */
function UnifiedDigitalHumanPlayer({
  currentModelPath = '',
  motions = [],
  expressions = [],
  text = '',
  onModelLoaded,
  onModelError,
  autoPlay = true,
  showTypeSelector = false,
  compact = false
}) {
  const [currentType, setCurrentType] = useState(digitalHumanConfig.getType());
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [playbackError, setPlaybackError] = useState(null);

  // 监听配置变化
  useEffect(() => {
    const unsubscribe = digitalHumanConfig.subscribe((config) => {
      setCurrentType(config.type);
    });
    return unsubscribe;
  }, []);

  // 获取实际使用的数字人类型
  const effectiveType = useMemo(() => {
    if (currentType === DIGITAL_HUMAN_TYPE.AUTO) {
      return digitalHumanConfig.isIflytekConfigured()
        ? DIGITAL_HUMAN_TYPE.IFLYTEK
        : DIGITAL_HUMAN_TYPE.LIVE2D;
    }
    return currentType;
  }, [currentType]);

  // 切换数字人类型
  const handleTypeChange = useCallback((event, newType) => {
    if (newType !== null) {
      digitalHumanConfig.setType(newType);
      setPlaybackError(null);
    }
  }, []);

  // Live2D 错误处理
  const handleLive2DError = useCallback((error) => {
    console.error('[UnifiedDigitalHumanPlayer] Live2D error:', error);
    // 如果Live2D失败且科大讯飞可用，自动切换
    if (digitalHumanConfig.isIflytekConfigured()) {
      digitalHumanConfig.setType(DIGITAL_HUMAN_TYPE.IFLYTEK);
      setPlaybackError('Live2D加载失败，已切换到AI虚拟人');
    } else {
      setPlaybackError('Live2D加载失败，请检查模型文件');
    }
    if (onModelError) {
      onModelError(error);
    }
  }, [onModelError]);

  // 科大讯飞错误处理
  const handleIflytekError = useCallback((error) => {
    console.error('[UnifiedDigitalHumanPlayer] iFlytek error:', error);
    setPlaybackError('AI虚拟人生成失败，请检查API配置');
  }, []);

  // 获取类型标签
  const getTypeLabel = (type) => {
    switch (type) {
      case DIGITAL_HUMAN_TYPE.LIVE2D:
        return 'Live2D';
      case DIGITAL_HUMAN_TYPE.IFLYTEK:
        return 'AI虚拟人';
      case DIGITAL_HUMAN_TYPE.AUTO:
        return '自动';
      default:
        return '未知';
    }
  };

  // 检查配置状态
  const live2dAvailable = currentModelPath && currentModelPath.length > 0;
  const iflytekAvailable = digitalHumanConfig.isIflytekConfigured();

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 1
      }}
    >
      {/* 类型选择器 */}
      {showTypeSelector && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            py: 1,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: 1,
            mb: 1
          }}
        >
          <ToggleButtonGroup
            value={currentType}
            exclusive
            onChange={handleTypeChange}
            size="small"
            aria-label="数字人类型选择"
          >
            <ToggleButton value={DIGITAL_HUMAN_TYPE.LIVE2D} aria-label="Live2D">
              <PersonIcon fontSize="small" />
              <span style={{ marginLeft: 4 }}>Live2D</span>
              {!live2dAvailable && <Chip size="small" label="未配置" variant="outlined" sx={{ ml: 1 }} />}
            </ToggleButton>
            <ToggleButton value={DIGITAL_HUMAN_TYPE.IFLYTEK} aria-label="AI虚拟人">
              <RobotIcon fontSize="small" />
              <span style={{ marginLeft: 4 }}>AI虚拟人</span>
              {!iflytekAvailable && <Chip size="small" label="未配置" variant="outlined" sx={{ ml: 1 }} />}
            </ToggleButton>
          </ToggleButtonGroup>

          {effectiveType !== DIGITAL_HUMAN_TYPE.LIVE2D && (
            <Chip
              icon={<SettingsIcon />}
              label="配置API"
              size="small"
              clickable
              onClick={() => setIsConfiguring(true)}
              color="primary"
              variant="outlined"
            />
          )}
        </Box>
      )}

      {/* 当前类型指示 */}
      {!showTypeSelector && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            left: 8,
            zIndex: 10,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: 1,
            px: 1,
            py: 0.5
          }}
        >
          <Chip
            size="small"
            label={getTypeLabel(effectiveType)}
            color={effectiveType === DIGITAL_HUMAN_TYPE.IFLYTEK ? 'secondary' : 'primary'}
            variant="outlined"
          />
        </Box>
      )}

      {/* 错误提示 */}
      {playbackError && (
        <Alert
          severity="warning"
          onClose={() => setPlaybackError(null)}
          sx={{
            position: 'absolute',
            top: showTypeSelector ? 60 : 8,
            right: 8,
            zIndex: 20,
            maxWidth: 400
          }}
        >
          {playbackError}
        </Alert>
      )}

      {/* 数字人渲染区域 */}
      <Box
        sx={{
          flex: 1,
          position: 'relative',
          borderRadius: 2,
          overflow: 'hidden',
          backgroundColor: '#f5f9ff'
        }}
      >
        {/* Live2D 渲染 */}
        {effectiveType === DIGITAL_HUMAN_TYPE.LIVE2D && (
          <Live2DViewer
            ref={(ref) => {
              if (ref && onModelLoaded) {
                ref.onModelLoaded = onModelLoaded;
                ref.onModelError = handleLive2DError;
              }
            }}
            currentModelPath={currentModelPath}
            motions={motions}
            expressions={expressions}
          />
        )}

        {/* 科大讯飞 AI 虚拟人 */}
        {effectiveType === DIGITAL_HUMAN_TYPE.IFLYTEK && (
          <IFlyAvatarPlayer
            text={text}
            voiceId={digitalHumanConfig.getIflytekConfig().voiceId}
            avatarId={digitalHumanConfig.getIflytekConfig().avatarId}
            autoPlay={autoPlay}
            onPlayEnd={() => console.log('[UnifiedDigitalHumanPlayer] Avatar playback ended')}
          />
        )}

        {/* 加载中指示器 */}
        {!live2dAvailable && !iflytekAvailable && (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              backgroundColor: 'rgba(245, 249, 255, 0.9)'
            }}
          >
            <CircularProgress size={48} />
            <Box sx={{ typography: 'body2', color: 'text.secondary' }}>
              正在初始化数字人...
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default UnifiedDigitalHumanPlayer;
