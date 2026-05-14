/**
 * Web Error Boundary
 * Web端错误边界组件，捕获并处理React组件错误
 */

import { Component } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  Paper,
  Stack,
  Chip,
} from '@mui/material';
import {
  ErrorOutline,
  Refresh,
  Home,
  BugReport,
} from '@mui/icons-material';

class WebErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    // 生成错误ID
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.setState({
      error,
      errorInfo,
      errorId,
    });

    // 记录错误到控制台
    console.error(`[WebErrorBoundary: ${errorId}]`, error, errorInfo);

    // 可以在这里将错误发送到错误跟踪服务
    this.logError(error, errorInfo, errorId);
  }

  /**
   * 记录错误到外部服务
   */
  logError(error, errorInfo, errorId) {
    const errorData = {
      id: errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // 可以发送到错误跟踪服务（如Sentry）
    if (this.props.onError) {
      this.props.onError(errorData);
    }

    // 也可以发送到自己的API
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorData),
      }).catch((err) => {
        console.warn('[WebErrorBoundary] 无法发送错误报告:', err);
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, errorId } = this.state;

      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: (theme) =>
              theme.palette.mode === 'dark'
                ? 'linear-gradient(180deg, #131c2d 0%, #0b111c 100%)'
                : 'linear-gradient(180deg, #e5eeff 0%, #f9fbff 100%)',
            p: 3,
          }}
        >
          <Paper
            elevation={3}
            sx={{
              maxWidth: 600,
              width: '100%',
              p: 4,
            }}
          >
            <Stack spacing={3}>
              {/* 错误图标 */}
              <Box sx={{ textAlign: 'center' }}>
                <ErrorOutline
                  sx={{
                    fontSize: 64,
                    color: 'error.main',
                  }}
                />
              </Box>

              {/* 错误标题 */}
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
                  应用遇到了错误
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  抱歉，应用运行时出现了意外错误。您可以尝试以下操作。
                </Typography>
              </Box>

              {/* 错误详情（开发模式） */}
              {process.env.NODE_ENV === 'development' && (
                <Alert severity="info">
                  <Stack spacing={1}>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                      错误ID: {errorId}
                    </Typography>
                    <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                      {error?.toString()}
                    </Typography>
                  </Stack>
                </Alert>
              )}

              {/* 操作按钮 */}
              <Stack direction="row" spacing={2} justifyContent="center">
                <Button
                  variant="contained"
                  startIcon={<Refresh />}
                  onClick={this.handleReload}
                >
                  重新加载
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Home />}
                  onClick={this.handleGoHome}
                >
                  返回首页
                </Button>
                {process.env.NODE_ENV === 'development' && (
                  <Button
                    variant="outlined"
                    color="info"
                    startIcon={<BugReport />}
                    onClick={this.handleReset}
                  >
                    忽略错误（开发）
                  </Button>
                )}
              </Stack>

              {/* 错误信息 */}
              {process.env.NODE_ENV === 'development' && errorInfo && (
                <Box
                  sx={{
                    p: 2,
                    bgcolor: 'grey.900',
                    borderRadius: 1,
                    overflow: 'auto',
                    maxHeight: 200,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontFamily: 'monospace',
                      color: 'error.main',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-all',
                    }}
                  >
                    {errorInfo.componentStack}
                  </Typography>
                </Box>
              )}

              {/* 建议信息 */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip size="small" label="清除浏览器缓存可能解决问题" />
                <Chip size="small" label="尝试使用其他浏览器" />
                <Chip size="small" label="检查网络连接" />
              </Box>
            </Stack>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

/**
 * 网络错误边界
 * 检测和处理网络相关错误
 */
export class NetworkErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isOnline: navigator.onLine,
      showOfflineWarning: false,
    };
  }

  componentDidMount() {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  componentWillUnmount() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }

  handleOnline = () => {
    this.setState({ isOnline: true, showOfflineWarning: false });
  };

  handleOffline = () => {
    this.setState({ isOnline: false, showOfflineWarning: true });
  };

  render() {
    const { showOfflineWarning } = this.state;

    return (
      <>
        {showOfflineWarning && (
          <Alert
            severity="warning"
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 9999,
              borderRadius: 0,
            }}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => this.setState({ showOfflineWarning: false })}
              >
                关闭
              </Button>
            }
          >
            网络连接已断开，部分功能可能不可用。请检查您的网络设置。
          </Alert>
        )}
        {this.props.children}
      </>
    );
  }
}

/**
 * 异步错误边界
 * 捕获异步操作中的错误
 */
export function withAsyncErrorBoundary(Component) {
  return function WrappedComponent(props) {
    try {
      return <Component {...props} />;
    } catch (error) {
      console.error('[AsyncErrorBoundary]', error);
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Alert severity="error">
            <Typography variant="h6">组件加载失败</Typography>
            <Typography variant="body2">{error.message}</Typography>
          </Alert>
        </Box>
      );
    }
  };
}

export default WebErrorBoundary;
