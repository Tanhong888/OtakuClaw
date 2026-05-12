const { createTtsService } = require('./ttsService');

const SENTENCE_DELIMITERS = new Set(['。', '！', '？', '.', '!', '?', '\n']);
const MIN_SENTENCE_LENGTH = 3;
const MAX_SENTENCE_LENGTH = 200;
const CHUNK_TIMEOUT_MS = 500;
const MAX_QUEUE_SIZE = 10;

function createStreamingTTSService({ ttsService = null, ttsOptions = {} } = {}) {
  const tts = ttsService || createTtsService(ttsOptions);

  let audioQueue = [];
  let isProcessing = false;
  let isPlaying = false;
  let currentAbortController = null;
  let sessionStartTime = null;
  let firstSentenceTime = null;
  let synthesisMetrics = {
    totalSentences: 0,
    synthesizedSentences: 0,
    audioChunks: 0,
    totalAudioBytes: 0,
  };

  function resetMetrics() {
    sessionStartTime = null;
    firstSentenceTime = null;
    synthesisMetrics = {
      totalSentences: 0,
      synthesizedSentences: 0,
      audioChunks: 0,
      totalAudioBytes: 0,
    };
  }

  function getMetrics() {
    return {
      ...synthesisMetrics,
      firstSentenceLatency: firstSentenceTime && sessionStartTime
        ? firstSentenceTime - sessionStartTime
        : null,
      sessionDuration: sessionStartTime ? Date.now() - sessionStartTime : null,
      queueLength: audioQueue.length,
      isProcessing,
      isPlaying,
    };
  }

  function extractCompleteSentences(text) {
    if (!text || typeof text !== 'string') {
      return { sentences: [], remainder: '' };
    }

    const sentences = [];
    let currentSentence = '';
    let i = 0;

    while (i < text.length) {
      const char = text[i];
      currentSentence += char;

      if (SENTENCE_DELIMITERS.has(char)) {
        const trimmed = currentSentence.trim();
        if (trimmed.length >= MIN_SENTENCE_LENGTH) {
          sentences.push(trimmed);
        }
        currentSentence = '';
      }

      i += 1;
    }

    const remainder = currentSentence.trim();

    if (remainder.length > MAX_SENTENCE_LENGTH) {
      const lastSpace = Math.max(
        remainder.lastIndexOf(' '),
        remainder.lastIndexOf('，'),
        remainder.lastIndexOf(','),
      );
      if (lastSpace > MIN_SENTENCE_LENGTH) {
        const forcedSentence = remainder.slice(0, lastSpace + 1).trim();
        if (forcedSentence.length >= MIN_SENTENCE_LENGTH) {
          sentences.push(forcedSentence);
        }
        return { sentences, remainder: remainder.slice(lastSpace + 1).trim() };
      }
      sentences.push(remainder.slice(0, MAX_SENTENCE_LENGTH).trim());
      return { sentences, remainder: remainder.slice(MAX_SENTENCE_LENGTH).trim() };
    }

    return { sentences, remainder };
  }

  async function synthesizeSentence(sentence, signal) {
    synthesisMetrics.synthesizedSentences += 1;

    const result = await tts.synthesize({
      text: sentence,
      signal,
      onChunk: (chunk) => {
        synthesisMetrics.audioChunks += 1;
        synthesisMetrics.totalAudioBytes += chunk.audioChunk?.length || 0;
      },
    });

    return {
      text: sentence,
      audioData: null,
      sampleRate: result.sampleRate || 24000,
      sampleCount: result.sampleCount || 0,
      synthesizedAt: Date.now(),
    };
  }

  async function processTextStream({
    textStream,
    onSentenceComplete,
    onAudioReady,
    onError,
    signal,
  } = {}) {
    if (isProcessing) {
      throw new Error('Streaming TTS is already processing a session. Cancel the current session first.');
    }

    isProcessing = true;
    resetMetrics();
    sessionStartTime = Date.now();
    audioQueue = [];
    isPlaying = false;

    if (signal?.aborted) {
      isProcessing = false;
      throw new Error('Stream aborted before processing started.');
    }

    currentAbortController = new AbortController();
    const combinedSignal = signal
      ? AbortSignal.any([signal, currentAbortController.signal])
      : currentAbortController.signal;

    let sentenceBuffer = '';
    let processingChain = Promise.resolve();

    try {
      for await (const chunk of textStream) {
        if (combinedSignal.aborted) {
          break;
        }

        const chunkText = chunk?.text || chunk || '';
        if (typeof chunkText !== 'string' || !chunkText.trim()) {
          continue;
        }

        sentenceBuffer += chunkText;

        const { sentences, remainder } = extractCompleteSentences(sentenceBuffer);

        if (sentences.length > 0) {
          synthesisMetrics.totalSentences += sentences.length;

          for (const sentence of sentences) {
            if (combinedSignal.aborted) {
              break;
            }

            const sentenceIndex = audioQueue.length;
            audioQueue.push({
              text: sentence,
              status: 'pending',
              audioData: null,
              error: null,
            });

            processingChain = processingChain
              .then(async () => {
                if (combinedSignal.aborted) {
                  return;
                }

                if (audioQueue[sentenceIndex]?.status === 'pending') {
                  audioQueue[sentenceIndex].status = 'synthesizing';
                  audioQueue[sentenceIndex].startedAt = Date.now();

                  try {
                    const result = await synthesizeSentence(sentence, combinedSignal);

                    if (!firstSentenceTime) {
                      firstSentenceTime = Date.now();
                    }

                    audioQueue[sentenceIndex] = {
                      ...audioQueue[sentenceIndex],
                      ...result,
                      status: 'complete',
                      completedAt: Date.now(),
                    };

                    if (typeof onSentenceComplete === 'function') {
                      onSentenceComplete({
                        sentence,
                        sentenceIndex,
                        metrics: getMetrics(),
                      });
                    }

                    if (typeof onAudioReady === 'function') {
                      onAudioReady({
                        type: 'sentence-complete',
                        sentence,
                        sentenceIndex,
                        sampleRate: result.sampleRate,
                        sampleCount: result.sampleCount,
                        isQueueEmpty: false,
                        metrics: getMetrics(),
                      });
                    }

                    if (!isPlaying) {
                      isPlaying = true;
                      if (typeof onAudioReady === 'function') {
                        onAudioReady({
                          type: 'playback-started',
                          firstSentence: sentence,
                          sentenceIndex,
                          latency: firstSentenceTime - sessionStartTime,
                          metrics: getMetrics(),
                        });
                      }
                    }
                  } catch (error) {
                    audioQueue[sentenceIndex] = {
                      ...audioQueue[sentenceIndex],
                      status: 'error',
                      error: error?.message || String(error),
                    };

                    if (typeof onError === 'function') {
                      onError({
                        sentence,
                        sentenceIndex,
                        error,
                      });
                    }
                  }
                }
              })
              .catch((error) => {
                if (typeof onError === 'function') {
                  onError({
                    sentence,
                    sentenceIndex,
                    error,
                  });
                }
              });
          }

          sentenceBuffer = remainder;
        }
      }

      if (!combinedSignal.aborted && sentenceBuffer.trim().length >= MIN_SENTENCE_LENGTH) {
        synthesisMetrics.totalSentences += 1;
        const finalSentenceIndex = audioQueue.length;

        audioQueue.push({
          text: sentenceBuffer.trim(),
          status: 'pending',
          audioData: null,
          error: null,
        });

        processingChain = processingChain
          .then(async () => {
            if (combinedSignal.aborted) {
              return;
            }

            if (audioQueue[finalSentenceIndex]?.status === 'pending') {
              audioQueue[finalSentenceIndex].status = 'synthesizing';

              try {
                const result = await synthesizeSentence(sentenceBuffer.trim(), combinedSignal);

                if (!firstSentenceTime) {
                  firstSentenceTime = Date.now();
                }

                audioQueue[finalSentenceIndex] = {
                  ...audioQueue[finalSentenceIndex],
                  ...result,
                  status: 'complete',
                };

                if (typeof onSentenceComplete === 'function') {
                  onSentenceComplete({
                    sentence: sentenceBuffer.trim(),
                    sentenceIndex: finalSentenceIndex,
                    isFinal: true,
                    metrics: getMetrics(),
                  });
                }

                if (typeof onAudioReady === 'function') {
                  onAudioReady({
                    type: 'session-complete',
                    sentence: sentenceBuffer.trim(),
                    sentenceIndex: finalSentenceIndex,
                    isFinal: true,
                    metrics: getMetrics(),
                  });
                }
              } catch (error) {
                audioQueue[finalSentenceIndex] = {
                  ...audioQueue[finalSentenceIndex],
                  status: 'error',
                  error: error?.message || String(error),
                };

                if (typeof onError === 'function') {
                  onError({
                    sentence: sentenceBuffer.trim(),
                    sentenceIndex: finalSentenceIndex,
                    error,
                  });
                }
              }
            }
          })
          .catch((error) => {
            if (typeof onError === 'function') {
              onError({
                sentence: sentenceBuffer.trim(),
                sentenceIndex: finalSentenceIndex,
                error,
              });
            }
          });
      }

      await processingChain;

      if (typeof onAudioReady === 'function' && !combinedSignal.aborted) {
        onAudioReady({
          type: 'all-complete',
          totalSentences: synthesisMetrics.totalSentences,
          successfulSentences: synthesisMetrics.synthesizedSentences,
          metrics: getMetrics(),
        });
      }

      return {
        ok: true,
        metrics: getMetrics(),
        queue: audioQueue.map((item, index) => ({
          index,
          text: item.text,
          status: item.status,
          error: item.error,
        })),
      };
    } catch (error) {
      isProcessing = false;
      isPlaying = false;
      throw error;
    } finally {
      if (!combinedSignal.aborted) {
        isProcessing = false;
      }
    }
  }

  async function synthesizeFullText({ text, onProgress, signal } = {}) {
    if (!text || typeof text !== 'string') {
      throw new Error('Text is required for full text synthesis.');
    }

    isProcessing = true;
    resetMetrics();
    sessionStartTime = Date.now();

    const { sentences, remainder } = extractCompleteSentences(text);
    const allSentences = [...sentences];
    if (remainder.trim().length >= MIN_SENTENCE_LENGTH) {
      allSentences.push(remainder.trim());
    }

    synthesisMetrics.totalSentences = allSentences.length;

    const results = [];
    currentAbortController = new AbortController();
    const combinedSignal = signal
      ? AbortSignal.any([signal, currentAbortController.signal])
      : currentAbortController.signal;

    try {
      for (let i = 0; i < allSentences.length; i += 1) {
        if (combinedSignal.aborted) {
          break;
        }

        const sentence = allSentences[i];

        if (typeof onProgress === 'function') {
          onProgress({
            current: i,
            total: allSentences.length,
            sentence,
          });
        }

        const result = await synthesizeSentence(sentence, combinedSignal);
        results.push(result);

        if (!firstSentenceTime) {
          firstSentenceTime = Date.now();
        }
      }

      return {
        ok: true,
        sentences: results,
        metrics: getMetrics(),
      };
    } finally {
      isProcessing = false;
    }
  }

  function cancel() {
    if (currentAbortController) {
      currentAbortController.abort();
    }
    isProcessing = false;
    isPlaying = false;
    audioQueue = [];
  }

  function getQueueStatus() {
    return {
      length: audioQueue.length,
      items: audioQueue.map((item, index) => ({
        index,
        text: item.text,
        status: item.status,
        error: item.error,
      })),
      isProcessing,
      isPlaying,
    };
  }

  async function dispose() {
    cancel();
    if (typeof tts.dispose === 'function') {
      await tts.dispose();
    }
  }

  return {
    processTextStream,
    synthesizeFullText,
    extractCompleteSentences,
    cancel,
    getQueueStatus,
    getMetrics,
    dispose,
    isProcessing: () => isProcessing,
    isPlaying: () => isPlaying,
  };
}

module.exports = {
  createStreamingTTSService,
  SENTENCE_DELIMITERS,
  MIN_SENTENCE_LENGTH,
  MAX_SENTENCE_LENGTH,
};
