import { useState, useEffect, useCallback } from 'react';
import { DIGITAL_HUMAN_STATES } from '../../components/scenic/DigitalHumanState.jsx';

/**
 * 数字人情感状态管理Hook
 *
 * 功能：
 * - 监听问答状态变化
 * - 根据回答内容自动检测情感
 * - 切换数字人状态
 * - 提供状态控制方法
 *
 * @returns {Object} 数字人状态管理对象
 */
export function useDigitalHumanState() {
  const [currentState, setCurrentState] = useState('IDLE');
  const [emotion, setEmotion] = useState(null);
  const [confidence, setConfidence] = useState(0);

  /**
   * 根据回答内容检测情感
   */
  const detectEmotionFromAnswer = useCallback((answer, sources = []) => {
    if (!answer) {
      return 'NEUTRAL';
    }

    const answerLower = answer.toLowerCase();

    // 检测佛教文化/历史相关内容 → 恭敬庄重
    if (
      answerLower.includes('佛教') ||
      answerLower.includes('文化') ||
      answerLower.includes('历史') ||
      answerLower.includes('典故') ||
      answerLower.includes('传承') ||
      answerLower.includes('佛教艺术') ||
      answerLower.includes('禅宗') ||
      answerLower.includes('佛法')
    ) {
      return 'SOLEMN';
    }

    // 检测自然风光/拍照点相关内容 → 愉快轻松
    if (
      answerLower.includes('风景') ||
      answerLower.includes('风光') ||
      answerLower.includes('自然') ||
      answerLower.includes('拍照') ||
      answerLower.includes('打卡') ||
      answerLower.includes('美景') ||
      answerLower.includes('景色') ||
      answerLower.includes('湖泊') ||
      answerLower.includes('花园')
    ) {
      return 'CHEERFUL';
    }

    // 检测路线推荐相关内容 → 热情推荐
    if (
      answerLower.includes('路线') ||
      answerLower.includes('推荐') ||
      answerLower.includes('安排') ||
      answerLower.includes('游览') ||
      answerLower.includes('行程') ||
      answerLower.includes('建议')
    ) {
      return 'GUIDING';
    }

    // 默认为中性讲解
    return 'NEUTRAL';
  }, []);

  /**
   * 开始提问
   */
  const handleQuestionStart = useCallback(() => {
    setCurrentState('LISTENING');
    setEmotion(null);
    setConfidence(0);
  }, []);

  /**
   * 开始检索
   */
  const handleRagStart = useCallback(() => {
    setCurrentState('THINKING');
    setEmotion(null);
    setConfidence(0.5);
  }, []);

  /**
   * 开始回答（TTS开始）
   */
  const handleTtsStart = useCallback((answerData) => {
    // 检测情感
    const detectedEmotion = detectEmotionFromAnswer(
      answerData?.answer || '',
      answerData?.sources || []
    );

    setCurrentState('SPEAKING');
    setEmotion(detectedEmotion);
    setConfidence(0.85);
  }, [detectEmotionFromAnswer]);

  /**
   * 回答结束
   */
  const handleTtsEnd = useCallback(() => {
    setCurrentState('IDLE');
    setEmotion(null);
    setConfidence(0);
  }, []);

  /**
   * 显示路线推荐
   */
  const handleRouteShow = useCallback(() => {
    setCurrentState('GUIDING');
    setEmotion('GUIDING');
    setConfidence(0.9);
  }, []);

  /**
   * 未命中问题
   */
  const handleNoHit = useCallback(() => {
    setCurrentState('APOLOGIZING');
    setEmotion('APOLOGIZING');
    setConfidence(0.7);
  }, []);

  /**
   * 收到好评
   */
  const handlePositiveRating = useCallback(() => {
    setCurrentState('HAPPY');
    setEmotion('HAPPY');
    setConfidence(1.0);

    // 2秒后自动回到待机状态
    const timer = setTimeout(() => {
      setCurrentState('IDLE');
      setEmotion(null);
      setConfidence(0);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  /**
   * 收到差评
   */
  const handleNegativeRating = useCallback(() => {
    setCurrentState('APOLOGIZING');
    setEmotion('APOLOGIZING');
    setConfidence(0.7);

    // 3秒后自动回到待机状态
    const timer = setTimeout(() => {
      setCurrentState('IDLE');
      setEmotion(null);
      setConfidence(0);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  /**
   * 手动设置状态（供外部调用）
   */
  const setState = useCallback((stateKey) => {
    if (DIGITAL_HUMAN_STATES[stateKey]) {
      setCurrentState(stateKey);
      setEmotion(stateKey);
      setConfidence(0.8);
    }
  }, []);

  /**
   * 重置状态
   */
  const resetState = useCallback(() => {
    setCurrentState('IDLE');
    setEmotion(null);
    setConfidence(0);
  }, []);

  /**
   * 获取当前状态详情
   */
  const getStateInfo = useCallback(() => {
    return DIGITAL_HUMAN_STATES[currentState] || DIGITAL_HUMAN_STATES.IDLE;
  }, [currentState]);

  return {
    // 当前状态
    currentState,
    emotion,
    confidence,
    stateInfo: getStateInfo(),

    // 状态控制方法
    handleQuestionStart,
    handleRagStart,
    handleTtsStart,
    handleTtsEnd,
    handleRouteShow,
    handleNoHit,
    handlePositiveRating,
    handleNegativeRating,
    setState,
    resetState,

    // 状态常量
    STATES: DIGITAL_HUMAN_STATES,
  };
}
