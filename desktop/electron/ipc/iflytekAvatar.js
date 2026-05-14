function registerIFlytekAvatarIpc({ ipcMain, avatarService }) {
  if (!ipcMain) {
    return () => {};
  }

  ipcMain.handle('avatar:generate-video', async (_event, request = {}) => {
    try {
      if (!avatarService) {
        return {
          ok: false,
          error: {
            code: 'avatar_service_unavailable',
            message: 'Avatar service is unavailable.',
          },
        };
      }

      const { text, voiceId, avatarId } = request;

      if (!text || typeof text !== 'string') {
        return {
          ok: false,
          error: {
            code: 'invalid_params',
            message: 'Missing required parameter: text',
          },
        };
      }

      const result = await avatarService.generateAvatarVideo({
        text,
        voiceId,
        avatarId,
      });

      return result;
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'avatar_ipc_error',
          message: error?.message || 'Avatar video generation failed.',
        },
      };
    }
  });

  ipcMain.handle('avatar:get-config', async () => {
    try {
      if (!avatarService) {
        return {
          ok: false,
          error: {
            code: 'avatar_service_unavailable',
            message: 'Avatar service is unavailable.',
          },
        };
      }

      return {
        ok: true,
        config: avatarService.getConfig(),
      };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'avatar_ipc_error',
          message: error?.message || 'Failed to get avatar config.',
        },
      };
    }
  });

  ipcMain.handle('avatar:update-config', async (_event, request = {}) => {
    try {
      if (!avatarService) {
        return {
          ok: false,
          error: {
            code: 'avatar_service_unavailable',
            message: 'Avatar service is unavailable.',
          },
        };
      }

      avatarService.updateConfig(request);

      return {
        ok: true,
        config: avatarService.getConfig(),
      };
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'avatar_ipc_error',
          message: error?.message || 'Failed to update avatar config.',
        },
      };
    }
  });

  ipcMain.handle('avatar:list-avatars', async () => {
    try {
      if (!avatarService) {
        return {
          ok: false,
          error: {
            code: 'avatar_service_unavailable',
            message: 'Avatar service is unavailable.',
          },
        };
      }

      return await avatarService.getAvatarList();
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'avatar_ipc_error',
          message: error?.message || 'Failed to list avatars.',
        },
      };
    }
  });

  ipcMain.handle('avatar:list-voices', async () => {
    try {
      if (!avatarService) {
        return {
          ok: false,
          error: {
            code: 'avatar_service_unavailable',
            message: 'Avatar service is unavailable.',
          },
        };
      }

      return await avatarService.getVoiceList();
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'avatar_ipc_error',
          message: error?.message || 'Failed to list voices.',
        },
      };
    }
  });

  ipcMain.handle('avatar:check-health', async () => {
    try {
      if (!avatarService) {
        return {
          ok: false,
          error: {
            code: 'avatar_service_unavailable',
            message: 'Avatar service is unavailable.',
          },
        };
      }

      return await avatarService.checkHealth();
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'avatar_ipc_error',
          message: error?.message || 'Health check failed.',
        },
      };
    }
  });

  return () => {
    ipcMain.removeHandler('avatar:generate-video');
    ipcMain.removeHandler('avatar:get-config');
    ipcMain.removeHandler('avatar:update-config');
    ipcMain.removeHandler('avatar:list-avatars');
    ipcMain.removeHandler('avatar:list-voices');
    ipcMain.removeHandler('avatar:check-health');
  };
}

module.exports = {
  registerIFlytekAvatarIpc,
};
