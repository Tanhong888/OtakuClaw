import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Box, CircularProgress, Alert, IconButton } from '@mui/material';
import { VolumeUp, VolumeOff, PlayArrow } from '@mui/icons-material';
import { iFlyAvatarService } from '../../services/iflyAvatar';

/**
 * 科大讯飞AI虚拟人视频播放器
 * 用于Android APP展示AI数字人
 */
function IFlyAvatarPlayer({ text, voiceId, avatarId, onPlayEnd, autoPlay = true }) {
  const videoRef = useRef(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  /**
   * 生成虚拟人视频
   */
  const generateVideo = useCallback(async () => {
    if (!text || text.trim().length === 0) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = await iFlyAvatarService.generateAvatarVideo({
        text: text.trim(),
        voiceId,
        avatarId,
      });

      setVideoUrl(url);
      setLoading(false);

      // 自动播放
      if (autoPlay && videoRef.current) {
        videoRef.current.play().catch((err) => {
          console.error('[IFlyAvatarPlayer] 自动播放失败:', err);
        });
      }
    } catch (err) {
      console.error('[IFlyAvatarPlayer] 视频生成失败:', err);
      setError(err.message || '虚拟人视频生成失败');
      setLoading(false);
    }
  }, [text, voiceId, avatarId, autoPlay]);

  /**
   * 当文本变化时重新生成视频
   */
  useEffect(() => {
    generateVideo();
  }, [generateVideo]);

  /**
   * 视频播放结束回调
   */
  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    if (onPlayEnd) {
      onPlayEnd();
    }
  }, [onPlayEnd]);

  /**
   * 视频播放状态变化
   */
  const handlePlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  /**
   * 切换静音
   */
  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  /**
   * 手动播放
   */
  const handlePlayClick = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.error('[IFlyAvatarPlayer] 播放失败:', err);
      });
    }
  }, []);

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f9ff',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      {/* 加载状态 */}
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <CircularProgress size={60} />
          <Box sx={{ typography: 'body2', color: 'text.secondary' }}>
            AI虚拟人生成中...
          </Box>
        </Box>
      )}

      {/* 错误状态 */}
      {error && (
        <Alert severity="error" sx={{ position: 'absolute', zIndex: 10 }}>
          {error}
        </Alert>
      )}

      {/* 视频播放器 */}
      {videoUrl && !loading && !error && (
        <>
          <video
            ref={videoRef}
            src={videoUrl}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
            playsInline
            webkit-playsinline
            onEnded={handleEnded}
            onPlay={handlePlay}
            onPause={handlePause}
          />

          {/* 控制按钮 */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 16,
              right: 16,
              display: 'flex',
              gap: 1,
              zIndex: 5,
            }}
          >
            {!isPlaying && (
              <IconButton
                onClick={handlePlayClick}
                size="large"
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 1)',
                  },
                }}
              >
                <PlayArrow />
              </IconButton>
            )}
            <IconButton
              onClick={toggleMute}
              size="large"
              sx={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 1)',
                },
              }}
            >
              {isMuted ? <VolumeOff /> : <VolumeUp />}
            </IconButton>
          </Box>
        </>
      )}

      {/* 空状态 */}
      {!videoUrl && !loading && !error && (
        <Box
          sx={{
            typography: 'h6',
            color: 'text.secondary',
            textAlign: 'center',
          }}
        >
          AI数字人准备就绪
        </Box>
      )}
    </Box>
  );
}

export default IFlyAvatarPlayer;
