function toScenicGuideIpcError(error) {
  if (error && typeof error === 'object') {
    return {
      code: error.code || 'scenic_guide_ipc_error',
      message:
        typeof error.message === 'string' && error.message
          ? error.message
          : 'Scenic guide IPC request failed.',
    };
  }

  return {
    code: 'scenic_guide_ipc_error',
    message: 'Scenic guide IPC request failed.',
  };
}

function registerScenicGuideIpc({
  ipcMain,
  dialog,
  getWindow,
  officialDataManifestStore,
  officialDataImporter,
  scenicKnowledgeStore,
  scenicRagService,
  interactionLogStore,
  visitorAnalyticsService,
  multiRecallRag,
  routePlannerService,
  scenicEvalService,
  streamingTtsService,
} = {}) {
  if (!ipcMain) {
    return () => {};
  }

  ipcMain.handle('scenic-guide:get-manifest', async () => {
    try {
      return {
        ok: true,
        manifest: officialDataManifestStore?.getManifest?.() || null,
      };
    } catch (error) {
      return {
        ok: false,
        error: toScenicGuideIpcError(error),
      };
    }
  });

  ipcMain.handle('scenic-guide:pick-data-directory', async () => {
    try {
      if (!dialog || typeof dialog.showOpenDialog !== 'function') {
        return {
          ok: false,
          error: {
            code: 'dialog_unavailable',
            message: 'Directory picker is unavailable.',
          },
        };
      }

      const result = await dialog.showOpenDialog(getWindow?.() || undefined, {
        title: '选择灵山胜境官方资料包目录',
        properties: ['openDirectory'],
      });

      if (result.canceled || !Array.isArray(result.filePaths) || !result.filePaths[0]) {
        return {
          ok: false,
          canceled: true,
        };
      }

      return {
        ok: true,
        directoryPath: result.filePaths[0],
      };
    } catch (error) {
      return {
        ok: false,
        error: toScenicGuideIpcError(error),
      };
    }
  });

  ipcMain.handle('scenic-guide:inspect-data-directory', async (_event, request = {}) => {
    try {
      return officialDataImporter.inspectDataDirectory(request);
    } catch (error) {
      return {
        ok: false,
        error: toScenicGuideIpcError(error),
      };
    }
  });

  ipcMain.handle('scenic-guide:import-official-data', async (_event, request = {}) => {
    try {
      return officialDataImporter.importOfficialData(request);
    } catch (error) {
      return {
        ok: false,
        error: toScenicGuideIpcError(error),
      };
    }
  });

  ipcMain.handle('scenic-guide:get-import-summary', async () => {
    try {
      const manifest = officialDataManifestStore?.getManifest?.() || null;
      return {
        ok: true,
        importSummary: manifest?.importSummary || null,
        knowledgeSummary:
          scenicKnowledgeStore && typeof scenicKnowledgeStore.getSummary === 'function'
            ? scenicKnowledgeStore.getSummary()
            : manifest?.knowledgeSummary || null,
      };
    } catch (error) {
      return {
        ok: false,
        error: toScenicGuideIpcError(error),
      };
    }
  });

  ipcMain.handle('scenic-guide:get-knowledge-summary', async () => {
    try {
      return {
        ok: true,
        knowledgeSummary:
          scenicKnowledgeStore && typeof scenicKnowledgeStore.getSummary === 'function'
            ? scenicKnowledgeStore.getSummary()
            : null,
      };
    } catch (error) {
      return {
        ok: false,
        error: toScenicGuideIpcError(error),
      };
    }
  });

  ipcMain.handle('scenic-guide:list-spots', async (_event, request = {}) => {
    try {
      return {
        ok: true,
        spots:
          scenicKnowledgeStore && typeof scenicKnowledgeStore.listSpots === 'function'
            ? scenicKnowledgeStore.listSpots(request)
            : [],
      };
    } catch (error) {
      return {
        ok: false,
        error: toScenicGuideIpcError(error),
      };
    }
  });

  ipcMain.handle('scenic-guide:list-routes', async (_event, request = {}) => {
    try {
      return {
        ok: true,
        routes:
          scenicKnowledgeStore && typeof scenicKnowledgeStore.listRoutes === 'function'
            ? scenicKnowledgeStore.listRoutes(request)
            : [],
      };
    } catch (error) {
      return {
        ok: false,
        error: toScenicGuideIpcError(error),
      };
    }
  });

  ipcMain.handle('scenic-guide:list-knowledge-blocks', async (_event, request = {}) => {
    try {
      return {
        ok: true,
        knowledgeBlocks:
          scenicKnowledgeStore && typeof scenicKnowledgeStore.listKnowledgeBlocks === 'function'
            ? scenicKnowledgeStore.listKnowledgeBlocks(request)
            : [],
      };
    } catch (error) {
      return {
        ok: false,
        error: toScenicGuideIpcError(error),
      };
    }
  });

  ipcMain.handle('scenic-guide:ask-question', async (_event, request = {}) => {
    try {
      if (!scenicRagService || typeof scenicRagService.askQuestion !== 'function') {
        return {
          ok: false,
          error: {
            code: 'scenic_rag_unavailable',
            message: 'Scenic guide question answering is unavailable.',
          },
        };
      }

      return scenicRagService.askQuestion(request);
    } catch (error) {
      return {
        ok: false,
        error: toScenicGuideIpcError(error),
      };
    }
  });

  ipcMain.handle('scenic-guide:get-interaction-logs', async (_event, filters = {}) => {
    try {
      if (!interactionLogStore || typeof interactionLogStore.queryLogs !== 'function') {
        return {
          ok: false,
          error: {
            code: 'interaction_log_unavailable',
            message: 'Interaction log service is unavailable.',
          },
        };
      }

      const result = interactionLogStore.queryLogs(filters);
      return {
        ok: true,
        data: result,
      };
    } catch (error) {
      return {
        ok: false,
        error: toScenicGuideIpcError(error),
      };
    }
  });

  ipcMain.handle('scenic-guide:get-interaction-statistics', async (_event, timeRange = {}) => {
    try {
      if (!interactionLogStore || typeof interactionLogStore.getStatistics !== 'function') {
        return {
          ok: false,
          error: {
            code: 'interaction_log_unavailable',
            message: 'Interaction log service is unavailable.',
          },
        };
      }

      const stats = interactionLogStore.getStatistics(timeRange);
      return {
        ok: true,
        data: stats,
      };
    } catch (error) {
      return {
        ok: false,
        error: toScenicGuideIpcError(error),
      };
    }
  });

  ipcMain.handle('scenic-guide:rate-answer', async (_event, request = {}) => {
    try {
      if (!interactionLogStore || typeof interactionLogStore.updateRating !== 'function') {
        return {
          ok: false,
          error: {
            code: 'interaction_log_unavailable',
            message: 'Interaction log service is unavailable.',
          },
        };
      }

      const { logId, rating } = request;
      if (!logId || typeof rating !== 'number') {
        return {
          ok: false,
          error: {
            code: 'invalid_params',
            message: 'Missing required parameters: logId and rating',
          },
        };
      }

      const updated = await interactionLogStore.updateRating(logId, rating);
      return {
        ok: true,
        data: updated,
      };
    } catch (error) {
      return {
        ok: false,
        error: toScenicGuideIpcError(error),
      };
    }
  });

  ipcMain.handle('scenic-guide:get-analytics-dashboard', async (_event, timeRange = {}) => {
    try {
      if (!visitorAnalyticsService || typeof visitorAnalyticsService.getDashboardData !== 'function') {
        return {
          ok: false,
          error: {
            code: 'analytics_unavailable',
            message: 'Visitor analytics service is unavailable.',
          },
        };
      }

      const data = visitorAnalyticsService.getDashboardData(timeRange);
      return {
        ok: true,
        data,
      };
    } catch (error) {
      return {
        ok: false,
        error: toScenicGuideIpcError(error),
      };
    }
  });

  ipcMain.handle('scenic-guide:get-latency-metrics', async (_event, timeRange = {}) => {
    try {
      if (!visitorAnalyticsService || typeof visitorAnalyticsService.getLatencyMetrics !== 'function') {
        return {
          ok: false,
          error: {
            code: 'analytics_unavailable',
            message: 'Visitor analytics service is unavailable.',
          },
        };
      }

      const metrics = visitorAnalyticsService.getLatencyMetrics(timeRange);
      return {
        ok: true,
        data: metrics,
      };
    } catch (error) {
      return {
        ok: false,
        error: toScenicGuideIpcError(error),
      };
    }
  });

  ipcMain.handle('scenic-guide:get-hot-questions', async (_event, request = {}) => {
    try {
      if (!visitorAnalyticsService || typeof visitorAnalyticsService.getHotQuestions !== 'function') {
        return {
          ok: false,
          error: {
            code: 'analytics_unavailable',
            message: 'Visitor analytics service is unavailable.',
          },
        };
      }

      const limit = Number.isFinite(request.limit) ? request.limit : 10;
      const questions = visitorAnalyticsService.getHotQuestions(limit, request.timeRange || {});
      return {
        ok: true,
        data: questions,
      };
    } catch (error) {
      return {
        ok: false,
        error: toScenicGuideIpcError(error),
      };
    }
  });

  ipcMain.handle('scenic-guide:get-hot-spots', async (_event, request = {}) => {
    try {
      if (!visitorAnalyticsService || typeof visitorAnalyticsService.getHotSpots !== 'function') {
        return {
          ok: false,
          error: {
            code: 'analytics_unavailable',
            message: 'Visitor analytics service is unavailable.',
          },
        };
      }

      const limit = Number.isFinite(request.limit) ? request.limit : 5;
      const spots = visitorAnalyticsService.getHotSpots(limit, request.timeRange || {});
      return {
        ok: true,
        data: spots,
      };
    } catch (error) {
      return {
        ok: false,
        error: toScenicGuideIpcError(error),
      };
    }
  });

  ipcMain.handle('scenic-guide:get-satisfaction-trend', async (_event, timeRange = {}) => {
    try {
      if (!visitorAnalyticsService || typeof visitorAnalyticsService.getSatisfactionTrend !== 'function') {
        return {
          ok: false,
          error: {
            code: 'analytics_unavailable',
            message: 'Visitor analytics service is unavailable.',
          },
        };
      }

      const trend = visitorAnalyticsService.getSatisfactionTrend(timeRange);
      return {
        ok: true,
        data: trend,
      };
    } catch (error) {
      return {
        ok: false,
        error: toScenicGuideIpcError(error),
      };
    }
  });

  ipcMain.handle('scenic-guide:multi-recall-search', async (_event, request = {}) => {
    try {
      if (!multiRecallRag || typeof multiRecallRag.search !== 'function') {
        return {
          ok: false,
          error: {
            code: 'multi_recall_unavailable',
            message: 'Multi-recall RAG service is unavailable.',
          },
        };
      }

      const { query } = request;
      if (!query || typeof query !== 'string') {
        return {
          ok: false,
          error: {
            code: 'invalid_params',
            message: 'Missing required parameter: query',
          },
        };
      }

      const result = await multiRecallRag.search(query);
      return {
        ok: true,
        data: result,
      };
    } catch (error) {
      return {
        ok: false,
        error: toScenicGuideIpcError(error),
      };
    }
  });

  ipcMain.handle('scenic-guide:clear-interaction-logs', async () => {
    try {
      if (!interactionLogStore || typeof interactionLogStore.clear !== 'function') {
        return {
          ok: false,
          error: {
            code: 'interaction_log_unavailable',
            message: 'Interaction log service is unavailable.',
          },
        };
      }

      await interactionLogStore.clear();
      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: false,
        error: toScenicGuideIpcError(error),
      };
    }
  });

  ipcMain.handle('scenic-guide:plan-route', async (_event, request = {}) => {
    try {
      if (!routePlannerService || typeof routePlannerService.planRoute !== 'function') {
        return {
          ok: false,
          error: {
            code: 'route_planner_unavailable',
            message: 'Route planner service is unavailable.',
          },
        };
      }

      const result = await routePlannerService.planRoute(request);
      return result;
    } catch (error) {
      return {
        ok: false,
        error: toScenicGuideIpcError(error),
      };
    }
  });

  ipcMain.handle('scenic-guide:get-route-options', async () => {
    try {
      if (!routePlannerService) {
        return {
          ok: false,
          error: {
            code: 'route_planner_unavailable',
            message: 'Route planner service is unavailable.',
          },
        };
      }

      return {
        ok: true,
        data: {
          interests: routePlannerService.getAvailableInterests(),
          crowds: routePlannerService.getAvailableCrowds(),
          stamina: routePlannerService.getAvailableStamina(),
        },
      };
    } catch (error) {
      return {
        ok: false,
        error: toScenicGuideIpcError(error),
      };
    }
  });

  ipcMain.handle('scenic-guide:run-evaluation', async (_event, request = {}) => {
    try {
      if (!scenicEvalService || typeof scenicEvalService.runEvaluation !== 'function') {
        return {
          ok: false,
          error: {
            code: 'eval_service_unavailable',
            message: 'Evaluation service is unavailable.',
          },
        };
      }

      const { questionSet, onProgress } = request;

      if (!Array.isArray(questionSet) || questionSet.length === 0) {
        return {
          ok: false,
          error: {
            code: 'invalid_params',
            message: 'Question set is empty or invalid.',
          },
        };
      }

      const result = await scenicEvalService.runEvaluation(questionSet, { onProgress });
      return {
        ok: true,
        data: result,
      };
    } catch (error) {
      return {
        ok: false,
        error: toScenicGuideIpcError(error),
      };
    }
  });

  ipcMain.handle('scenic-guide:get-evaluation-report', async (_event, request = {}) => {
    try {
      if (!scenicEvalService) {
        return {
          ok: false,
          error: {
            code: 'eval_service_unavailable',
            message: 'Evaluation service is unavailable.',
          },
        };
      }

      const { evalId } = request;

      if (evalId) {
        const report = await scenicEvalService.getReport(evalId);
        return {
          ok: true,
          data: report,
        };
      } else {
        const report = await scenicEvalService.getLatestReport();
        return {
          ok: true,
          data: report,
        };
      }
    } catch (error) {
      return {
        ok: false,
        error: toScenicGuideIpcError(error),
      };
    }
  });

  ipcMain.handle('scenic-guide:get-evaluation-history', async () => {
    try {
      if (!scenicEvalService) {
        return {
          ok: false,
          error: {
            code: 'eval_service_unavailable',
            message: 'Evaluation service is unavailable.',
          },
        };
      }

      const history = scenicEvalService.getHistory();
      return {
        ok: true,
        data: history,
      };
    } catch (error) {
      return {
        ok: false,
        error: toScenicGuideIpcError(error),
      };
    }
  });

  ipcMain.handle('scenic-guide:clear-evaluation-history', async () => {
    try {
      if (!scenicEvalService || typeof scenicEvalService.clearHistory !== 'function') {
        return {
          ok: false,
          error: {
            code: 'eval_service_unavailable',
            message: 'Evaluation service is unavailable.',
          },
        };
      }

      await scenicEvalService.clearHistory();
      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: false,
        error: toScenicGuideIpcError(error),
      };
    }
  });

  ipcMain.handle('scenic-guide:tts-synthesize-stream', async (_event, request = {}) => {
    try {
      if (!streamingTtsService || typeof streamingTtsService.processTextStream !== 'function') {
        return {
          ok: false,
          error: {
            code: 'streaming_tts_unavailable',
            message: 'Streaming TTS service is unavailable.',
          },
        };
      }

      const { text, signal } = request;

      if (!text) {
        return {
          ok: false,
          error: {
            code: 'invalid_params',
            message: 'Missing required parameter: text',
          },
        };
      }

      const mockStream = (async function* () {
        const sentences = text.split(/([。！？.!?\\n])/);
        let current = '';

        for (const part of sentences) {
          current += part;
          if (/^[。！？.!?\\n]$/.test(part)) {
            yield { text: current };
            current = '';
          }
        }

        if (current) {
          yield { text: current };
        }
      }());

      const result = await streamingTtsService.processTextStream({
        textStream: mockStream,
        signal,
      });

      return {
        ok: true,
        data: result,
      };
    } catch (error) {
      return {
        ok: false,
        error: toScenicGuideIpcError(error),
      };
    }
  });

  ipcMain.handle('scenic-guide:tts-synthesize-full', async (_event, request = {}) => {
    try {
      if (!streamingTtsService || typeof streamingTtsService.synthesizeFullText !== 'function') {
        return {
          ok: false,
          error: {
            code: 'streaming_tts_unavailable',
            message: 'Streaming TTS service is unavailable.',
          },
        };
      }

      const { text, signal } = request;

      if (!text || typeof text !== 'string') {
        return {
          ok: false,
          error: {
            code: 'invalid_params',
            message: 'Missing required parameter: text',
          },
        };
      }

      const result = await streamingTtsService.synthesizeFullText({
        text,
        signal,
        onProgress: request.onProgress,
      });

      return {
        ok: true,
        data: result,
      };
    } catch (error) {
      return {
        ok: false,
        error: toScenicGuideIpcError(error),
      };
    }
  });

  ipcMain.handle('scenic-guide:tts-get-metrics', async () => {
    try {
      if (!streamingTtsService || typeof streamingTtsService.getMetrics !== 'function') {
        return {
          ok: false,
          error: {
            code: 'streaming_tts_unavailable',
            message: 'Streaming TTS service is unavailable.',
          },
        };
      }

      const metrics = streamingTtsService.getMetrics();
      return {
        ok: true,
        data: metrics,
      };
    } catch (error) {
      return {
        ok: false,
        error: toScenicGuideIpcError(error),
      };
    }
  });

  ipcMain.handle('scenic-guide:tts-get-queue-status', async () => {
    try {
      if (!streamingTtsService || typeof streamingTtsService.getQueueStatus !== 'function') {
        return {
          ok: false,
          error: {
            code: 'streaming_tts_unavailable',
            message: 'Streaming TTS service is unavailable.',
          },
        };
      }

      const status = streamingTtsService.getQueueStatus();
      return {
        ok: true,
        data: status,
      };
    } catch (error) {
      return {
        ok: false,
        error: toScenicGuideIpcError(error),
      };
    }
  });

  ipcMain.handle('scenic-guide:tts-cancel', async () => {
    try {
      if (!streamingTtsService || typeof streamingTtsService.cancel !== 'function') {
        return {
          ok: false,
          error: {
            code: 'streaming_tts_unavailable',
            message: 'Streaming TTS service is unavailable.',
          },
        };
      }

      streamingTtsService.cancel();
      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: false,
        error: toScenicGuideIpcError(error),
      };
    }
  });

  ipcMain.handle('scenic-guide:tts-extract-sentences', async (_event, request = {}) => {
    try {
      if (!streamingTtsService || typeof streamingTtsService.extractCompleteSentences !== 'function') {
        return {
          ok: false,
          error: {
            code: 'streaming_tts_unavailable',
            message: 'Streaming TTS service is unavailable.',
          },
        };
      }

      const { text } = request;

      if (!text || typeof text !== 'string') {
        return {
          ok: false,
          error: {
            code: 'invalid_params',
            message: 'Missing required parameter: text',
          },
        };
      }

      const result = streamingTtsService.extractCompleteSentences(text);
      return {
        ok: true,
        data: result,
      };
    } catch (error) {
      return {
        ok: false,
        error: toScenicGuideIpcError(error),
      };
    }
  });

  ipcMain.handle('scenic-guide:performance-warmup', async (_event, request = {}) => {
    try {
      if (!multiRecallRag || typeof multiRecallRag.warmup !== 'function') {
        return {
          ok: false,
          error: {
            code: 'warmup_unavailable',
            message: 'Warmup functionality is unavailable.',
          },
        };
      }

      const { queries } = request;

      const result = await multiRecallRag.warmup({ queries });
      return {
        ok: true,
        data: result,
      };
    } catch (error) {
      return {
        ok: false,
        error: toScenicGuideIpcError(error),
      };
    }
  });

  ipcMain.handle('scenic-guide:performance-clear-cache', async () => {
    try {
      if (!multiRecallRag || typeof multiRecallRag.clearCache !== 'function') {
        return {
          ok: false,
          error: {
            code: 'cache_unavailable',
            message: 'Cache functionality is unavailable.',
          },
        };
      }

      multiRecallRag.clearCache();
      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: false,
        error: toScenicGuideIpcError(error),
      };
    }
  });

  ipcMain.handle('scenic-guide:performance-get-cache-stats', async () => {
    try {
      if (!multiRecallRag || typeof multiRecallRag.getCacheStats !== 'function') {
        return {
          ok: false,
          error: {
            code: 'cache_unavailable',
            message: 'Cache functionality is unavailable.',
          },
        };
      }

      const stats = multiRecallRag.getCacheStats();
      return {
        ok: true,
        data: stats,
      };
    } catch (error) {
      return {
        ok: false,
        error: toScenicGuideIpcError(error),
      };
    }
  });

  ipcMain.handle('scenic-guide:performance-get-metrics', async (_event, request = {}) => {
    try {
      if (!multiRecallRag || typeof multiRecallRag.getMetrics !== 'function') {
        return {
          ok: false,
          error: {
            code: 'metrics_unavailable',
            message: 'Metrics functionality is unavailable.',
          },
        };
      }

      const { operation } = request;
      const metrics = multiRecallRag.getMetrics(operation);
      return {
        ok: true,
        data: metrics,
      };
    } catch (error) {
      return {
        ok: false,
        error: toScenicGuideIpcError(error),
      };
    }
  });

  ipcMain.handle('scenic-guide:performance-get-report', async () => {
    try {
      if (!multiRecallRag || typeof multiRecallRag.getPerformanceReport !== 'function') {
        return {
          ok: false,
          error: {
            code: 'metrics_unavailable',
            message: 'Performance report is unavailable.',
          },
        };
      }

      const report = multiRecallRag.getPerformanceReport();
      return {
        ok: true,
        data: report,
      };
    } catch (error) {
      return {
        ok: false,
        error: toScenicGuideIpcError(error),
      };
    }
  });

  ipcMain.handle('scenic-guide:performance-reset-metrics', async () => {
    try {
      if (!multiRecallRag || typeof multiRecallRag.resetMetrics !== 'function') {
        return {
          ok: false,
          error: {
            code: 'metrics_unavailable',
            message: 'Metrics functionality is unavailable.',
          },
        };
      }

      multiRecallRag.resetMetrics();
      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: false,
        error: toScenicGuideIpcError(error),
      };
    }
  });

  return () => {
    ipcMain.removeHandler('scenic-guide:get-manifest');
    ipcMain.removeHandler('scenic-guide:pick-data-directory');
    ipcMain.removeHandler('scenic-guide:inspect-data-directory');
    ipcMain.removeHandler('scenic-guide:import-official-data');
    ipcMain.removeHandler('scenic-guide:get-import-summary');
    ipcMain.removeHandler('scenic-guide:get-knowledge-summary');
    ipcMain.removeHandler('scenic-guide:list-spots');
    ipcMain.removeHandler('scenic-guide:list-routes');
    ipcMain.removeHandler('scenic-guide:list-knowledge-blocks');
    ipcMain.removeHandler('scenic-guide:ask-question');
    ipcMain.removeHandler('scenic-guide:get-interaction-logs');
    ipcMain.removeHandler('scenic-guide:get-interaction-statistics');
    ipcMain.removeHandler('scenic-guide:rate-answer');
    ipcMain.removeHandler('scenic-guide:get-analytics-dashboard');
    ipcMain.removeHandler('scenic-guide:get-latency-metrics');
    ipcMain.removeHandler('scenic-guide:get-hot-questions');
    ipcMain.removeHandler('scenic-guide:get-hot-spots');
    ipcMain.removeHandler('scenic-guide:get-satisfaction-trend');
    ipcMain.removeHandler('scenic-guide:multi-recall-search');
    ipcMain.removeHandler('scenic-guide:clear-interaction-logs');
    ipcMain.removeHandler('scenic-guide:plan-route');
    ipcMain.removeHandler('scenic-guide:get-route-options');
    ipcMain.removeHandler('scenic-guide:run-evaluation');
    ipcMain.removeHandler('scenic-guide:get-evaluation-report');
    ipcMain.removeHandler('scenic-guide:get-evaluation-history');
    ipcMain.removeHandler('scenic-guide:clear-evaluation-history');
    ipcMain.removeHandler('scenic-guide:tts-synthesize-stream');
    ipcMain.removeHandler('scenic-guide:tts-synthesize-full');
    ipcMain.removeHandler('scenic-guide:tts-get-metrics');
    ipcMain.removeHandler('scenic-guide:tts-get-queue-status');
    ipcMain.removeHandler('scenic-guide:tts-cancel');
    ipcMain.removeHandler('scenic-guide:tts-extract-sentences');
    ipcMain.removeHandler('scenic-guide:performance-warmup');
    ipcMain.removeHandler('scenic-guide:performance-clear-cache');
    ipcMain.removeHandler('scenic-guide:performance-get-cache-stats');
    ipcMain.removeHandler('scenic-guide:performance-get-metrics');
    ipcMain.removeHandler('scenic-guide:performance-get-report');
    ipcMain.removeHandler('scenic-guide:performance-reset-metrics');
  };
}

module.exports = {
  registerScenicGuideIpc,
  toScenicGuideIpcError,
};
