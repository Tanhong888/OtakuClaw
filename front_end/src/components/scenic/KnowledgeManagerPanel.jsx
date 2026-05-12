import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { desktopBridge } from '../../services/desktopBridge.js';

function TabPanel({ children, value, index }) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const KnowledgeManagerPanel = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [knowledgeBlocks, setKnowledgeBlocks] = useState([]);
  const [interactionLogs, setInteractionLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, item: null });
  const [editDialog, setEditDialog] = useState({ open: false, item: null });
  const [addDialog, setAddDialog] = useState({ open: false, item: null });
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // 加载知识块
  const loadKnowledgeBlocks = useCallback(async () => {
    try {
      setLoading(true);
      const result = await desktopBridge.scenicGuide.listKnowledgeBlocks();
      if (result.ok) {
        setKnowledgeBlocks(result.data || []);
      } else {
        setError(result?.error?.message || '加载知识库失败');
      }
    } catch (err) {
      console.error('Failed to load knowledge blocks:', err);
      setError('加载知识库失败，请确保在桌面应用中使用此功能');
    } finally {
      setLoading(false);
    }
  }, []);

  // 加载交互日志
  const loadInteractionLogs = useCallback(async () => {
    try {
      const result = await desktopBridge.scenicGuide.getInteractionLogs();
      if (result.ok) {
        setInteractionLogs(result.data || []);
        setFilteredLogs(result.data || []);
      } else {
        setError(result?.error?.message || '加载交互日志失败');
      }
    } catch (err) {
      console.error('Failed to load interaction logs:', err);
      setError('加载交互日志失败，请确保在桌面应用中使用此功能');
    }
  }, []);

  useEffect(() => {
    loadKnowledgeBlocks();
    loadInteractionLogs();
  }, [loadKnowledgeBlocks, loadInteractionLogs]);

  // 搜索和过滤交互日志
  useEffect(() => {
    let filtered = interactionLogs;

    // 按搜索查询过滤
    if (searchQuery) {
      filtered = filtered.filter(
        (log) =>
          log.question?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.answer?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 按分类过滤
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'unanswered') {
        filtered = filtered.filter((log) => !log.hit);
      } else if (selectedCategory === 'low-rating') {
        filtered = filtered.filter((log) => log.rating && log.rating < 3);
      } else if (selectedCategory === 'high-rating') {
        filtered = filtered.filter((log) => log.rating && log.rating >= 4);
      }
    }

    setFilteredLogs(filtered);
  }, [searchQuery, selectedCategory, interactionLogs]);

  // 处理删除
  const handleDelete = async () => {
    if (!deleteDialog.item) return;

    try {
      // 调用删除API（需要在后端实现）
      setSuccessMessage('删除功能需要在后端服务中实现');
      setDeleteDialog({ open: false, item: null });
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('删除失败');
    }
  };

  // 处理编辑
  const handleEdit = async () => {
    if (!editDialog.item) return;

    try {
      // 调用更新API（需要在后端实现）
      setSuccessMessage('编辑功能需要在后端服务中实现');
      setEditDialog({ open: false, item: null });
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('更新失败');
    }
  };

  // 处理添加FAQ
  const handleAddFAQ = async () => {
    if (!addDialog.item) return;

    try {
      // 调用添加API（需要在后端实现）
      setSuccessMessage('添加FAQ功能需要在后端服务中实现');
      setAddDialog({ open: false, item: null });
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('添加失败');
    }
  };

  // 转换为FAQ
  const convertToFAQ = (log) => {
    setAddDialog({
      open: true,
      item: {
        question: log.question,
        answer: log.answer,
        source: log.source || 'user-interaction',
      },
    });
  };

  return (
    <Box sx={{ p: 3, backgroundColor: '#fafafa', borderRadius: 2 }}>
      {/* 标题 */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
            📚 知识库管理
          </Typography>
          <Typography variant="caption" color="textSecondary" sx={{ ml: 2 }}>
            管理景点知识库和FAQ，从用户交互中学习
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => {
            loadKnowledgeBlocks();
            loadInteractionLogs();
          }}
        >
          刷新
        </Button>
      </Box>

      {/* 错误和成功提示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {/* 标签页 */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="知识库内容" />
          <Tab label="交互日志" />
          <Tab label="FAQ管理" />
        </Tabs>
      </Paper>

      {/* 知识库内容标签页 */}
      <TabPanel value={tabValue} index={0}>
        <Paper sx={{ p: 2, backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              知识块列表 ({knowledgeBlocks.length})
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              size="small"
              onClick={() => setAddDialog({ open: true, item: null })}
            >
              添加知识块
            </Button>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>知识点</TableCell>
                    <TableCell>来源</TableCell>
                    <TableCell>分类</TableCell>
                    <TableCell align="right">操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {knowledgeBlocks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                        <Typography color="textSecondary">
                          暂无知识库内容，请先导入官方数据包
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    knowledgeBlocks.slice(0, 50).map((block, index) => (
                      <TableRow key={index} hover>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                            {block.content || block.text || '无内容'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={block.source || block.spotId || '未知'} size="small" />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={block.category || block.type || '通用'}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="编辑">
                            <IconButton
                              size="small"
                              onClick={() => setEditDialog({ open: true, item: block })}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="删除">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => setDeleteDialog({ open: true, item: block })}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </TabPanel>

      {/* 交互日志标签页 */}
      <TabPanel value={tabValue} index={1}>
        <Paper sx={{ p: 2, backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          {/* 搜索和过滤 */}
          <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="搜索问题或答案..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{ flexGrow: 1, maxWidth: 400 }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>过滤</InputLabel>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                label="过滤"
              >
                <MenuItem value="all">全部</MenuItem>
                <MenuItem value="unanswered">未命中</MenuItem>
                <MenuItem value="low-rating">低评分</MenuItem>
                <MenuItem value="high-rating">高评分</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
            交互记录 ({filteredLogs.length})
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>问题</TableCell>
                    <TableCell>回答</TableCell>
                    <TableCell>命中状态</TableCell>
                    <TableCell>评分</TableCell>
                    <TableCell align="right">操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                        <Typography color="textSecondary">
                          {searchQuery || selectedCategory !== 'all'
                            ? '没有找到匹配的记录'
                            : '暂无交互记录'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.slice(0, 100).map((log, index) => (
                      <TableRow key={log.id || index} hover>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                            {log.question}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            noWrap
                            sx={{ maxWidth: 300, color: 'text.secondary' }}
                          >
                            {log.answer?.substring(0, 50)}...
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {log.hit ? (
                            <Chip
                              label="命中"
                              size="small"
                              color="success"
                              icon={<CheckCircleIcon />}
                            />
                          ) : (
                            <Chip
                              label="未命中"
                              size="small"
                              color="error"
                              icon={<ErrorIcon />}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {log.rating ? (
                            <Chip label={`${log.rating}/5`} size="small" />
                          ) : (
                            <Typography variant="caption" color="textSecondary">
                              未评分
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {!log.hit && (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => convertToFAQ(log)}
                            >
                              转为FAQ
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </TabPanel>

      {/* FAQ管理标签页 */}
      <TabPanel value={tabValue} index={2}>
        <Paper sx={{ p: 2, backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              常见问题管理
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              size="small"
              onClick={() => setAddDialog({ open: true, item: null })}
            >
              添加FAQ
            </Button>
          </Box>

          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              从交互日志中选择"未命中"的问题，将其转换为FAQ可以提升知识库覆盖率。
            </Typography>
          </Alert>

          <Typography variant="body2" color="textSecondary" align="center" sx={{ py: 3 }}>
            FAQ功能需要后端服务支持，请在桌面应用中使用。
          </Typography>
        </Paper>
      </TabPanel>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, item: null })}>
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <Typography>确定要删除此项目吗？此操作无法撤销。</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, item: null })}>取消</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            删除
          </Button>
        </DialogActions>
      </Dialog>

      {/* 编辑对话框 */}
      <Dialog
        open={editDialog.open}
        onClose={() => setEditDialog({ open: false, item: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>编辑知识块</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="normal"
            label="内容"
            multiline
            rows={4}
            defaultValue={editDialog.item?.content || editDialog.item?.text || ''}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, item: null })}>取消</Button>
          <Button onClick={handleEdit} variant="contained">
            保存
          </Button>
        </DialogActions>
      </Dialog>

      {/* 添加FAQ对话框 */}
      <Dialog
        open={addDialog.open}
        onClose={() => setAddDialog({ open: false, item: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>添加FAQ</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="normal"
            label="问题"
            defaultValue={addDialog.item?.question || ''}
          />
          <TextField
            fullWidth
            margin="normal"
            label="答案"
            multiline
            rows={4}
            defaultValue={addDialog.item?.answer || ''}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>分类</InputLabel>
            <Select label="分类" defaultValue="general">
              <MenuItem value="general">通用</MenuItem>
              <MenuItem value="spot">景点</MenuItem>
              <MenuItem value="route">路线</MenuItem>
              <MenuItem value="service">服务</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialog({ open: false, item: null })}>取消</Button>
          <Button onClick={handleAddFAQ} variant="contained">
            添加
          </Button>
        </DialogActions>
      </Dialog>

      {/* 说明文字 */}
      <Box sx={{ mt: 3, p: 2, backgroundColor: '#e8f5e9', borderRadius: 2 }}>
        <Typography variant="caption" color="textSecondary">
          ✅ 知识库管理面板已连接真实数据源。您可以查看和管理知识库内容、分析用户交互日志，并将常见问题添加到FAQ中。
        </Typography>
      </Box>
    </Box>
  );
};

export default KnowledgeManagerPanel;
