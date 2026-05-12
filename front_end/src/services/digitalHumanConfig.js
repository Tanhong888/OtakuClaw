/**
 * 数字人类型配置管理
 * 支持Live2D和科大讯飞AI虚拟人切换
 */

// 数字人类型枚举
export const DIGITAL_HUMAN_TYPE = {
  LIVE2D: 'live2d',           // Live2D模型（本地渲染）
  IFLYTEK: 'iflytek',        // 科大讯飞AI虚拟人（云端渲染）
  AUTO: 'auto'               // 自动选择（优先使用配置的类型）
};

// 数字人配置状态管理
class DigitalHumanConfig {
  constructor() {
    this.config = {
      type: DIGITAL_HUMAN_TYPE.LIVE2D,  // 默认使用Live2D
      // Live2D配置
      live2d: {
        enabled: true,
        modelPath: '',
        motions: [],
        expressions: []
      },
      // 科大讯飞配置
      iflytek: {
        enabled: false,
        apiUrl: '',  // 后端API地址，如 http://localhost:8000/api/avatar
        apiKey: '',
        appId: '',
        voiceId: 'xiaoyan',
        avatarId: 'professional_female'
      }
    };

    this.listeners = new Set();
    this.loadConfig();
  }

  /**
   * 加载保存的配置
   */
  loadConfig() {
    try {
      const saved = localStorage.getItem('digitalHumanConfig');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.config = { ...this.config, ...parsed };
      }
    } catch (error) {
      console.warn('[DigitalHumanConfig] Failed to load config:', error);
    }
  }

  /**
   * 保存配置
   */
  saveConfig() {
    try {
      localStorage.setItem('digitalHumanConfig', JSON.stringify(this.config));
      this.notifyListeners();
    } catch (error) {
      console.error('[DigitalHumanConfig] Failed to save config:', error);
    }
  }

  /**
   * 获取当前数字人类型
   */
  getType() {
    return this.config.type;
  }

  /**
   * 设置数字人类型
   */
  setType(type) {
    if (Object.values(DIGITAL_HUMAN_TYPE).includes(type)) {
      this.config.type = type;
      this.saveConfig();
    }
  }

  /**
   * 获取Live2D配置
   */
  getLive2DConfig() {
    return this.config.live2d;
  }

  /**
   * 更新Live2D配置
   */
  updateLive2DConfig(updates) {
    this.config.live2d = { ...this.config.live2d, ...updates };
    this.saveConfig();
  }

  /**
   * 获取科大讯飞配置
   */
  getIflytekConfig() {
    return this.config.iflytek;
  }

  /**
   * 更新科大讯飞配置
   */
  updateIflytekConfig(updates) {
    this.config.iflytek = { ...this.config.iflytek, ...updates };
    this.saveConfig();
  }

  /**
   * 检查科大讯飞是否已配置
   */
  isIflytekConfigured() {
    const cfg = this.config.iflytek;
    return cfg.enabled && cfg.apiUrl && cfg.apiKey && cfg.appId;
  }

  /**
   * 获取当前使用的数字人类型
   */
  getEffectiveType() {
    if (this.config.type === DIGITAL_HUMAN_TYPE.AUTO) {
      // 自动选择：优先使用已配置的科大讯飞，否则使用Live2D
      return this.isIflytekConfigured()
        ? DIGITAL_HUMAN_TYPE.IFLYTEK
        : DIGITAL_HUMAN_TYPE.LIVE2D;
    }
    return this.config.type;
  }

  /**
   * 监听配置变化
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * 通知监听器
   */
  notifyListeners() {
    this.listeners.forEach(listener => listener(this.config));
  }

  /**
   * 重置为默认配置
   */
  reset() {
    this.config.type = DIGITAL_HUMAN_TYPE.LIVE2D;
    this.config.live2d.enabled = true;
    this.config.iflytek.enabled = false;
    this.saveConfig();
  }

  /**
   * 导出配置
   */
  export() {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * 导入配置
   */
  import(configString) {
    try {
      const parsed = JSON.parse(configString);
      this.config = { ...this.config, ...parsed };
      this.saveConfig();
      return true;
    } catch (error) {
      console.error('[DigitalHumanConfig] Failed to import config:', error);
      return false;
    }
  }
}

// 导出单例实例
export const digitalHumanConfig = new DigitalHumanConfig();
export default digitalHumanConfig;
