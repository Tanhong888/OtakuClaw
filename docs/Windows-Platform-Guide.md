# Windows平台开发指南

## 概述
本文档描述OtakuClaw桌面应用在Windows平台上的特定配置和实现细节。

## 已实现的Windows特定功能

### 1. 快捷键配置
- **默认语音切换快捷键**: `Ctrl+Shift+Space`
- macOS使用F8是因为空格键常被系统或输入法拦截
- 可通过环境变量 `OPENCLAW_VOICE_TOGGLE_ACCELERATOR` 自定义

### 2. 窗口控制行为
- **关闭按钮**: 直接关闭窗口
- **最小化按钮**: 最小化到任务栏
- **应用退出**: 在所有窗口关闭时自动退出应用

### 3. 麦克风权限
- Windows平台直接授予麦克风权限
- 无需像macOS那样的 `systemPreferences.askForMediaAccess` 调用
- 权限请求在 `registerMediaPermissionHandlers()` 中处理

### 4. Python环境
- **Python可执行文件**: 使用 `python` 命令
- **路径分隔符**: 使用反斜杠 `\`
- **环境变量**: 使用Windows格式 (`%ENV_VAR%` 或 PowerShell `$env:ENV_VAR`)

### 5. Live2D模型加载
- 协议处理: `live2d://` 协议用于加载本地模型
- 文件路径: 使用Windows绝对路径格式
- 资源访问: 通过 `live2dModelLibrary.readAssetFromProtocolUrl()` 实现

### 6. 文件关联
- **文件扩展名**: `.lingshan`
- **关联名称**: 灵山胜境资料包
- **关联角色**: Editor

### 7. 安装程序配置
- **安装程序类型**: NSIS
- **安装选项**:
  - 允许用户更改安装目录
  - 创建桌面快捷方��
  - 创建开始菜单快捷方式
  - 支持每用户或每机器安装

## 构建Windows应用

### 开发环境要求
- Node.js 20+
- pnpm 10.28.0+
- Windows 10/11

### 构建命令
```bash
# 构建Windows x64版本
pnpm run desktop:build:win

# 或使用electron-builder直接构建
pnpm run frontend:build
pnpm exec electron-builder --win --x64
```

### 输出文件
- 安装程序: `release/OtakuClaw-{version}-x64-setup.exe`
- 构建日志: `release/builder-effective-config.yaml`

## 平台检测实现

```javascript
// 检测当前平台
if (process.platform === 'win32') {
  // Windows特定代码
}

// 检测macOS
if (process.platform === 'darwin') {
  // macOS特定代码
}

// 检测Linux
if (process.platform === 'linux') {
  // Linux特定代码
}
```

## 音频配置

### 音频输入
- 使用默认的Windows音频输入设备
- 支持通过系统设置更改默认设备
- ASR服务自动使用系统默认麦克风

### 音频输出
- 使用默认的Windows音频输出设备
- 支持实时语音合成 (TTS)
- 流式TTS服务已集成

## 常见问题

### Q: 为什么Windows上的语音快捷键是Ctrl+Shift+Space而不是F8?
A: 在Windows上，F8键通常用于系统引导菜单或调试功能。Ctrl+Shift+Space是一个不太可能与其他应用冲突的组合键。

### Q: 如何更改麦克风输入设备?
A: 通过Windows系统设置 > 系统 > 声音 更改默认输入设备，应用会自动使用系统默认设备。

### Q: 安装时能否选择安装路径?
A: 是的，NSIS安装程序允许选择自定义安装路径。

### Q: 如何卸载应用?
A: 通过Windows控制面板的程序和功能，或开始菜单中的卸载快捷方式。

## 故障排除

### 麦克风无法工作
1. 检查Windows隐私设置中的麦克风权限
2. 确认系统默认录音设备已正确设置
3. 测试麦克风是否在其他应用中正常工作

### 应用无法启动
1. 检查是否安装了Microsoft Visual C++ Redistributable
2. 查看Windows事件查看器中的应用程序日志
3. 尝试以管理员身份运行

### Python相关问题
- 应用内置Python环境，无需系统安装Python
- Python运行时位于应用安装目录下
- 如遇到Python模块错误，尝试重新安装应用

## 开发调试

### 启用开发者工具
在开发模式下，开发者工具会自动打开。在生产版本中，可通过快捷键 `Ctrl+Shift+I` 打开。

### 日志位置
- 开发模式: 控制台输出
- 生产版本: `%APPDATA%\OtakuClaw\logs\`

### 配置文件位置
- 用户数据: `%APPDATA%\OtakuClaw\`
- 配置文件: `%APPDATA%\OtakuClaw\settings.json`

## 代码签名

Windows支持通过证书签名来提升用户信任度：
- 配置环境变量 `WINDOWS_CERT_SHA1`
- 使用 SHA-256 算法进行签名
- 签名在构建时自动进行

## 相关文件
- `desktop/electron/main.js` - 主进程入口
- `desktop/electron/electron-builder.yml` - 构建配置
- `package.json` - 应用元数据
- `.github/workflows/release-windows.yml` - CI/CD配置
