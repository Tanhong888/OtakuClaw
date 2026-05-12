import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  IconButton,
  TextField,
  Typography,
  Paper,
  Chip,
  Stack,
} from '@mui/material';
import {
  Mic as MicIcon,
  Send as SendIcon,
  Route as RouteIcon,
  CameraAlt as CameraIcon,
  AdminPanelSettings as AdminIcon,
  TravelExplore as ExploreIcon,
} from '@mui/icons-material';
import { desktopBridge } from '../../services/desktopBridge';
import IFlyAvatarPlayer from '../avatar/IFlyAvatarPlayer.jsx';
import './MobileScenicGuideShell.css';

export default function MobileScenicGuideShell({
  onOpenAdminPortal,
  initialManifest = null,
}) {
  const [manifest, setManifest] = useState(initialManifest);
  const [questionText, setQuestionText] = useState('');
  const [askingQuestion, setAskingQuestion] = useState(false);
  const [answerResult, setAnswerResult] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [currentView, setCurrentView] = useState('avatar'); // 'avatar' | 'chat' | 'route'
  const [isRecording, setIsRecording] = useState(false);

  const imported = Boolean(
    manifest?.datasetId && manifest?.scenicId === 'lingshan' && Number(manifest?.importSummary?.spotCount || 0) > 0
  );
  const summary = manifest?.importSummary || {};

  const loadManifest = useCallback(async () => {
    setLoadingManifest(true);
    try {
      const result = await desktopBridge.scenicGuide.getManifest();
      if (result?.ok) {
        setManifest(result.manifest || null);
      } else {
        setFeedback({
          severity: 'warning',
          text: result?.error?.message || '资料状态读取失败',
        });
      }
    } catch (error) {
      setFeedback({
        severity: 'warning',
        text: error?.message || '资料状态读取失败',
      });
    } finally {
      setLoadingManifest(false);
    }
  }, []);

  useEffect(() => {
    void loadManifest();
  }, [loadManifest]);

  const suggestedQuestions = useMemo(
    () => [
      '灵山大佛有什么特色？',
      '第一次来，两小时怎么逛比较好？',
      '九龙灌浴适合什么时候看？',
      '亲子家庭适合走哪条路线？',
    ],
    [],
  );

  const handleAskQuestion = useCallback(async (nextQuestion) => {
    const normalizedQuestion = typeof nextQuestion === 'string' ? nextQuestion.trim() : questionText.trim();
    if (!normalizedQuestion || askingQuestion || !imported) {
      return;
    }

    setAskingQuestion(true);
    setFeedback(null);
    setQuestionText(normalizedQuestion);
    setCurrentView('avatar');

    try {
      const result = await desktopBridge.scenicGuide.askQuestion({
        question: normalizedQuestion,
        limit: 5,
      });
      if (result?.ok) {
        setAnswerResult(result);
      } else {
        setAnswerResult(null);
        setFeedback({
          severity: 'warning',
          text: result?.error?.message || '导览回答失败',
        });
      }
    } catch (error) {
      setAnswerResult(null);
      setFeedback({
        severity: 'warning',
        text: error?.message || '导览回答失败',
      });
    } finally {
      setAskingQuestion(false);
    }
  }, [questionText, askingQuestion, imported]);

  const handleVoiceInput = useCallback(() => {
    if (!imported) {
      setFeedback({
        severity: 'info',
        text: '请先导入官方资料包',
      });
      return;
    }

    if (isRecording) {
      setIsRecording(false);
    } else {
      setIsRecording(true);
      // 这里集成语音识别功能
      setTimeout(() => {
        setIsRecording(false);
        setQuestionText('灵山大佛有什么特色？');
      }, 3000);
    }
  }, [isRecording, imported]);

  const handleSuggestedQuestionClick = useCallback((question) => {
    setQuestionText(question);
    void handleAskQuestion(question);
  }, [handleAskQuestion]);

  const currentAnswer = answerResult?.answer || '';
  const currentAvatarText = askingQuestion ? '请稍等，正在检索资料...' : currentAnswer;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        height: '100dvh',
        backgroundColor: '#f5f9ff',
        overflow: 'hidden',
      }}
    >
      {/* 顶部状态栏 */}
      <Paper
        elevation={2}
        sx={{
          px: 2,
          py: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'white',
          borderRadius: 0,
          zIndex: 1000,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ExploreIcon color="primary" />
          <Typography variant="h6" noWrap sx={{ fontWeight: 700 }}>
            灵山胜境AI导游
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            size="small"
            label={imported ? `已导入${summary.spotCount || 0}个点位` : '未导入资料'}
            color={imported ? 'success' : 'default'}
          />
          <IconButton size="small" onClick={onOpenAdminPortal} color="inherit">
            <AdminIcon />
          </IconButton>
        </Box>
      </Paper>

      {/* 主要内容区域 */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* 数字人视频区域 */}
        <Box
          sx={{
            flex: currentView === 'avatar' ? 1 : 0,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'white',
            borderRadius: 2,
            mx: 1,
            mt: 1,
            overflow: 'hidden',
            transition: 'flex 0.3s ease',
          }}
        >
          <Box sx={{ flex: 1, position: 'relative' }}>
            <IFlyAvatarPlayer
              text={currentAvatarText}
              voiceId="female_guide"
              avatarId="professional_female"
              autoPlay={true}
              onPlayEnd={() => setCurrentView('chat')}
            />
          </Box>

          {/* 当前问题显示 */}
          {currentAnswer && (
            <Box
              sx={{
                px: 2,
                py: 1,
                backgroundColor: 'rgba(245, 249, 255, 0.9)',
                borderTop: 1,
                borderColor: 'divider',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                正在讲解: {answerResult?.question || questionText}
              </Typography>
            </Box>
          )}
        </Box>

        {/* 聊天区域 */}
        <Box
          sx={{
            flex: currentView === 'chat' ? 1 : 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            transition: 'flex 0.3s ease',
          }}
        >
          {/* 回答内容 */}
          {currentAnswer && (
            <Card
              sx={{
                mx: 1,
                mb: 1,
                p: 2,
                maxHeight: '40%',
                overflow: 'auto',
                backgroundColor: 'white',
              }}
            >
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {currentAnswer}
              </Typography>
              {answerResult?.sourceRefs && answerResult.sourceRefs.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Chip
                    size="small"
                    label={`来源: ${answerResult.sourceRefs[0].sourceId || '官方资料'}`}
                    color="primary"
                    variant="outlined"
                  />
                </Box>
              )}
            </Card>
          )}

          {/* 推荐问题 */}
          {!currentAnswer && imported && (
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                推荐问题
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {suggestedQuestions.map((question, index) => (
                  <Chip
                    key={index}
                    label={question}
                    variant="outlined"
                    size="small"
                    clickable
                    onClick={() => handleSuggestedQuestionClick(question)}
                    sx={{
                      height: 'auto',
                      py: 1,
                      '& .MuiChip-label': {
                        whiteSpace: 'normal',
                        textAlign: 'left',
                      },
                    }}
                  />
                ))}
              </Stack>
            </Box>
          )}
        </Box>
      </Box>

      {/* 底部输入区域 */}
      <Paper
        elevation={3}
        sx={{
          p: 2,
          backgroundColor: 'white',
          borderRadius: 0,
          zIndex: 1000,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            fullWidth
            size="small"
            placeholder="请输入您的问题..."
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleAskQuestion();
              }
            }}
            disabled={!imported || askingQuestion}
            multiline
            maxRows={2}
          />
          <IconButton
            color="primary"
            onClick={handleVoiceInput}
            disabled={!imported || askingQuestion}
            sx={{
              backgroundColor: isRecording ? 'error.main' : 'primary.main',
              color: 'white',
              '&:hover': {
                backgroundColor: isRecording ? 'error.dark' : 'primary.dark',
              },
              '&.Mui-disabled': {
                backgroundColor: 'action.disabledBackground',
              },
            }}
          >
            <MicIcon />
          </IconButton>
          <IconButton
            color="primary"
            onClick={() => void handleAskQuestion()}
            disabled={!imported || askingQuestion || !questionText.trim()}
            sx={{
              backgroundColor: 'primary.main',
              color: 'white',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
              '&.Mui-disabled': {
                backgroundColor: 'action.disabledBackground',
              },
            }}
          >
            {askingQuestion ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
          </IconButton>
        </Stack>

        {/* 快捷功能按钮 */}
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          <Button
            size="small"
            startIcon={<RouteIcon />}
            onClick={() => setCurrentView('route')}
            fullWidth
            variant="outlined"
          >
            路线推荐
          </Button>
          <Button
            size="small"
            startIcon={<CameraIcon />}
            onClick={() => setCurrentView('photo')}
            fullWidth
            variant="outlined"
          >
            拍照问导游
          </Button>
        </Stack>
      </Paper>

      {/* 反馈提示 */}
      {feedback && (
        <Alert
          severity={feedback.severity}
          onClose={() => setFeedback(null)}
          sx={{
            position: 'fixed',
            top: 70,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 2000,
            width: '90%',
            maxWidth: 400,
          }}
        >
          {feedback.text}
        </Alert>
      )}

      {/* 录音指示器 */}
      {isRecording && (
        <Box
          sx={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 3000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <CircularProgress size={80} color="error" />
          <Typography variant="h6" color="error">
            正在录音...
          </Typography>
          <Typography variant="body2" color="text.secondary">
            请说出您的问题
          </Typography>
        </Box>
      )}
    </Box>
  );
}
