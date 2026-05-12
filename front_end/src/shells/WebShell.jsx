import { useCallback, useState, useMemo } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Stack,
  Chip,
  Divider,
} from '@mui/material';
import {
  CloudUpload,
  Settings,
  Chat,
  Info,
  Checkroom,
  Extension,
  Storage,
  Security,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ChatSidebar from '../components/chat/ChatSidebar.jsx';
import ConfigDrawer from '../components/config/ConfigDrawer.jsx';
import { desktopBridge } from '../services/desktopBridge.js';

/**
 * Web Shell Component
 * 用于浏览器环境的OtakuClaw应用界面
 * 提供与桌面版类似的功能，但针对Web环境进行了优化
 */
function WebShell({
  desktopMode = false,
  platform = { platform: 'web' },
  live2dViewerRef,
  currentModelPath = '',
  motions = [],
  expressions = [],
  onModelLoaded,
  onModelError,
  subtitleText = '',
  onOpenConfigPanel,
  textComposerProps,
  showChatPanel = false,
  onOpenChatPanel,
  onCloseChatPanel,
  chatMessages = [],
  onClearHistory,
  isStreaming = false,
  showVoicePermissionWarning = false,
  voicePermissionWarningText = '',
}) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [webFeatures, setWebFeatures] = useState({
    chatAvailable: true,
    voiceAvailable: false,
    modelImportAvailable: false,
    screenshotAvailable: false,
    desktopSyncAvailable: false,
  });

  // 检测浏览器功能可用性
  const detectBrowserFeatures = useCallback(() => {
    const features = {
      chatAvailable: true, // Web聊天总是可用
      voiceAvailable: typeof MediaRecorder !== 'undefined' && typeof AudioContext !== 'undefined',
      modelImportAvailable: typeof FileReader !== 'undefined',
      screenshotAvailable: false, // Web环境中截屏需要特殊API
      desktopSyncAvailable: false, // Web环境无法与桌面同步
    };
    setWebFeatures(features);
    return features;
  }, []);

  // 初始化时检测功能
  useState(() => {
    detectBrowserFeatures();
  });

  const handleTabChange = useCallback((event, newValue) => {
    setActiveTab(newValue);
  }, []);

  const handleNavigateToGuide = useCallback(() => {
    navigate('/scenic-guide');
  }, [navigate]);

  const handleOpenConfig = useCallback(() => {
    if (onOpenConfigPanel) {
      onOpenConfigPanel();
    }
  }, [onOpenConfigPanel]);

  const handleOpenChat = useCallback(() => {
    if (onOpenChatPanel) {
      onOpenChatPanel();
    }
  }, [onOpenChatPanel]);

  // Web功能状态显示
  const FeatureStatus = ({ icon: Icon, label, available, description }) => (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 2,
        p: 2,
        borderRadius: 1,
        bgcolor: available ? 'action.hover' : 'action.disabledBackground',
      }}
    >
      <Icon
        sx={{
          color: available ? 'success.main' : 'disabled',
          mt: 0.5,
        }}
      />
      <Box sx={{ flex: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
          {label}
          <Chip
            size="small"
            label={available ? '可用' : '不可用'}
            color={available ? 'success' : 'default'}
            sx={{ ml: 1 }}
          />
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'radial-gradient(circle at top, rgba(39, 57, 92, 0.45), rgba(12, 16, 24, 0.15)), linear-gradient(180deg, #131c2d 0%, #0b111c 100%)'
            : 'radial-gradient(circle at top, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.06)), linear-gradient(180deg, #e5eeff 0%, #f9fbff 100%)',
      }}
    >
      {/* 顶部导航栏 */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 0,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Container maxWidth="lg">
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ py: 2 }}>
            <Stack direction="row" alignItems="center" gap={2}>
              <Box
                component="img"
                src="/logo.png"
                alt="OtakuClaw"
                sx={{ width: 40, height: 40, borderRadius: 1 }}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <Box>
                <Typography variant="h6" component="h1" sx={{ fontWeight: 700 }}>
                  OtakuClaw
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Web 版 - 智能数字人导览系统
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<Info />}
                onClick={handleNavigateToGuide}
              >
                景点导览
              </Button>
              <Button
                variant="outlined"
                startIcon={<Chat />}
                onClick={handleOpenChat}
              >
                对话
              </Button>
              <Button
                variant="contained"
                startIcon={<Settings />}
                onClick={handleOpenConfig}
              >
                设置
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Paper>

      {/* 主要内容区域 */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* 欢迎信息 */}
        <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
          <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 700 }}>
            欢迎使用 OtakuClaw Web 版
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            OtakuClaw 是一个基于 AI 的智能数字人导览系统，支持景点导览、智能对话等多种功能。
            当前您正在使用 Web 版本，部分桌面版功能可能不可用。
          </Typography>

          {/* 语音权限警告 */}
          {showVoicePermissionWarning && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              {voicePermissionWarningText || '麦克风权限不可用，语音功能受限。'}
            </Alert>
          )}
        </Paper>

        {/* 功能选项卡 */}
        <Paper elevation={2} sx={{ mb: 4 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="功能概览" />
            <Tab label="系统状态" />
            <Tab label="使用指南" />
            <Tab label="下载桌面版" />
          </Tabs>

          <Box sx={{ p: 3 }}>
            {/* 功能概览标签 */}
            {activeTab === 0 && (
              <Stack spacing={3}>
                <Typography variant="h6" gutterBottom>
                  可用功能
                </Typography>
                <FeatureStatus
                  icon={Chat}
                  label="智能对话"
                  available={webFeatures.chatAvailable}
                  description="与 AI 数字人进行实时对话，获取信息和帮助"
                />
                <FeatureStatus
                  icon={Extension}
                  label="语音交互"
                  available={webFeatures.voiceAvailable}
                  description="使用语音输入与数字人进行自然对话交互"
                />
                <FeatureStatus
                  icon={Checkroom}
                  label="Live2D 模型"
                  available={webFeatures.modelImportAvailable}
                  description="导入和使用 Live2D 数字人模型"
                />
                <FeatureStatus
                  icon={CloudUpload}
                  label="屏幕截图"
                  available={webFeatures.screenshotAvailable}
                  description="捕获屏幕内容并与数字人分享（仅桌面版）"
                />
                <FeatureStatus
                  icon={Storage}
                  label="桌面同步"
                  available={webFeatures.desktopSyncAvailable}
                  description="与桌面版应用同步数据和设置（仅桌面版）"
                />
              </Stack>
            )}

            {/* 系统状态标签 */}
            {activeTab === 1 && (
              <Stack spacing={3}>
                <Typography variant="h6" gutterBottom>
                  系统信息
                </Typography>
                <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
                  <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      运行环境
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {platform.platform || 'Web Browser'}
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      用户代理
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                      {typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 30) + '...' : 'Unknown'}
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      桌面模式
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {desktopMode ? '是' : '否'}
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      当前模型
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                      {currentModelPath ? '已加载' : '未加载'}
                    </Typography>
                  </Box>
                </Box>

                {/* 存储使用情况 */}
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    本地存储
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {['localStorage', 'sessionStorage'].map((storageType) => {
                      try {
                        window[storageType].setItem('test', 'test');
                        window[storageType].removeItem('test');
                        return (
                          <Chip
                            key={storageType}
                            label={`${storageType} 可用`}
                            color="success"
                            size="small"
                          />
                        );
                      } catch {
                        return (
                          <Chip
                            key={storageType}
                            label={`${storageType} 不可用`}
                            color="error"
                            size="small"
                          />
                        );
                      }
                    })}
                  </Box>
                </Box>
              </Stack>
            )}

            {/* 使用指南标签 */}
            {activeTab === 2 && (
              <Stack spacing={3}>
                <Typography variant="h6" gutterBottom>
                  快速开始
                </Typography>
                <Box>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                    1. 对话功能
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    点击右上角的"对话"按钮，打开聊天面板，然后输入您的问题。
                    AI 数字人将实时回复您的提问。
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                    2. 景点导览
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    点击"景点导览"按钮，进入智能导览模式，获取景点信息和路线推荐。
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                    3. 设置配置
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    点击"设置"按钮，配置 API 密钥、模型选择和其他应用设置。
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                    4. 数据持久化
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Web 版使用浏览器本地存储保存您的设置和对话历史。
                    清除浏览器数据可能会丢失这些信息。
                  </Typography>
                </Box>
              </Stack>
            )}

            {/* 下载桌面版标签 */}
            {activeTab === 3 && (
              <Stack spacing={3}>
                <Typography variant="h6" gutterBottom>
                  获取完整功能
                </Typography>
                <Alert severity="info">
                  <Typography variant="body2">
                    桌面版提供更多高级功能，包括本地模型运行、屏幕捕获、文件系统集成等。
                  </Typography>
                </Alert>

                <Stack spacing={2}>
                  <Box
                    sx={{
                      p: 3,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 2,
                      bgcolor: 'background.paper',
                    }}
                  >
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          Windows 版本
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          支持 Windows 10/11，提供完整桌面功能
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        startIcon={<CloudUpload />}
                        href="https://github.com/otakuclaw/otakuclaw-desktop/releases"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        下载
                      </Button>
                    </Stack>
                  </Box>

                  <Box
                    sx={{
                      p: 3,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 2,
                      bgcolor: 'background.paper',
                    }}
                  >
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          macOS 版本
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          支持 macOS 11+，支持 Intel 和 Apple Silicon
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        startIcon={<CloudUpload />}
                        href="https://github.com/otakuclaw/otakuclaw-desktop/releases"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        下载
                      </Button>
                    </Stack>
                  </Box>

                  <Box
                    sx={{
                      p: 3,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 2,
                      bgcolor: 'background.paper',
                    }}
                  >
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          Linux 版本
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          支持 Ubuntu/Debian 等 Linux 发行版
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        startIcon={<CloudUpload />}
                        href="https://github.com/otakuclaw/otakuclaw-desktop/releases"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        下载
                      </Button>
                    </Stack>
                  </Box>
                </Stack>
              </Stack>
            )}
          </Box>
        </Paper>

        {/* 当前对话预览 */}
        {chatMessages.length > 0 && (
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              最近对话
            </Typography>
            <Stack spacing={2}>
              {chatMessages.slice(-3).map((message, index) => (
                <Box
                  key={index}
                  sx={{
                    p: 2,
                    bgcolor: message.role === 'user' ? 'action.hover' : 'action.selected',
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                    {message.role === 'user' ? '用户' : 'AI 数字人'}
                  </Typography>
                  <Typography variant="body2">
                    {message.content}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Paper>
        )}
      </Container>

      {/* 页脚 */}
      <Box
        component="footer"
        sx={{
          mt: 4,
          py: 3,
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Container maxWidth="lg">
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
          >
            <Typography variant="body2" color="text.secondary">
              © 2025 OtakuClaw. Web 版本.
            </Typography>
            <Stack direction="row" spacing={2}>
              <Typography
                component="a"
                variant="body2"
                color="primary"
                href="https://github.com/otakuclaw"
                target="_blank"
                rel="noopener noreferrer"
                sx={{ textDecoration: 'none' }}
              >
                GitHub
              </Typography>
              <Typography
                component="a"
                variant="body2"
                color="primary"
                href="/privacy"
                sx={{ textDecoration: 'none' }}
              >
                隐私政策
              </Typography>
              <Typography
                component="a"
                variant="body2"
                color="primary"
                href="/terms"
                sx={{ textDecoration: 'none' }}
              >
                使用条款
              </Typography>
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}

export default WebShell;
