/**
 * WebSocket Service
 * Web环境下的WebSocket实时通信服务
 * 支持自动重连、心跳检测和消息队列
 */

class WebSocketService {
  constructor() {
    this.ws = null;
    this.url = '';
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.reconnectMaxDelay = 30000;
    this.isManualClose = false;
    this.isConnecting = false;
    this.messageQueue = [];
    this.heartbeatInterval = null;
    this.heartbeatIntervalTime = 30000; // 30秒
    this.listeners = new Map();
    this.connectionState = 'disconnected'; // disconnected, connecting, connected, error
  }

  /**
   * 连接到WebSocket服务器
   */
  connect(url, options = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.warn('[WebSocketService] 已连接，无需重复连接');
      return Promise.resolve({ ok: true });
    }

    if (this.isConnecting) {
      console.warn('[WebSocketService] 正在连接中...');
      return Promise.resolve({ ok: false, reason: 'connecting' });
    }

    this.url = url;
    this.isManualClose = false;
    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(url, options.protocols);

        const connectionTimeout = setTimeout(() => {
          if (this.isConnecting) {
            this.isConnecting = false;
            this.connectionState = 'error';
            reject(new Error('连接超时'));
          }
        }, options.connectTimeout || 10000);

        this.ws.onopen = () => {
          clearTimeout(connectionTimeout);
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.connectionState = 'connected';
          console.log('[WebSocketService] 已连接到服务器');

          // 开始心跳
          this.startHeartbeat();

          // 发送队列中的消息
          this.flushMessageQueue();

          // 触发连接事件
          this.emit('connected', { url });

          resolve({ ok: true });
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event);
        };

        this.ws.onerror = (error) => {
          clearTimeout(connectionTimeout);
          console.error('[WebSocketService] 连接错误:', error);
          this.connectionState = 'error';

          if (this.isConnecting) {
            this.isConnecting = false;
            reject(new Error('连接失败'));
          }

          this.emit('error', { error });
        };

        this.ws.onclose = (event) => {
          clearTimeout(connectionTimeout);
          this.isConnecting = false;
          this.connectionState = 'disconnected';
          console.log('[WebSocketService] 连接已关闭:', event.code, event.reason);

          // 停止心跳
          this.stopHeartbeat();

          // 触发断开事件
          this.emit('disconnected', { code: event.code, reason: event.reason });

          // 自动重连
          if (!this.isManualClose && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };
      } catch (error) {
        this.isConnecting = false;
        this.connectionState = 'error';
        reject(error);
      }
    });
  }

  /**
   * 处理接收到的消息
   */
  handleMessage(event) {
    try {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch {
        // 不是JSON，直接使用原始数据
        data = event.data;
      }

      // 处理心跳响应
      if (data.type === 'pong' || data.type === 'heartbeat') {
        this.lastHeartbeatTime = Date.now();
        return;
      }

      // 触发消息事件
      this.emit('message', data);

      // 触发特定类型的消息��件
      if (data.type || data.event) {
        this.emit(data.type || data.event, data);
      }
    } catch (error) {
      console.error('[WebSocketService] 处理消息错误:', error);
    }
  }

  /**
   * 发送消息
   */
  send(data, options = {}) {
    const message = typeof data === 'string' ? data : JSON.stringify(data);

    if (this.isConnected()) {
      try {
        this.ws.send(message);
        return { ok: true };
      } catch (error) {
        console.error('[WebSocketService] 发送消息失败:', error);
        if (!options.queue) {
          return { ok: false, error: error.message };
        }
      }
    }

    // 如果未连接且允许排队，则加入队列
    if (options.queue !== false) {
      this.messageQueue.push({
        data: message,
        timestamp: Date.now(),
      });
      return { ok: true, queued: true };
    }

    return { ok: false, error: 'not_connected' };
  }

  /**
   * 发送消息并等待响应
   */
  async sendAndWait(data, options = {}) {
    const timeout = options.timeout || 30000;
    const messageId = data.id || this.generateMessageId();

    // 添加消息ID
    const messageWithId = {
      ...data,
      id: messageId,
    };

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.off(`response:${messageId}`, handler);
        reject(new Error('等待响应超时'));
      }, timeout);

      const handler = (response) => {
        clearTimeout(timer);
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      };

      this.on(`response:${messageId}`, handler);
      this.send(messageWithId, options);
    });
  }

  /**
   * 刷新消息队列
   */
  flushMessageQueue() {
    while (this.messageQueue.length > 0 && this.isConnected()) {
      const { data } = this.messageQueue.shift();
      try {
        this.ws.send(data);
      } catch (error) {
        console.error('[WebSocketService] 发送队列消息失败:', error);
        // 将消息放回队列头部
        this.messageQueue.unshift({ data, timestamp: Date.now() });
        break;
      }
    }
  }

  /**
   * 开始心跳
   */
  startHeartbeat() {
    this.stopHeartbeat();
    this.lastHeartbeatTime = Date.now();

    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected()) {
        try {
          this.send({ type: 'ping', timestamp: Date.now() }, { queue: false });

          // 检查心跳超时
          const timeSinceLastHeartbeat = Date.now() - this.lastHeartbeatTime;
          if (timeSinceLastHeartbeat > this.heartbeatIntervalTime * 2) {
            console.warn('[WebSocketService] 心跳超时，主动断开');
            this.disconnect();
          }
        } catch (error) {
          console.error('[WebSocketService] 心跳发送失败:', error);
        }
      }
    }, this.heartbeatIntervalTime);
  }

  /**
   * 停止心跳
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * 安排重连
   */
  scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      this.reconnectMaxDelay
    );

    console.log(`[WebSocketService] 将在 ${delay}ms 后尝试第 ${this.reconnectAttempts} 次重连`);

    setTimeout(() => {
      if (!this.isManualClose && !this.isConnected()) {
        console.log(`[WebSocketService] 尝试第 ${this.reconnectAttempts} 次重连`);
        this.connect(this.url)
          .then(() => {
            console.log('[WebSocketService] 重连成功');
          })
          .catch((error) => {
            console.error('[WebSocketService] 重连失败:', error);
          });
      }
    }, delay);
  }

  /**
   * 断开连接
   */
  disconnect(code = 1000, reason = 'Client closing') {
    this.isManualClose = true;
    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close(code, reason);
      this.ws = null;
    }

    this.connectionState = 'disconnected';
    this.messageQueue = [];
    this.reconnectAttempts = 0;

    return Promise.resolve({ ok: true });
  }

  /**
   * 检查连接状态
   */
  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * 获取连接状态
   */
  getConnectionState() {
    return {
      state: this.connectionState,
      connected: this.isConnected(),
      reconnectAttempts: this.reconnectAttempts,
    };
  }

  /**
   * 生成消息ID
   */
  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 添加事件监听器
   */
  on(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(handler);

    // 返回取消监听的函数
    return () => this.off(event, handler);
  }

  /**
   * 移除事件监听器
   */
  off(event, handler) {
    if (!this.listeners.has(event)) {
      return false;
    }
    return this.listeners.get(event).delete(handler);
  }

  /**
   * 触发事件
   */
  emit(event, data) {
    if (!this.listeners.has(event)) {
      return;
    }

    for (const handler of this.listeners.get(event)) {
      try {
        handler(data);
      } catch (error) {
        console.error(`[WebSocketService] 事件处理器错误 (${event}):`, error);
      }
    }
  }

  /**
   * 移除所有监听器
   */
  removeAllListeners(event) {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * 获取队列状态
   */
  getQueueStatus() {
    return {
      length: this.messageQueue.length,
      messages: this.messageQueue.map((msg, index) => ({
        index,
        timestamp: msg.timestamp,
        age: Date.now() - msg.timestamp,
      })),
    };
  }

  /**
   * 清空消息队列
   */
  clearQueue() {
    this.messageQueue = [];
    return { ok: true, cleared: true };
  }
}

// 导出单例实例
export const webSocketService = new WebSocketService();

// 导出类以便创建自定义实例
export default WebSocketService;
