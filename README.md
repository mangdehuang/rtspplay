# rtspplay

RTSP 视频流播放器系列包，提供多种播放方案满足不同延迟和画质需求。

## 📦 包列表

### [rtspplay](./packages/rtspplay)
基于 HLS.js 的播放器，延迟 4-8 秒，画质高清，兼容性最好。

- ✅ 高清画质（H.264）
- ✅ 最佳兼容性（包括 iOS Safari）
- ⏱️ 延迟：4-8 秒
- 📦 需要服务端转 HLS

### [rtspplay-live](./packages/rtspplay-live)
实时播放器，支持 JSMpeg 和 MSE 两种模式，延迟 1-3 秒。

- 🚀 超低延迟（1-3 秒）
- 🎭 双模式：JSMpeg（兼容性）/ MSE（画质）
- 📦 纯前端解码
- 🔌 需要 rtspplay-server

### [rtspplay-server](./packages/rtspplay-server)
极简转流服务，为 rtspplay-live 提供后端支持。

- ⚡ 极轻量（核心代码 <200 行）
- 🎭 支持 JSMpeg 和 MSE 输出
- 🔌 WebSocket 实时推流
- 📦 一行命令启动

## 🎯 选择指南

| 场景 | 推荐方案 | 延迟 | 画质 | 复杂度 |
|-----|---------|------|------|--------|
| 监控回放 | rtspplay (HLS) | 4-8s | ⭐⭐⭐⭐⭐ | ⭐ |
| 实时监控（桌面） | rtspplay-live (MSE) | 1-3s | ⭐⭐⭐⭐ | ⭐⭐ |
| 实时监控（移动） | rtspplay-live (JSMpeg) | 1-2s | ⭐⭐⭐ | ⭐⭐ |
| 多路监控墙 | rtspplay-live (JSMpeg) | 1-2s | ⭐⭐⭐ | ⭐⭐ |

## 🚀 快速开始

### 方案 1：HLS 播放（高画质，高延迟）

```bash
# 安装
npm install rtspplay hls.js

# 使用
import RtspPlayer from 'rtspplay'

new RtspPlayer({
  playlistUrl: 'http://your-server.com/stream.m3u8',
  videoElement: '#video'
})
```

### 方案 2：实时播放（低延迟）

```bash
# 1. 启动转流服务
npx rtspplay-server

# 2. 安装并使用播放器
npm install rtspplay-live
```

```typescript
import { createPlayer } from 'rtspplay-live'

createPlayer({
  serverUrl: 'ws://localhost:8080',
  rtspUrl: 'rtsp://192.168.1.100:554/stream',
  mode: 'jsmpeg',  // 或 'mse'
  element: document.getElementById('canvas')
})
```

## 📖 文档

- [rtspplay 文档](./packages/rtspplay/README.md) - HLS 播放器
- [rtspplay-live 文档](./packages/rtspplay-live/README.md) - 实时播放器
- [rtspplay-server 文档](./packages/rtspplay-server/README.md) - 转流服务

## 🛠️ 开发

```bash
# 克隆仓库
git clone https://github.com/mangdehuang/rtspplay.git
cd rtspplay

# 安装依赖
npm install

# 构建所有包
npm run build:all
```

## 🏗️ 项目结构

```
rtspplay/
├── packages/
│   ├── rtspplay/           # HLS 播放器
│   ├── rtspplay-live/      # 实时播放器
│   └── rtspplay-server/    # 转流服务
├── package.json
└── README.md
```

## 📊 性能对比

| 方案 | 延迟 | 带宽占用 | CPU 占用 | 兼容性 | 并发能力 |
|-----|------|---------|---------|--------|---------|
| **HLS** | 4-8s | 低 | 低 | ⭐⭐⭐⭐⭐ | 很强 |
| **JSMpeg** | 1-2s | 低 | 中 | ⭐⭐⭐⭐⭐ | 强 |
| **MSE** | 1-3s | 中 | 低 | ⭐⭐⭐⭐ | 强 |

## 🌐 浏览器兼容性

|  | rtspplay (HLS) | rtspplay-live (JSMpeg) | rtspplay-live (MSE) |
|---|---|---|---|
| Chrome 60+ | ✅ | ✅ | ✅ |
| Firefox 55+ | ✅ | ✅ | ✅ |
| Safari 11+ | ✅ | ✅ | ❌ |
| Edge 79+ | ✅ | ✅ | ✅ |
| iOS Safari | ✅ | ✅ | ❌ |
| Android Chrome | ✅ | ✅ | ✅ |

## 📝 许可证

MIT License - 详见 [LICENSE](./packages/rtspplay/LICENSE)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 💬 支持

- 📧 提交 [Issue](https://github.com/mangdehuang/rtspplay/issues)
- 📖 查看 [文档](./packages/)
- ⭐ 觉得有用请点个 Star！

## 🔗 相关资源

- [HLS.js](https://github.com/video-dev/hls.js)
- [JSMpeg](https://github.com/phoboslab/jsmpeg)
- [FFmpeg](https://ffmpeg.org/)
