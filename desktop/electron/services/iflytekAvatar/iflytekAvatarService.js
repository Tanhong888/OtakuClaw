const https = require('node:https');
const http = require('node:http');
const { URL } = require('node:url');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
const { app } = require('electron');

const CONFIG_FILE = 'iflytek-avatar-config.json';

function getConfigPath() {
  const userDataPath = app?.getPath('userData') || process.cwd();
  return path.join(userDataPath, CONFIG_FILE);
}

/**
 * iFlytek AI Avatar Service
 * Wraps iFlytek AI virtual human video generation API for Electron desktop app.
 *
 * Architecture:
 * - Renderer (React) calls IPC -> Main process -> this service -> iFlytek cloud API
 * - Generated video URLs are returned to renderer for playback
 */
class IFlytekAvatarService {
  constructor(options = {}) {
    this.apiUrl = options.apiUrl || process.env.IFLYTEK_AVATAR_API_URL || '';
    this.apiKey = options.apiKey || process.env.IFLYTEK_AVATAR_API_KEY || '';
    this.appId = options.appId || process.env.IFLYTEK_AVATAR_APP_ID || '';
    this.apiSecret = options.apiSecret || process.env.IFLYTEK_AVATAR_API_SECRET || '';

    // Default avatar and voice settings
    this.defaultVoiceId = options.voiceId || 'xiaoyan';
    this.defaultAvatarId = options.avatarId || 'professional_female';

    // Request timeout (ms)
    this.timeout = options.timeout || 60000;

    // Cache for avatar/voice lists
    this._avatarList = null;
    this._voiceList = null;
    this._listCacheTime = 0;
    this._listCacheTtl = 5 * 60 * 1000; // 5 minutes

    // Load saved config
    this._loadConfig();
  }

  /**
   * Load config from disk
   */
  async _loadConfig() {
    try {
      const configPath = getConfigPath();
      const data = await fs.readFile(configPath, 'utf-8');
      const saved = JSON.parse(data);
      if (saved.apiUrl) this.apiUrl = saved.apiUrl;
      if (saved.apiKey) this.apiKey = saved.apiKey;
      if (saved.appId) this.appId = saved.appId;
      if (saved.apiSecret) this.apiSecret = saved.apiSecret;
      if (saved.voiceId) this.defaultVoiceId = saved.voiceId;
      if (saved.avatarId) this.defaultAvatarId = saved.avatarId;
    } catch {
      // No saved config yet, use defaults
    }
  }

  /**
   * Save config to disk
   */
  async _saveConfig() {
    try {
      const configPath = getConfigPath();
      const config = {
        apiUrl: this.apiUrl,
        apiKey: this.apiKey,
        appId: this.appId,
        apiSecret: this.apiSecret,
        voiceId: this.defaultVoiceId,
        avatarId: this.defaultAvatarId,
      };
      await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
    } catch (error) {
      console.error('[IFlytekAvatarService] Failed to save config:', error);
    }
  }

  /**
   * Check if the service is properly configured
   */
  isConfigured() {
    return Boolean(this.apiUrl && this.apiKey && this.apiSecret && this.appId);
  }

  /**
   * Update configuration dynamically
   */
  async updateConfig(updates = {}) {
    if (updates.apiUrl !== undefined) this.apiUrl = updates.apiUrl;
    if (updates.apiKey !== undefined) this.apiKey = updates.apiKey;
    if (updates.appId !== undefined) this.appId = updates.appId;
    if (updates.apiSecret !== undefined) this.apiSecret = updates.apiSecret;
    if (updates.voiceId !== undefined) this.defaultVoiceId = updates.voiceId;
    if (updates.avatarId !== undefined) this.defaultAvatarId = updates.avatarId;
    await this._saveConfig();
  }

  /**
   * Get current configuration (without sensitive data)
   */
  getConfig() {
    return {
      apiUrl: this.apiUrl,
      apiKey: this.apiKey,
      appId: this.appId,
      apiSecret: this.apiSecret,
      voiceId: this.defaultVoiceId,
      avatarId: this.defaultAvatarId,
      configured: this.isConfigured(),
    };
  }

  /**
   * Internal: Make HTTP request to iFlytek API
   */
  _request(path, options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.isConfigured()) {
        reject(new Error('iFlytek avatar service is not configured'));
        return;
      }

      const url = new URL(path, this.apiUrl);
      const postData = options.body ? JSON.stringify(options.body) : '';

      const requestOptions = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-App-ID': this.appId,
          ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {}),
          ...(options.headers || {}),
        },
        timeout: this.timeout,
      };

      const client = url.protocol === 'https:' ? https : http;

      const req = client.request(requestOptions, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ status: res.statusCode, data: parsed });
          } catch {
            resolve({ status: res.statusCode, data });
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      if (postData) {
        req.write(postData);
      }
      req.end();
    });
  }

  /**
   * Generate avatar video from text
   * @param {Object} params
   * @param {string} params.text - Text to synthesize
   * @param {string} [params.voiceId] - Voice ID
   * @param {string} [params.avatarId] - Avatar ID
   * @returns {Promise<{ok: boolean, videoUrl?: string, videoBase64?: string, error?: Object}>}
   */
  async generateAvatarVideo(params = {}) {
    try {
      const { text, voiceId, avatarId } = params;

      if (!text || typeof text !== 'string' || !text.trim()) {
        return {
          ok: false,
          error: { code: 'invalid_params', message: 'Text content is required' },
        };
      }

      const response = await this._request('/api/avatar/generate', {
        method: 'POST',
        body: {
          text: text.trim(),
          voiceId: voiceId || this.defaultVoiceId,
          avatarId: avatarId || this.defaultAvatarId,
        },
      });

      if (response.status !== 200) {
        return {
          ok: false,
          error: {
            code: 'api_error',
            message: `API returned status ${response.status}`,
          },
        };
      }

      const { data } = response;

      if (data.code !== 0) {
        return {
          ok: false,
          error: {
            code: 'generation_failed',
            message: data.message || 'Avatar video generation failed',
          },
        };
      }

      return {
        ok: true,
        videoUrl: data.data?.videoUrl,
        videoBase64: data.data?.videoBase64,
      };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'request_failed',
          message: error.message || 'Failed to generate avatar video',
        },
      };
    }
  }

  /**
   * Get available avatar list
   * @returns {Promise<{ok: boolean, avatars?: Array, error?: Object}>}
   */
  async getAvatarList() {
    try {
      if (this._avatarList && Date.now() - this._listCacheTime < this._listCacheTtl) {
        return { ok: true, avatars: this._avatarList };
      }

      const response = await this._request('/api/avatar/avatars');

      if (response.status !== 200) {
        return {
          ok: false,
          error: { code: 'api_error', message: `API returned status ${response.status}` },
        };
      }

      const avatars = response.data.data?.avatars || [];
      this._avatarList = avatars;
      this._listCacheTime = Date.now();

      return { ok: true, avatars };
    } catch (error) {
      return {
        ok: false,
        error: { code: 'request_failed', message: error.message || 'Failed to fetch avatar list' },
      };
    }
  }

  /**
   * Get available voice list
   * @returns {Promise<{ok: boolean, voices?: Array, error?: Object}>}
   */
  async getVoiceList() {
    try {
      if (this._voiceList && Date.now() - this._listCacheTime < this._listCacheTtl) {
        return { ok: true, voices: this._voiceList };
      }

      const response = await this._request('/api/avatar/voices');

      if (response.status !== 200) {
        return {
          ok: false,
          error: { code: 'api_error', message: `API returned status ${response.status}` },
        };
      }

      const voices = response.data.data?.voices || [];
      this._voiceList = voices;
      this._listCacheTime = Date.now();

      return { ok: true, voices };
    } catch (error) {
      return {
        ok: false,
        error: { code: 'request_failed', message: error.message || 'Failed to fetch voice list' },
      };
    }
  }

  /**
   * Build iFlytek HMAC-SHA256 authorization header
   * @param {string} apiUrl - WebSocket API URL
   * @param {string} apiKey - API Key
   * @param {string} apiSecret - API Secret
   * @returns {{authorization: string, date: string, host: string}}
   */
  _buildAuthorization(apiUrl, apiKey, apiSecret) {
    const url = new URL(apiUrl);
    const date = new Date().toUTCString();
    const signatureOrigin = `host: ${url.host}\ndate: ${date}\nGET ${url.pathname} HTTP/1.1`;

    const signature = crypto
      .createHmac('sha256', apiSecret)
      .update(signatureOrigin)
      .digest('base64');

    const authorizationOrigin = `api_key="${apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;
    const authorization = Buffer.from(authorizationOrigin).toString('base64');

    return { authorization, date, host: url.host };
  }

  /**
   * Check service health by directly connecting to iFlytek API via WebSocket
   * @returns {Promise<{ok: boolean, healthy?: boolean, message?: string, error?: Object}>}
   */
  async checkHealth() {
    if (!this.isConfigured()) {
      return {
        ok: false,
        healthy: false,
        message: '请填写完整的 API 地址、App ID、API Key 和 API Secret',
      };
    }

    try {
      const { authorization, date, host } = this._buildAuthorization(
        this.apiUrl,
        this.apiKey,
        this.apiSecret
      );

      const url = new URL(this.apiUrl);
      url.searchParams.set('authorization', authorization);
      url.searchParams.set('date', date);
      url.searchParams.set('host', host);

      // Use WebSocket to test connection
      return new Promise((resolve) => {
        const WebSocket = require('ws');
        const ws = new WebSocket(url.toString(), { timeout: 10000 });

        const timeout = setTimeout(() => {
          ws.terminate();
          resolve({
            ok: true,
            healthy: false,
            message: '连接超时，请检查网络或 API 地址',
          });
        }, 10000);

        ws.on('open', () => {
          clearTimeout(timeout);
          ws.close();
          resolve({
            ok: true,
            healthy: true,
            message: '科大讯飞 AI 虚拟人服务连接正常',
          });
        });

        ws.on('error', (error) => {
          clearTimeout(timeout);
          ws.terminate();
          resolve({
            ok: true,
            healthy: false,
            message: `连接失败: ${error.message || '请检查 API 地址和认证信息'}`,
          });
        });
      });
    } catch (error) {
      return {
        ok: false,
        healthy: false,
        message: error?.message || '认证签名生成失败',
      };
    }
  }
}

module.exports = { IFlytekAvatarService };
