# rtspplay-live

实时 RTSP 视频流播放器，支持 JSMpeg 和 MSE 两种模式，延迟 1-3 秒。

## 特性

- 🚀 **超低延迟** - 1-3 秒延迟，适合实时监控
- 🎭 **双模式支持** - JSMpeg（兼容性好）和 MSE（画质好）
- 📦 **纯前端实现** - 浏览器端解码和渲染
- 🔌 **轻量服务** - 配合 rtspplay-server 使用，服务器仅转封装
- 🌐 **广泛兼容** - 支持主流浏览器

## 安装

```bash
npm install rtspplay-live
```

## 使用方式

### 1. 启动转流服务

首先需要启动 rtspplay-server：

```bash
npx rtspplay-server
# 或指定端口
npx rtspplay-server --port 3000
```

### 2. 浏览器端播放

#### JSMpeg 模式（推荐）

```typescript
import { createPlayer } from 'rtspplay-live'

const player = createPlayer({
  serverUrl: 'ws://localhost:8080',
  rtspUrl: 'rtsp://192.168.1.100:554/stream',
  mode: 'jsmpeg',
  element: document.getElementById('canvas') as HTMLCanvasElement,
  
  onReady: () => console.log('播放器就绪'),
  onError: (error) => console.error('播放错误:', error)
})

// 销毁播放器
player.destroy()
```

#### MSE 模式（画质更好）

```typescript
import { createPlayer } from 'rtspplay-live'

const player = createPlayer({
  serverUrl: 'ws://localhost:8080',
  rtspUrl: 'rtsp://192.168.1.100:554/stream',
  mode: 'mse',
  element: document.getElementById('video') as HTMLVideoElement
})
```

## API 文档

### createPlayer(options)

创建播放器实例。

#### 参数

```typescript
interface PlayerOptions {
  serverUrl: string      // WebSocket 服务器地址
  rtspUrl: string        // RTSP 流地址
  mode: 'jsmpeg' | 'mse' // 播放模式
  element: HTMLCanvasElement | HTMLVideoElement  // 渲染元素
  autoPlay?: boolean     // 是否自动播放（默认 true）
  onReady?: () => void
  onError?: (error: Error) => void
}
```

#### 返回值

返回播放器实例，包含以下方法：

- `destroy(): void` - 销毁播放器，释放资源

## 模式对比

| 特性 | JSMpeg | MSE |
|-----|--------|-----|
| **延迟** | 1-2 秒 | 1-3 秒 |
| **画质** | 中等（MPEG1） | 高清（H.264） |
| **兼容性** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **CPU 占用** | 中等 | 低 |
| **适用分辨率** | ≤720p | ≤1080p |
| **iOS Safari** | ✅ | ❌ |

### 选择建议

- **JSMpeg** - 兼容性优先、移动端、低分辨率监控
- **MSE** - 画质优先、桌面端、高分辨率监控

## 完整示例

### HTML 结构

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>RTSP Live Player</title>
</head>
<body>
  <!-- JSMpeg 模式 -->
  <canvas id="canvas" width="640" height="480"></canvas>
  
  <!-- MSE 模式 -->
  <video id="video" controls autoplay muted></video>
  
  <script src="your-bundle.js"></script>
</body>
</html>
```

### TypeScript 完整示例

```typescript
import { createPlayer } from 'rtspplay-live'

class VideoMonitor {
  private player: ReturnType<typeof createPlayer> | null = null
  
  async start() {
    try {
      this.player = createPlayer({
        serverUrl: 'ws://localhost:8080',
        rtspUrl: 'rtsp://admin:pass123@192.168.1.100:554/stream',
        mode: 'jsmpeg',
        element: document.getElementById('canvas') as HTMLCanvasElement,
        
        onReady: () => {
          console.log('监控已连接')
          this.updateStatus('在线', 'green')
        },
        
        onError: (error) => {
          console.error('监控错误:', error.message)
          this.updateStatus('离线', 'red')
          this.reconnect()
        }
      })
    } catch (error) {
      console.error('启动失败:', error)
    }
  }
  
  stop() {
    if (this.player) {
      this.player.destroy()
      this.player = null
    }
  }
  
  private reconnect() {
    setTimeout(() => {
      console.log('尝试重连...')
      this.start()
    }, 5000)
  }
  
  private updateStatus(text: string, color: string) {
    const statusEl = document.getElementById('status')
    if (statusEl) {
      statusEl.textContent = text
      statusEl.style.color = color
    }
  }
}

const monitor = new VideoMonitor()
monitor.start()
```

## 浏览器兼容性

| 浏览器 | JSMpeg | MSE |
|--------|--------|-----|
| Chrome 60+ | ✅ | ✅ |
| Firefox 55+ | ✅ | ✅ |
| Safari 11+ | ✅ | ❌ |
| Edge 79+ | ✅ | ✅ |
| iOS Safari | ✅ | ❌ |
| Android Chrome | ✅ | ✅ |

## 性能优化

### JSMpeg 模式

```typescript
// 降低分辨率减少 CPU 占用
// 在服务端配置（rtspplay-server 自动处理为 640x480）
```

### MSE 模式

```typescript
// 使用硬件加速
// 浏览器自动使用硬件解码器
```

## 常见问题

### Q: 延迟还能更低吗？

A: 可以，但需要权衡：
- 减小服务端缓冲（修改 rtspplay-server）
- 牺牲稳定性换取低延迟
- 考虑使用 WebRTC 方案（rtspplay-webrtc 包）

### Q: 为什么 iOS Safari 不支持 MSE？

A: Safari 不支持 Media Source Extensions，请使用 JSMpeg 模式。

### Q: 能同时播放多路视频吗？

A: 可以，创建多个播放器实例即可：

```typescript
const cameras = [
  'rtsp://192.168.1.100/stream',
  'rtsp://192.168.1.101/stream',
  'rtsp://192.168.1.102/stream'
]

cameras.forEach((rtspUrl, index) => {
  createPlayer({
    serverUrl: 'ws://localhost:8080',
    rtspUrl,
    mode: 'jsmpeg',
    element: document.getElementById(`canvas-${index}`)
  })
})
```

### Q: 如何处理网络中断？

A: 监听 `onError` 回调并实现重连逻辑（见完整示例）。

## 相关项目

- [rtspplay](../rtspplay) - HLS 播放器（延迟 4-8 秒）
- [rtspplay-server](../rtspplay-server) - 转流服务
- [JSMpeg](https://github.com/phoboslab/jsmpeg) - 底层 MPEG1 解码器

## 许可证

MIT

## 贡献

欢迎提交 Issue 和 Pull Request！
