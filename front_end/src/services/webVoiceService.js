/**
 * Web Voice Service
 * Web环境下的语音识别和合成服务
 * 使用浏览器原生 Web Audio API 和 Speech API
 */

class WebVoiceService {
  constructor() {
    this.isAvailable = this.checkAvailability();
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.voices = [];
    this.isRecording = false;
    this.audioContext = null;
    this.mediaStream = null;
    this.audioWorklet = null;

    // 初始化语音列表
    if (this.synthesis) {
      this.loadVoices();
      // 语音列表可能在稍后加载
      if (this.synthesis.onvoiceschanged !== undefined) {
        this.synthesis.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  /**
   * 检查浏览器语音API可用性
   */
  checkAvailability() {
    const hasSpeechRecognition = 'SpeechRecognition' in window ||
                                  'webkitSpeechRecognition' in window;
    const hasSpeechSynthesis = 'speechSynthesis' in window;
    const hasAudioContext = 'AudioContext' in window ||
                            'webkitAudioContext' in window;
    const hasMediaRecorder = 'MediaRecorder' in window;

    return {
      recognition: hasSpeechRecognition,
      synthesis: hasSpeechSynthesis,
      audioContext: hasAudioContext,
      mediaRecorder: hasMediaRecorder,
      full: hasSpeechRecognition && hasSpeechSynthesis && hasAudioContext,
    };
  }

  /**
   * 加载可用语音列表
   */
  loadVoices() {
    if (!this.synthesis) return;

    this.voices = this.synthesis.getVoices() || [];
    console.log(`[WebVoiceService] 已加载 ${this.voices.length} 个语音`);
  }

  /**
   * 获取中文语音
   */
  getChineseVoices() {
    return this.voices.filter(voice =>
      voice.lang.startsWith('zh') || voice.lang.includes('CN')
    );
  }

  /**
   * 开始语音识别
   */
  async startRecognition(options = {}) {
    if (!this.isAvailable.recognition) {
      throw new Error('浏览器不支持语音识别 API');
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (this.recognition) {
      this.recognition.abort();
    }

    this.recognition = new SpeechRecognition();
    this.recognition.lang = options.language || 'zh-CN';
    this.recognition.continuous = options.continuous !== false;
    this.recognition.interimResults = options.interimResults !== false;
    this.recognition.maxAlternatives = options.maxAlternatives || 1;

    return new Promise((resolve, reject) => {
      this.recognition.onstart = () => {
        this.isRecording = true;
        console.log('[WebVoiceService] 语音识别已启动');
        resolve({ ok: true });
      };

      this.recognition.onresult = (event) => {
        const results = [];
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          const isFinal = result.isFinal;

          results.push({
            transcript,
            isFinal,
            confidence: result[0].confidence,
          });

          if (options.onResult) {
            options.onResult({
              transcript,
              isFinal,
              confidence: result[0].confidence,
            });
          }
        }

        if (options.onResults) {
          options.onResults(results);
        }
      };

      this.recognition.onerror = (event) => {
        console.error('[WebVoiceService] 语音识别错误:', event.error);
        this.isRecording = false;

        if (options.onError) {
          options.onError({
            code: event.error,
            message: this.getErrorMessage(event.error),
          });
        }

        // 某些错误不需要reject
        if (event.error === 'no-speech' || event.error === 'aborted') {
          resolve({ ok: false, error: event.error });
        } else {
          reject(new Error(this.getErrorMessage(event.error)));
        }
      };

      this.recognition.onend = () => {
        this.isRecording = false;
        console.log('[WebVoiceService] 语音识别已结束');

        if (options.onEnd) {
          options.onEnd();
        }
      };

      try {
        this.recognition.start();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 停止语音识别
   */
  stopRecognition() {
    if (this.recognition && this.isRecording) {
      this.recognition.stop();
      this.isRecording = false;
      return Promise.resolve({ ok: true });
    }
    return Promise.resolve({ ok: false, reason: 'not_recording' });
  }

  /**
   * 中止语音识别
   */
  abortRecognition() {
    if (this.recognition) {
      this.recognition.abort();
      this.isRecording = false;
    }
    return Promise.resolve({ ok: true });
  }

  /**
   * 文字转语音
   */
  async synthesize(text, options = {}) {
    if (!this.isAvailable.synthesis) {
      throw new Error('浏览器不支持语音合成 API');
    }

    if (!text || !text.trim()) {
      throw new Error('文本内容为空');
    }

    // 取消当前正在播放的语音
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // 设置语音
    if (options.voice) {
      utterance.voice = options.voice;
    } else {
      // 尝试使用中文语音
      const chineseVoices = this.getChineseVoices();
      if (chineseVoices.length > 0) {
        utterance.voice = chineseVoices[0];
      }
    }

    // 设置语言
    utterance.lang = options.language || 'zh-CN';

    // 设置语速 (0.1 - 10)
    utterance.rate = options.rate !== undefined ? Math.max(0.1, Math.min(10, options.rate)) : 1;

    // 设置音调 (0 - 2)
    utterance.pitch = options.pitch !== undefined ? Math.max(0, Math.min(2, options.pitch)) : 1;

    // 设置音量 (0 - 1)
    utterance.volume = options.volume !== undefined ? Math.max(0, Math.min(1, options.volume)) : 1;

    return new Promise((resolve, reject) => {
      utterance.onstart = () => {
        console.log('[WebVoiceService] 语音合成已开始');
        if (options.onStart) {
          options.onStart();
        }
      };

      utterance.onend = () => {
        console.log('[WebVoiceService] 语音合成已完成');
        if (options.onEnd) {
          options.onEnd();
        }
        resolve({ ok: true });
      };

      utterance.onerror = (event) => {
        console.error('[WebVoiceService] 语音合成错误:', event.error);
        if (options.onError) {
          options.onError(event);
        }
        reject(new Error(`语音合成失败: ${event.error}`));
      };

      utterance.onpause = () => {
        if (options.onPause) {
          options.onPause();
        }
      };

      utterance.onresume = () => {
        if (options.onResume) {
          options.onResume();
        }
      };

      // 分块处理长文本（浏览器有长度限制）
      const maxLength = 200;
      const chunks = [];

      for (let i = 0; i < text.length; i += maxLength) {
        chunks.push(text.slice(i, i + maxLength));
      }

      if (chunks.length > 1) {
        // 如果文本太长，分段播放
        this.playSequentially(chunks.map(chunk => ({
          ...options,
          text: chunk,
          onStart: undefined,
          onEnd: undefined,
          onError: undefined,
        }))).then(resolve).catch(reject);
      } else {
        this.synthesis.speak(utterance);
      }
    });
  }

  /**
   * 顺序播放多个语音
   */
  async playSequentially(utterances) {
    for (const utteranceOptions of utterances) {
      await this.synthesize(utteranceOptions.text || utteranceOptions, {
        ...utteranceOptions,
        onEnd: undefined,
        onError: undefined,
      });
    }
    return { ok: true };
  }

  /**
   * 停止语音播放
   */
  stopSynthesis() {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
    return Promise.resolve({ ok: true });
  }

  /**
   * 暂停语音播放
   */
  pauseSynthesis() {
    if (this.synthesis) {
      this.synthesis.pause();
    }
    return Promise.resolve({ ok: true });
  }

  /**
   * 恢复语音播放
   */
  resumeSynthesis() {
    if (this.synthesis) {
      this.synthesis.resume();
    }
    return Promise.resolve({ ok: true });
  }

  /**
   * 获取错误消息
   */
  getErrorMessage(error) {
    const errorMessages = {
      'no-speech': '未检测到语音输入',
      'audio-capture': '无法访问麦克风',
      'not-allowed': '麦克风权限被拒绝',
      'network': '网络错误',
      'aborted': '语音识别已中止',
      'language-not-supported': '不支持的语言',
      'service-not-allowed': '语音服务不可用',
    };
    return errorMessages[error] || `未知错误: ${error}`;
  }

  /**
   * 请求麦克风权限
   */
  async requestMicrophonePermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // 停止测试流
      stream.getTracks().forEach(track => track.stop());
      return { ok: true, granted: true };
    } catch (error) {
      return {
        ok: false,
        granted: false,
        error: error.name,
        message: this.getPermissionErrorMessage(error.name),
      };
    }
  }

  /**
   * 获取权限错误消息
   */
  getPermissionErrorMessage(error) {
    const messages = {
      'NotAllowedError': '用户拒绝了麦克风权限',
      'NotFoundError': '未找到麦克风设备',
      'NotReadableError': '麦克风被其他应用占用',
      'OverconstrainedError': '麦克风不满足约束条件',
      'SecurityError': '安全限制阻止访问麦克风',
      'TypeError': '不支持麦克风访问',
    };
    return messages[error] || '无法访问麦克风';
  }

  /**
   * 检查麦克风权限状态
   */
  async checkMicrophonePermission() {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' });
      return {
        state: result.state, // 'granted', 'denied', 'prompt'
        ok: result.state === 'granted',
      };
    } catch (error) {
      // 权限API不支持，尝试实际请求
      return this.requestMicrophonePermission();
    }
  }

  /**
   * 录制音频
   */
  async startAudioRecording(options = {}) {
    if (!this.isAvailable.mediaRecorder) {
      throw new Error('浏览器不支持音频录制');
    }

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: options.audioConstraints || {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: options.sampleRate || 16000,
        },
      });

      // 创建AudioContext用于音频处理
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContextClass({
        sampleRate: options.sampleRate || 16000,
      });

      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      const processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      source.connect(processor);
      processor.connect(this.audioContext.destination);

      const audioChunks = [];
      this.mediaRecorder = new MediaRecorder(this.mediaStream, {
        mimeType: options.mimeType || 'audio/webm',
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
          if (options.onData) {
            options.onData(event.data);
          }
        }
      };

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        if (options.onComplete) {
          options.onComplete(audioBlob);
        }
      };

      this.mediaRecorder.start(options.timeslice || 1000);
      this.isRecording = true;

      return { ok: true, stream: this.mediaStream };
    } catch (error) {
      throw new Error(`音频录制失败: ${error.message}`);
    }
  }

  /**
   * 停止音频录制
   */
  async stopAudioRecording() {
    if (this.mediaRecorder && this.isRecording) {
      return new Promise((resolve) => {
        this.mediaRecorder.onstop = () => {
          this.isRecording = false;
          if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
          }
          if (this.audioContext) {
            await this.audioContext.close();
          }
          resolve({ ok: true });
        };
        this.mediaRecorder.stop();
      });
    }
    return { ok: false, reason: 'not_recording' };
  }

  /**
   * 清理资源
   */
  dispose() {
    this.abortRecognition();
    this.stopSynthesis();

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
    }

    if (this.audioContext) {
      this.audioContext.close();
    }

    this.recognition = null;
    this.mediaStream = null;
    this.audioContext = null;
    this.isRecording = false;
  }
}

// 导出单例实例
export const webVoiceService = new WebVoiceService();

// 导出类以便创建自定义实例
export default WebVoiceService;
