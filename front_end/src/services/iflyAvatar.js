/**
 * 科大讯飞AI虚拟人服务接口
 * 用于Android APP的虚拟人视频生成和播放
 */

class IFlyAvatarService {
  constructor() {
    // 配置后端API地址
    this.backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
    this.avatarApiEndpoint = `${this.backendUrl}/api/avatar`;
  }

  /**
   * 生成虚拟人视频
   * @param {Object} options - 配置选项
   * @param {string} options.text - 要播放的文本内容
   * @param {string} options.voiceId - 音色ID（可选）
   * @param {string} options.avatarId - 虚拟人形象ID（可选）
   * @returns {Promise<string>} 视频URL或base64数据
   */
  async generateAvatarVideo(options) {
    const { text, voiceId, avatarId } = options;

    if (!text || text.trim().length === 0) {
      throw new Error('文本内容不能为空');
    }

    try {
      const response = await fetch(this.avatarApiEndpoint + '/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
          voiceId: voiceId || 'default',
          avatarId: avatarId || 'default',
        }),
      });

      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }

      const data = await response.json();

      if (data.code !== 0) {
        throw new Error(`虚拟人生成失败: ${data.message || '未知错误'}`);
      }

      // 返回视频URL或base64数据
      return data.data.videoUrl || data.data.videoBase64;
    } catch (error) {
      console.error('[IFlyAvatarService] 生成虚拟人视频失败:', error);
      throw error;
    }
  }

  /**
   * 流式生成虚拟人音频和视频
   * 用于实时对话场景
   * @param {Object} options - 配置选项
   * @param {string} options.text - 文本内容
   * @param {Function} options.onProgress - 进度回调
   * @returns {Promise<ReadableStream>} 音视频流
   */
  async generateAvatarStream(options) {
    const { text, onProgress } = options;

    try {
      const response = await fetch(this.avatarApiEndpoint + '/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(`流式请求失败: ${response.status}`);
      }

      return response.body;
    } catch (error) {
      console.error('[IFlyAvatarService] 流式生成失败:', error);
      throw error;
    }
  }

  /**
   * 获取可用的虚拟人形象列表
   * @returns {Promise<Array>} 虚拟人形象列表
   */
  async getAvatarList() {
    try {
      const response = await fetch(this.avatarApiEndpoint + '/avatars');
      if (!response.ok) {
        throw new Error(`获取虚拟人列表失败: ${response.status}`);
      }
      const data = await response.json();
      return data.data.avatars || [];
    } catch (error) {
      console.error('[IFlyAvatarService] 获取虚拟人列表失败:', error);
      return [];
    }
  }

  /**
   * 获取可用的音色列表
   * @returns {Promise<Array>} 音色列表
   */
  async getVoiceList() {
    try {
      const response = await fetch(this.avatarApiEndpoint + '/voices');
      if (!response.ok) {
        throw new Error(`获取音色列表失败: ${response.status}`);
      }
      const data = await response.json();
      return data.data.voices || [];
    } catch (error) {
      console.error('[IFlyAvatarService] 获取音色列表失败:', error);
      return [];
    }
  }

  /**
   * 检查服务是否可用
   * @returns {Promise<boolean>} 服务是否可用
   */
  async checkServiceHealth() {
    try {
      const response = await fetch(this.avatarApiEndpoint + '/health', {
        method: 'GET',
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// 导出单例实例
export const iFlyAvatarService = new IFlyAvatarService();
export default iFlyAvatarService;
