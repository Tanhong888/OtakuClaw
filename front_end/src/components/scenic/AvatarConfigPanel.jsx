import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { desktopBridge } from '../../services/desktopBridge';
import { digitalHumanConfig, DIGITAL_HUMAN_TYPE } from '../../services/digitalHumanConfig';

/**
 * AI数字人配置面板
 * 用于管理景区导览数字人的类型、形象、音色等配置
 */
function AvatarConfigPanel() {
  const [config, setConfig] = useState({
    type: DIGITAL_HUMAN_TYPE.LIVE2D,
    iflytekApiUrl: '',
    iflytekApiKey: '',
    iflytekApiSecret: '',
    iflytekAppId: '',
    voiceId: 'xiaoyan',
    avatarId: 'professional_female',
  });
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [healthStatus, setHealthStatus] = useState(null);

  // 加载当前配置
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const result = await desktopBridge.avatar.getConfig();
        if (result?.ok && result.config) {
          setConfig((prev) => ({
            ...prev,
            type: digitalHumanConfig.getType(),
            iflytekApiUrl: result.config.apiUrl || '',
            iflytekApiKey: result.config.apiKey || '',
            iflytekApiSecret: result.config.apiSecret || '',
            iflytekAppId: result.config.appId || '',
            voiceId: result.config.voiceId || 'xiaoyan',
            avatarId: result.config.avatarId || 'professional_female',
          }));
          setHealthStatus(result.config.configured ? 'configured' : 'unconfigured');
        }
      } catch (error) {
        console.warn('[AvatarConfigPanel] Failed to load config:', error);
      }
    };

    void loadConfig();
  }, []);

  const handleChange = useCallback((field) => (event) => {
    setConfig((prev) => ({ ...prev, [field]: event.target.value }));
    setFeedback(null);
  }, []);

  const handleSave = useCallback(async () => {
    setLoading(true);
    setFeedback(null);

    try {
      // 保存数字人类型
      digitalHumanConfig.setType(config.type);

      // 保存科大讯飞配置
      if (config.type === DIGITAL_HUMAN_TYPE.IFLYTEK || config.type === DIGITAL_HUMAN_TYPE.AUTO) {
        digitalHumanConfig.updateIflytekConfig({
          apiUrl: config.iflytekApiUrl,
          apiKey: config.iflytekApiKey,
          apiSecret: config.iflytekApiSecret,
          appId: config.iflytekAppId,
          voiceId: config.voiceId,
          avatarId: config.avatarId,
          enabled: true,
        });

        // 同步到主进程
        await desktopBridge.avatar.updateConfig({
          apiUrl: config.iflytekApiUrl,
          apiKey: config.iflytekApiKey,
          apiSecret: config.iflytekApiSecret,
          appId: config.iflytekAppId,
          voiceId: config.voiceId,
          avatarId: config.avatarId,
        });
      }

      setFeedback({
        severity: 'success',
        text: '数字人配置已保存',
      });
      setHealthStatus('configured');
    } catch (error) {
      setFeedback({
        severity: 'error',
        text: error?.message || '配置保存失败',
      });
    } finally {
      setLoading(false);
    }
  }, [config]);

  const handleTest = useCallback(async () => {
    setTesting(true);
    setFeedback(null);

    try {
      // 桌面端：通过主进程测试
      if (desktopBridge.isDesktop()) {
        const result = await desktopBridge.avatar.checkHealth();
        if (result?.ok && result.healthy) {
          setFeedback({
            severity: 'success',
            text: 'AI虚拟人服务连接正常',
          });
          setHealthStatus('healthy');
        } else {
          setFeedback({
            severity: 'warning',
            text: 'AI虚拟人服务未连接，请检查配置',
          });
          setHealthStatus('unhealthy');
        }
        return;
      }

      // Web 端：直接测试科大讯飞 API 连通性
      const { iFlyAvatarService } = await import('../../services/iflyAvatar.js');
      const result = await iFlyAvatarService.testIflytekConnection({
        apiUrl: config.iflytekApiUrl,
        appId: config.iflytekAppId,
        apiKey: config.iflytekApiKey,
        apiSecret: config.iflytekApiSecret,
      });

      if (result.healthy) {
        setFeedback({
          severity: 'success',
          text: result.message || '科大讯飞 AI 虚拟人服务连接正常',
        });
        setHealthStatus('healthy');
      } else {
        setFeedback({
          severity: 'warning',
          text: result.message || '连接失败，请检查配置',
        });
        setHealthStatus('unhealthy');
      }
    } catch (error) {
      setFeedback({
        severity: 'error',
        text: error?.message || '连接测试失败',
      });
      setHealthStatus('unhealthy');
    } finally {
      setTesting(false);
    }
  }, [config]);

  const getHealthChip = () => {
    switch (healthStatus) {
      case 'healthy':
        return <Chip size="small" color="success" label="服务正常" />;
      case 'configured':
        return <Chip size="small" color="primary" label="已配置" />;
      case 'unhealthy':
        return <Chip size="small" color="error" label="连接异常" />;
      default:
        return <Chip size="small" variant="outlined" label="未配置" />;
    }
  };

  const showIflytekConfig = config.type === DIGITAL_HUMAN_TYPE.IFLYTEK || config.type === DIGITAL_HUMAN_TYPE.AUTO;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">AI数字人配置</Typography>
        {getHealthChip()}
      </Box>

      {feedback?.text && (
        <Alert severity={feedback.severity || 'info'} onClose={() => setFeedback(null)}>
          {feedback.text}
        </Alert>
      )}

      {/* 数字人类型选择 */}
      <FormControl fullWidth>
        <InputLabel>数字人类型</InputLabel>
        <Select
          value={config.type}
          label="数字人类型"
          onChange={handleChange('type')}
        >
          <MenuItem value={DIGITAL_HUMAN_TYPE.LIVE2D}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon fontSize="small" />
              Live2D 本地模型
            </Box>
          </MenuItem>
          <MenuItem value={DIGITAL_HUMAN_TYPE.IFLYTEK}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SmartToyIcon fontSize="small" />
              科大讯飞 AI 虚拟人
            </Box>
          </MenuItem>
          <MenuItem value={DIGITAL_HUMAN_TYPE.AUTO}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SmartToyIcon fontSize="small" />
              自动选择（优先AI虚拟人）
            </Box>
          </MenuItem>
        </Select>
      </FormControl>

      {/* 科大讯飞配置 */}
      {showIflytekConfig && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pl: 2, borderLeft: '2px solid #e0e0e0' }}>
          <Typography variant="subtitle2" color="text.secondary">
            科大讯飞 API 配置
          </Typography>

          <TextField
            label="API 地址"
            placeholder="https://api.xf-yun.com/v1"
            value={config.iflytekApiUrl}
            onChange={handleChange('iflytekApiUrl')}
            fullWidth
            helperText="科大讯飞虚拟人服务API地址"
          />

          <TextField
            label="App ID"
            placeholder="your-app-id"
            value={config.iflytekAppId}
            onChange={handleChange('iflytekAppId')}
            fullWidth
          />

          <TextField
            label="API Key"
            placeholder="your-api-key"
            value={config.iflytekApiKey}
            onChange={handleChange('iflytekApiKey')}
            fullWidth
            type="password"
          />

          <TextField
            label="API Secret"
            placeholder="your-api-secret"
            value={config.iflytekApiSecret}
            onChange={handleChange('iflytekApiSecret')}
            fullWidth
            type="password"
          />

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              label="音色ID"
              placeholder="xiaoyan"
              value={config.voiceId}
              onChange={handleChange('voiceId')}
              helperText="如: xiaoyan, xiaofeng"
            />
            <TextField
              label="形象ID"
              placeholder="professional_female"
              value={config.avatarId}
              onChange={handleChange('avatarId')}
              helperText="如: professional_female"
            />
          </Box>
        </Box>
      )}

      {/* 操作按钮 */}
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          onClick={handleTest}
          disabled={testing || !showIflytekConfig}
          startIcon={testing ? <CircularProgress size={16} /> : null}
        >
          {testing ? '测试中' : '连接测试'}
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {loading ? '保存中' : '保存配置'}
        </Button>
      </Box>
    </Box>
  );
}

export default AvatarConfigPanel;
