const https = require('node:https');
const http = require('node:http');
const { URL } = require('node:url');

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
  }

  /**
   * Check if the service is properly configured
   */
  isConfigured() {
    return Boolean(this.apiUrl && this.apiKey && this.appId);
  }

  /**
   * Update configuration dynamically
   */
  updateConfig(updates = {}) {
    if (updates.apiUrl !== undefined) this.apiUrl = updates.apiUrl;
    if (updates.apiKey !== undefined) this.apiKey = updates.apiKey;
    if (updates.appId !== undefined) this.appId = updates.appId;
    if (updates.apiSecret !== undefined) this.apiSecret = updates.apiSecret;
    if (updates.voiceId !== undefined) this.defaultVoiceId = updates.voiceId;
    if (updates.avatarId !== undefined) this.defaultAvatarId = updates.avatarId;
  }

  /**
   * Get current configuration (without sensitive data)
   */
  getConfig() {
    return {
      apiUrl: this.apiUrl,
      appId: this.appId,
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
   * Check service health
   * @returns {Promise<{ok: boolean, healthy?: boolean, error?: Object}>}
   */
  async checkHealth() {
    try {
      const response = await this._request('/api/avatar/health');
      return { ok: true, healthy: response.status === 200 };
    } catch (error) {
      return {
        ok: false,
        error: { code: 'health_check_failed', message: error.message },
      };
    }
  }
}

module.exports = { IFlytekAvatarService };
