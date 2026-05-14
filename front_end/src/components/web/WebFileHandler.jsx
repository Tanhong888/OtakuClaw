/**
 * Web File Handler
 * Web环境下的文件处理组件
 * 支持文件上传、模型导入等功能
 */

import { useCallback, useState } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Stack,
  LinearProgress,
  Alert,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  CloudUpload,
  Delete,
  CheckCircle,
  Error,
  Description,
  Folder,
} from '@mui/icons-material';

/**
 * 文件上传组件
 */
function FileUploader({
  accept = '*',
  multiple = false,
  maxSize = 100 * 1024 * 1024, // 100MB
  onUpload,
  onProgress,
  onComplete,
  onError,
  disabled = false,
}) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);

  const handleFileSelect = useCallback(
    (event) => {
      const selectedFiles = Array.from(event.target.files);

      // 验证文件大小
      const oversizedFiles = selectedFiles.filter(
        (file) => file.size > maxSize
      );

      if (oversizedFiles.length > 0) {
        setError(
          `文件过大: ${oversizedFiles
            .map((f) => f.name)
            .join(', ')} (最大 ${maxSize / 1024 / 1024}MB)`
        );
        return;
      }

      setError(null);
      setFiles(selectedFiles);

      if (onUpload) {
        onUpload(selectedFiles);
      }
    },
    [maxSize, onUpload]
  );

  const handleUpload = useCallback(async () => {
    if (files.length === 0 || !onComplete) {
      return;
    }

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileProgress = ((i + 1) / files.length) * 100;

        setProgress(fileProgress);

        if (onProgress) {
          onProgress(file, fileProgress);
        }

        // 这里实现实际的文件上传逻辑
        // 可以使用 FormData 和 fetch API
        const formData = new FormData();
        formData.append('file', file);

        // 模拟上传（实际项目中替换为真实的API调用）
        await new Promise((resolve) => setTimeout(resolve, 1000));

        console.log(`[FileUploader] 已上传: ${file.name}`);
      }

      setProgress(100);
      onComplete(files);
    } catch (err) {
      const errorMessage = err.message || '文件上传失败';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setUploading(false);
      setFiles([]);
    }
  }, [files, onComplete, onError, onProgress]);

  const handleRemoveFile = useCallback(
    (index) => {
      setFiles((prev) => prev.filter((_, i) => i !== index));
    },
    []
  );

  return (
    <Box>
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileSelect}
        disabled={disabled || uploading}
        style={{ display: 'none' }}
        id="file-upload-input"
      />
      <label htmlFor="file-upload-input">
        <Button
          variant="outlined"
          component="span"
          startIcon={<CloudUpload />}
          disabled={disabled || uploading}
          fullWidth
        >
          选择文件
        </Button>
      </label>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {files.length > 0 && (
        <Paper variant="outlined" sx={{ mt: 2 }}>
          <List dense>
            {files.map((file, index) => (
              <ListItem key={index} divider={index < files.length - 1}>
                <ListItemIcon>
                  <Description />
                </ListItemIcon>
                <ListItemText
                  primary={file.name}
                  secondary={`${(file.size / 1024).toFixed(2)} KB`}
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    size="small"
                    onClick={() => handleRemoveFile(index)}
                    disabled={uploading}
                  >
                    <Delete />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {uploading && (
        <Box sx={{ mt: 2 }}>
          <LinearProgress variant="determinate" value={progress} />
          <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
            上传中... {progress.toFixed(0)}%
          </Typography>
        </Box>
      )}

      {files.length > 0 && !uploading && (
        <Box sx={{ mt: 2 }}>
          <Button
            variant="contained"
            onClick={handleUpload}
            fullWidth
          >
            开始上传
          </Button>
        </Box>
      )}
    </Box>
  );
}

/**
 * Live2D 模型导入器
 */
function Live2DModelImporter({
  onModelLoaded,
  onError,
  disabled = false,
}) {
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [modelName, setModelName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleModelImport = useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setStatus('loading');
      setErrorMessage('');

      try {
        // 验证文件类型
        const validExtensions = ['.moc3', '.json', '.zip'];
        const hasValidExtension = validExtensions.some((ext) =>
          file.name.toLowerCase().endsWith(ext)
        );

        if (!hasValidExtension) {
          throw new Error('无效的模型文件格式。支持的格式: .moc3, .json, .zip');
        }

        // 读取文件内容
        const reader = new FileReader();

        reader.onload = (e) => {
          try {
            const content = e.target.result;

            // 如果是JSON文件，验证模型结构
            if (file.name.toLowerCase().endsWith('.json')) {
              const modelData = JSON.parse(content);

              if (!modelData.FileReferences && !modelData.references) {
                throw new Error('无效的 Live2D 模型文件');
              }
            }

            setModelName(file.name);
            setStatus('success');

            if (onModelLoaded) {
              onModelLoaded({
                name: file.name,
                type: 'live2d',
                data: content,
                file,
              });
            }
          } catch (error) {
            throw new Error(`模型文件解析失败: ${error.message}`);
          }
        };

        reader.onerror = () => {
          throw new Error('文件读取失败');
        };

        // 根据文件类型选择读取方式
        if (file.name.toLowerCase().endsWith('.json')) {
          reader.readAsText(file);
        } else {
          reader.readAsArrayBuffer(file);
        }
      } catch (error) {
        setStatus('error');
        setErrorMessage(error.message);
        if (onError) {
          onError(error);
        }
      }
    },
    [onModelLoaded, onError]
  );

  const getStatusMessage = () => {
    switch (status) {
      case 'loading':
        return '正在加载模型...';
      case 'success':
        return `已加载: ${modelName}`;
      case 'error':
        return errorMessage;
      default:
        return '选择 Live2D 模型文件 (.moc3, .json, .zip)';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'info';
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <input
        type="file"
        accept=".moc3,.json,.zip"
        onChange={handleModelImport}
        disabled={disabled || status === 'loading'}
        style={{ display: 'none' }}
        id="live2d-model-input"
      />
      <label htmlFor="live2d-model-input">
        <Button
          variant="outlined"
          component="span"
          startIcon={<Folder />}
          disabled={disabled || status === 'loading'}
          fullWidth
        >
          导入 Live2D 模型
        </Button>
      </label>

      {status !== 'idle' && (
        <Alert
          severity={getStatusColor()}
          sx={{ mt: 2 }}
          icon={status === 'success' ? <CheckCircle /> : undefined}
          action={
            status === 'error' && (
              <Button
                size="small"
                onClick={() => setStatus('idle')}
              >
                重试
              </Button>
            )
          }
        >
          {getStatusMessage()}
        </Alert>
      )}
    </Box>
  );
}

/**
 * 拖放上传区域
 */
function DropZone({
  onDrop,
  accept = '*',
  maxSize = 100 * 1024 * 1024,
  disabled = false,
  children,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const droppedFiles = Array.from(e.dataTransfer.files);

      // 验证文件类型
      if (accept !== '*') {
        const acceptedTypes = accept.split(',').map((t) => t.trim());
        const invalidFiles = droppedFiles.filter((file) => {
          const fileExt = `.${file.name.split('.').pop().toLowerCase()}`;
          return !acceptedTypes.includes(fileExt) && !acceptedTypes.includes(file.type);
        });

        if (invalidFiles.length > 0) {
          setError(`不支持的文件类型: ${invalidFiles.map((f) => f.name).join(', ')}`);
          return;
        }
      }

      // 验证文件大小
      const oversizedFiles = droppedFiles.filter((file) => file.size > maxSize);
      if (oversizedFiles.length > 0) {
        setError(`文件过大: ${oversizedFiles.map((f) => f.name).join(', ')}`);
        return;
      }

      setError(null);

      if (onDrop) {
        onDrop(droppedFiles);
      }
    },
    [accept, maxSize, onDrop, disabled]
  );

  return (
    <Box
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      sx={{
        border: '2px dashed',
        borderColor: isDragging ? 'primary.main' : 'divider',
        borderRadius: 2,
        p: 4,
        textAlign: 'center',
        bgcolor: isDragging ? 'action.hover' : 'background.paper',
        transition: 'all 0.2s ease-in-out',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {children || (
        <Stack spacing={2} alignItems="center">
          <CloudUpload
            sx={{
              fontSize: 48,
              color: isDragging ? 'primary.main' : 'text.secondary',
            }}
          />
          <Typography variant="body1" color="text.secondary">
            拖放文件到此处，或点击选择文件
          </Typography>
          <Typography variant="caption" color="text.secondary">
            最大文件大小: {(maxSize / 1024 / 1024).toFixed(0)} MB
          </Typography>
        </Stack>
      )}
    </Box>
  );
}

export { FileUploader, Live2DModelImporter, DropZone };
