# 灵山胜境AI导游 - Android APP开发指南

## 📱 项目概述

这是一个基于现有Electron桌面应用改造的Android APP，使用科大讯飞AI虚拟人替代Live2D，提供更专业的数字人导览体验。

## 🎯 核心特性

1. **科大讯飞AI虚拟人** - 替代Live2D，提供真人级3D数字人体验
2. **语音/文本问答** - 支持游客与AI导游实时对话
3. **路线推荐** - 基于游客偏好智能推荐游览路线
4. **移动端优化** - 专为Android手机设计的流畅界面
5. **离线能力** - 支持资料缓存，无网络时也可使用基础功能

## 🚀 快速开始

### 前置要求

- Node.js 18+
- pnpm 10.28.0+
- Java JDK 17+
- Android Studio（用于Android SDK管理）
- Android SDK API Level 33+

### 1. 安装依赖

```bash
# 安装项目依赖
pnpm install

# 安装Capacitor CLI
pnpm add -D @capacitor/cli
```

### 2. 初始化Android项目

```bash
# 同步Android项目
pnpm run android:sync

# 打开Android Studio
pnpm run android:open
```

### 3. 构建前端

```bash
# 构建前端资源
pnpm run frontend:build
```

### 4. 运行APP

```bash
# 在连接的Android设备上运行
pnpm run android:dev

# 或者构建发布版本
pnpm run android:build
```

## 🔧 后端配置

### 科大讯飞虚拟人API

项目需要配置科大讯飞虚拟人API服务。请按以下步骤操作：

1. **申请科大讯飞账号**
   - 访问：https://www.xfyun.cn/
   - 注册并完成实名认证

2. **开通虚拟人服务**
   - 在控制台找到"AI虚拟人"服务
   - 获取API Key和App ID

3. **配置后端服务**
   - 修改`backend/config/iflytek.config.json`:
   ```json
   {
     "appId": "your_app_id",
     "apiKey": "your_api_key",
     "apiSecret": "your_api_secret",
     "voiceId": "xiaoyan", // 音色ID
     "avatarId": "professional_female" // 虚拟人形象ID
   }
   ```

4. **启动后端服务**
   ```bash
   cd backend
   pip install -r requirements.txt
   python main.py
   ```

### 后端API接口

后端需要提供以下API接口：

#### 1. 生成虚拟人视频
```
POST /api/avatar/generate
{
  "text": "要播放的文本",
  "voiceId": "音色ID",
  "avatarId": "虚拟人形象ID"
}

Response:
{
  "code": 0,
  "message": "success",
  "data": {
    "videoUrl": "https://...",
    "videoBase64": "base64编码的视频数据"
  }
}
```

#### 2. 获取虚拟人列表
```
GET /api/avatar/avatars

Response:
{
  "code": 0,
  "data": {
    "avatars": [
      {"id": "professional_female", "name": "专业女导游"},
      {"id": "professional_male", "name": "专业男导游"}
    ]
  }
}
```

#### 3. 获取音色列表
```
GET /api/avatar/voices

Response:
{
  "code": 0,
  "data": {
    "voices": [
      {"id": "xiaoyan", "name": "晓燕", "gender": "female"},
      {"id": "xiaoqiang", "name": "小强", "gender": "male"}
    ]
  }
}
```

## 📱 Android配置

### 环境变量配置

创建`.env.production`文件：
```
VITE_BACKEND_URL=http://your-backend-server:8000
VITE_APP_NAME=灵山胜境AI导游
```

### 权限说明

APP需要以下权限：
- `INTERNET` - 网络访问（调用后端API）
- `RECORD_AUDIO` - 录音（语音输入）
- `CAMERA` - 相机（拍照问导游）
- `READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE` - 存储访问

### 图标配置

替换以下文件中的图标：
- `android/app/src/main/res/mipmap-*/ic_launcher.png`

### 签名配置（发布版）

在`android/app/build.gradle`中配置签名：
```gradle
android {
    signingConfigs {
        release {
            storeFile file("your-keystore.jks")
            storePassword "your-store-password"
            keyAlias "your-key-alias"
            keyPassword "your-key-password"
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

## 🎨 移动端UI优化

### 响应式设计

项目使用了以下移动端优化策略：

1. **视口高度处理**：使用`dvh`（动态视口高度）避免移动浏览器地址栏遮挡
2. **触摸优化**：按钮尺寸至少48x48dp，间距至少8dp
3. **手势支持**：滑动切换、双指缩放图片
4. **软键盘适配**：输入时界面自动调整，不遮挡输入框

### 组件说明

核心移动端组件：

- `MobileScenicGuideShell` - 移动端主界面
- `IFlyAvatarPlayer` - 虚拟人视频播放器
- `VoiceInputButton` - 语音输入按钮
- `RouteCard` - 路线推荐卡片

### 样式适配

移动端样式文件：
- `MobileScenicGuideShell.css` - 移动端专用样式
- 优先使用Flexbox布局
- 使用相对单位（rem、%、vw、vh）
- 优化触摸反馈效果

## 🧪 测试

### 单元测试
```bash
pnpm run test:frontend
```

### Android测试
```bash
# 在模拟器上测试
pnpm run android:dev

# 在真机上测试
pnpm run android:build
# 安装生成的APK到设备
```

### 性能测试

关注以下指标：
- APP启动时间 < 3秒
- 虚拟人视频加载时间 < 5秒
- 语音识别响应时间 < 1秒
- 界面渲染帧率 ≥ 60fps

## 📦 打包发布

### Debug版本
```bash
pnpm run frontend:build
cap build android --debug
```

### Release版本
```bash
pnpm run frontend:build
cap build android --release
```

生成的APK文件位于：
- Debug: `android/app/build/outputs/apk/debug/app-debug.apk`
- Release: `android/app/build/outputs/apk/release/app-release.apk`

## 🔧 常见问题

### 1. 虚拟人视频无法播放
- 检查后端服务是否运行
- 检查网络权限配置
- 查看Android Studio日志获取详细错误

### 2. 语音识别失败
- 确认麦克风权限已授予
- 检查设备是否支持录音功能
- 查看权限请求是否正确触发

### 3. 界面显示不全
- 检查屏幕方向设置
- 验证CSS媒体查询是否生效
- 使用不同尺寸设备测试

### 4. 连接后端失败
- 确认设备与后端在同一网络
- 检查防火墙设置
- 验证API地址配置正确

## 📝 开发日志

### 2026-05-12
- ✅ 完成Capacitor Android项目初始化
- ✅ 创建科大讯飞虚拟人服务接口
- ✅ 实现移动端响应式UI组件
- ✅ 配置Android权限和安全设置
- 🔄 待完成：后端虚拟人API实现
- 🔄 待完成：完整端到端测试

## 🎯 比赛演示要点

### 核心演示流程
1. 启动APP，展示"灵山胜境AI导游"
2. 点击麦克风按钮进行语音提问
3. AI虚拟人视频回答，同时显示字幕
4. 切换到路线推荐，查看个性化路线
5. 拍照问导游功能展示
6. 回答来源追溯证明

### 亮点展示
- ✅ AI虚拟人口型同步
- ✅ 语音识别准确率
- ✅ 响应速度（<5秒）
- ✅ 界面流畅度和交互体验
- ✅ 官方资料数据完整性

## 📞 技术支持

如有问题，请联系：
- 项目负责人：[你的名字]
- 技术文档：`docs/`目录
- 问题反馈：GitHub Issues

---

**注意**：本项目用于第十五届中国软件杯 A5「景区导览服务AI数字人」比赛，请遵守比赛规则和材料使用许可。
