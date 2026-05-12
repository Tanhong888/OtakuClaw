/**
 * Web API Service
 * 处理Web环境下的后端API通信
 * 支持RESTful API调用和实时流式响应
 */

class WebApiService {
  constructor() {
    this.baseUrl = this.normalizeBaseUrl(process.env.VITE_API_BASE_URL || 'http://localhost:8000/api');
    this.apiKey = this.normalizeApiKey(process.env.VITE_API_KEY || '');
    this.timeout = Number.isFinite(Number(process.env.VITE_API_TIMEOUT))
      ? Number(process.env.VITE_API_TIMEOUT)
      : 30000;
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  /**
   * 标准化基础URL
   */
  normalizeBaseUrl(url) {
    if (typeof url !== 'string' || !url.trim()) {
      return 'http://localhost:8000/api';
    }
    const normalized = url.trim();
    return normalized.endsWith('/') ? normalized.slice(0, -1) : normalized;
  }

  /**
   * 标准化API密钥
   */
  normalizeApiKey(key) {
    return typeof key === 'string' ? key.trim() : '';
  }

  /**
   * 设置认证信息
   */
  setApiKey(apiKey) {
    this.apiKey = this.normalizeApiKey(apiKey);
    if (this.apiKey) {
      this.headers['Authorization'] = `Bearer ${this.apiKey}`;
    } else {
      delete this.headers['Authorization'];
    }
  }

  /**
   * 设置基础URL
   */
  setBaseUrl(url) {
    this.baseUrl = this.normalizeBaseUrl(url);
  }

  /**
   * 构建完整URL
   */
  buildUrl(endpoint) {
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${this.baseUrl}/${normalizedEndpoint}`;
  }

  /**
   * 处理响应错误
   */
  async handleResponse(response, requestInfo) {
    if (response.ok) {
      return response.json().catch(() => ({}));
    }

    let errorData;
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText || 'Unknown error' };
    }

    throw new Error(
      errorData.message || errorData.error || `Request failed with status ${response.status}`
    );
  }

  /**
   * 超时包装器
   */
  async withTimeout(promise, timeoutMs) {
    const timeout = timeoutMs || this.timeout;
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), timeout);
    });
    return Promise.race([promise, timeoutPromise]);
  }

  /**
   * 通用GET请求
   */
  async get(endpoint, options = {}) {
    const url = this.buildUrl(endpoint);
    const config = {
      method: 'GET',
      headers: { ...this.headers, ...options.headers },
      ...options,
    };

    return this.withTimeout(
      fetch(url, config).then((response) => this.handleResponse(response, { url, method: 'GET' })),
      options.timeout
    );
  }

  /**
   * 通用POST请求
   */
  async post(endpoint, data, options = {}) {
    const url = this.buildUrl(endpoint);
    const config = {
      method: 'POST',
      headers: { ...this.headers, ...options.headers },
      body: JSON.stringify(data),
      ...options,
    };

    return this.withTimeout(
      fetch(url, config).then((response) => this.handleResponse(response, { url, method: 'POST' })),
      options.timeout
    );
  }

  /**
   * 通用PUT请求
   */
  async put(endpoint, data, options = {}) {
    const url = this.buildUrl(endpoint);
    const config = {
      method: 'PUT',
      headers: { ...this.headers, ...options.headers },
      body: JSON.stringify(data),
      ...options,
    };

    return this.withTimeout(
      fetch(url, config).then((response) => this.handleResponse(response, { url, method: 'PUT' })),
      options.timeout
    );
  }

  /**
   * 通用DELETE请求
   */
  async delete(endpoint, options = {}) {
    const url = this.buildUrl(endpoint);
    const config = {
      method: 'DELETE',
      headers: { ...this.headers, ...options.headers },
      ...options,
    };

    return this.withTimeout(
      fetch(url, config).then((response) => this.handleResponse(response, { url, method: 'DELETE' })),
      options.timeout
    );
  }

  /**
   * 流式聊天请求
   */
  async *streamChat(messages, options = {}) {
    const url = this.buildUrl('chat/completions');
    const payload = {
      messages,
      model: options.model || 'gpt-3.5-turbo',
      stream: true,
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 2000,
      ...options.extraParams,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { ...this.headers, 'Accept': 'text/event-stream' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Stream request failed: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;
          if (trimmed.startsWith('data: ')) {
            const data = trimmed.slice(6);
            if (data === '[DONE]') return;
            try {
              const parsed = JSON.parse(data);
              yield parsed;
            } catch (error) {
              console.warn('Failed to parse SSE data:', data, error);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * 文件上传
   */
  async upload(endpoint, file, options = {}) {
    const url = this.buildUrl(endpoint);
    const formData = new FormData();
    formData.append('file', file);

    if (options.metadata) {
      formData.append('metadata', JSON.stringify(options.metadata));
    }

    const config = {
      method: 'POST',
      headers: {
        ...this.headers,
        'Content-Type': undefined, // 让浏览器自动设置
      },
      body: formData,
      ...options,
    };

    return this.withTimeout(
      fetch(url, config).then((response) => this.handleResponse(response, { url, method: 'UPLOAD' })),
      options.timeout || 60000
    );
  }

  /**
   * 语音转文字 (ASR)
   */
  async transcribe(audioBlob, options = {}) {
    return this.upload('voice/transcribe', audioBlob, {
      metadata: {
        language: options.language || 'zh',
        model: options.model || 'whisper-1',
      },
    });
  }

  /**
   * 文字转语音 (TTS)
   */
  async synthesize(text, options = {}) {
    return this.post('voice/synthesize', {
      text,
      voice: options.voice || 'alloy',
      speed: options.speed || 1.0,
      format: options.format || 'mp3',
    });
  }

  /**
   * 景点导览API
   */
  scenicGuide = {
    /**
     * 获取景点列表
     */
    listSpots: (options = {}) =>
      this.get('scenic/spots', {
        params: { limit: options.limit || 50, offset: options.offset || 0 },
      }),

    /**
     * 获取景点详情
     */
    getSpot: (spotId) =>
      this.get(`scenic/spots/${spotId}`),

    /**
     * 搜索景点
     */
    searchSpots: (query, options = {}) =>
      this.get('scenic/search', {
        params: { q: query, limit: options.limit || 20 },
      }),

    /**
     * 获取推荐路线
     */
    getRoute: (options = {}) =>
      this.post('scenic/routes', {
        interests: options.interests || [],
        duration: options.duration || 120,
        crowd_type: options.crowdType || 'general',
      }),

    /**
     * 提问
     */
    askQuestion: (question, context = {}) =>
      this.post('scenic/ask', {
        question,
        spot_id: context.spotId,
        conversation_id: context.conversationId,
      }),
  };

  /**
   * 数字人API
   */
  digitalHuman = {
    /**
     * 生成数字人视频
     */
    generateVideo: (text, options = {}) =>
      this.post('avatar/generate', {
        text,
        voice_id: options.voiceId || 'xiaoyan',
        avatar_id: options.avatarId || 'professional_female',
      }),

    /**
     * 获取数字人状态
     */
    getStatus: (taskId) =>
      this.get(`avatar/status/${taskId}`),

    /**
     * 获取可用数字人列表
     */
    listAvatars: () =>
      this.get('avatar/list'),
  };

  /**
   * 健康检查
   */
  async healthCheck() {
    try {
      const start = Date.now();
      await this.get('health', { timeout: 5000 });
      return {
        ok: true,
        latency: Date.now() - start,
      };
    } catch (error) {
      return {
        ok: false,
        error: error.message,
      };
    }
  }
}

// 导出单例实例
export const webApiService = new WebApiService();

// 导出类以便创建自定义实例
export default WebApiService;
