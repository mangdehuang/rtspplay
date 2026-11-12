# rtspplay

基于 HLS.js 的 RTSP 视频流播放器，支持实时视频流播放、全屏控制和音频控制。

## 特性

- 🎥 支持 RTSP 转 HLS 视频流播放
- 🔄 自动错误恢复（网络中断、解码异常）
- 📱 支持全屏播放（包括移动端）
- 🔊 音量和静音控制
- 📦 轻量级，无额外依赖
- 🎯 TypeScript 支持
- 🌐 兼容主流浏览器和 Safari 原生 HLS

## 安装

```bash
npm install rtspplay hls.js
```

或使用 yarn：

```bash
yarn add rtspplay hls.js
```

## 快速开始

### 基础用法

```typescript
import RtspPlayer from 'rtspplay'

// 创建播放器实例
const player = new RtspPlayer({
  playlistUrl: 'https://your-server.com/stream.m3u8',
  videoElement: '#video',
  autoPlay: true,
  muted: true
})

// 播放控制
player.play()
player.pause()
player.togglePlayback()

// 音量控制
player.setVolume(0.5)
player.toggleMuted()

// 全屏控制
player.enterFullscreen()
player.exitFullscreen()
player.toggleFullscreen()

// 销毁播放器
player.destroy()
```

### HTML 结构

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>RTSP Player Demo</title>
  <style>
    #video {
      width: 100%;
      max-width: 800px;
      aspect-ratio: 16/9;
      background: #000;
    }
  </style>
</head>
<body>
  <video id="video" controls></video>
  <script src="your-bundle.js"></script>
</body>
</html>
```

## API 文档

### 构造函数选项

```typescript
interface RtspPlayerOptions {
  // 必需参数
  playlistUrl: string                    // HLS 播放列表 URL
  videoElement: HTMLVideoElement | string // 视频元素或选择器

  // 可选参数
  autoPlay?: boolean                     // 是否自动播放（默认 true）
  muted?: boolean                        // 是否静音（默认 true）
  maxBufferLength?: number               // 最大缓冲长度（秒，默认 8）
  lowLatencyMode?: boolean               // 低延迟模式（默认 true）
  networkRetryCount?: number             // 网络错误重试次数（默认 2）
  mediaRetryCount?: number               // 媒体错误重试次数（默认 2）

  // 事件回调
  onReady?: () => void                   // 播放器准备就绪
  onPlaying?: () => void                 // 开始播放
  onPaused?: () => void                  // 暂停播放
  onError?: (error: RtspPlayerError) => void      // 发生错误
  onRecovering?: (message: string) => void        // 正在恢复
}
```

### 错误类型

```typescript
interface RtspPlayerError {
  type: 'network' | 'media' | 'unsupported' | 'unknown'
  message: string
  fatal: boolean
  details?: string
}
```

### 实例方法

#### 播放控制

- `play(): Promise<void>` - 播放视频
- `pause(): void` - 暂停视频
- `togglePlayback(): void` - 切换播放/暂停
- `isPlaying(): boolean` - 是否正在播放

#### 音量控制

- `setVolume(volume: number): void` - 设置音量（0-1）
- `getVolume(): number` - 获取音量
- `setMuted(muted: boolean): void` - 设置静音
- `isMuted(): boolean` - 获取静音状态
- `toggleMuted(): void` - 切换静音

#### 全屏控制

- `enterFullscreen(): Promise<void>` - 进入全屏
- `exitFullscreen(): Promise<void>` - 退出全屏
- `toggleFullscreen(): Promise<void>` - 切换全屏
- `isFullscreen(): boolean` - 是否全屏

#### 其他方法

- `getVideoElement(): HTMLVideoElement` - 获取视频元素
- `destroy(): void` - 销毁播放器

## 使用示例

### 1. 带事件监听的完整示例

```typescript
import RtspPlayer from 'rtspplay'

const player = new RtspPlayer({
  playlistUrl: 'https://your-server.com/stream.m3u8',
  videoElement: '#video',
  autoPlay: false,
  muted: false,
  
  onReady: () => {
    console.log('播放器准备就绪')
  },
  
  onPlaying: () => {
    console.log('开始播放')
  },
  
  onPaused: () => {
    console.log('播放已暂停')
  },
  
  onError: (error) => {
    console.error('播放错误:', error.message)
    if (error.fatal) {
      console.error('致命错误，无法继续播放')
    }
  },
  
  onRecovering: (message) => {
    console.log('正在恢复:', message)
  }
})

// 手动播放
document.getElementById('playBtn').addEventListener('click', () => {
  player.play()
})
```

### 2. 自定义控制栏

```typescript
import RtspPlayer from 'rtspplay'

const player = new RtspPlayer({
  playlistUrl: 'https://your-server.com/stream.m3u8',
  videoElement: '#video'
})

// 播放/暂停按钮
document.getElementById('playPauseBtn').addEventListener('click', () => {
  player.togglePlayback()
})

// 静音按钮
document.getElementById('muteBtn').addEventListener('click', () => {
  player.toggleMuted()
})

// 音量滑块
document.getElementById('volumeSlider').addEventListener('input', (e) => {
  const volume = parseFloat(e.target.value)
  player.setVolume(volume)
})

// 全屏按钮
document.getElementById('fullscreenBtn').addEventListener('click', () => {
  player.toggleFullscreen()
})
```

### 3. React 集成

```tsx
import React, { useEffect, useRef, useState } from 'react'
import RtspPlayer from 'rtspplay'

interface VideoPlayerProps {
  streamUrl: string
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ streamUrl }) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const playerRef = useRef<RtspPlayer | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (!videoRef.current) return

    playerRef.current = new RtspPlayer({
      playlistUrl: streamUrl,
      videoElement: videoRef.current,
      autoPlay: true,
      
      onPlaying: () => setIsPlaying(true),
      onPaused: () => setIsPlaying(false),
      onError: (err) => setError(err.message)
    })

    return () => {
      playerRef.current?.destroy()
    }
  }, [streamUrl])

  const togglePlay = () => {
    playerRef.current?.togglePlayback()
  }

  return (
    <div>
      <video ref={videoRef} style={{ width: '100%' }} />
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <button onClick={togglePlay}>
        {isPlaying ? '暂停' : '播放'}
      </button>
    </div>
  )
}
```

### 4. Vue 集成

```vue
<template>
  <div class="video-player">
    <video ref="videoElement" />
    <div v-if="error" class="error">{{ error }}</div>
    <div class="controls">
      <button @click="togglePlay">{{ isPlaying ? '暂停' : '播放' }}</button>
      <button @click="toggleMute">{{ isMuted ? '取消静音' : '静音' }}</button>
      <button @click="toggleFullscreen">全屏</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import RtspPlayer from 'rtspplay'

const props = defineProps<{
  streamUrl: string
}>()

const videoElement = ref<HTMLVideoElement>()
const isPlaying = ref(false)
const isMuted = ref(true)
const error = ref('')

let player: RtspPlayer | null = null

onMounted(() => {
  if (!videoElement.value) return

  player = new RtspPlayer({
    playlistUrl: props.streamUrl,
    videoElement: videoElement.value,
    autoPlay: true,
    
    onPlaying: () => { isPlaying.value = true },
    onPaused: () => { isPlaying.value = false },
    onError: (err) => { error.value = err.message }
  })
})

onUnmounted(() => {
  player?.destroy()
})

const togglePlay = () => player?.togglePlayback()
const toggleMute = () => {
  player?.toggleMuted()
  isMuted.value = player?.isMuted() ?? true
}
const toggleFullscreen = () => player?.toggleFullscreen()
</script>

<style scoped>
.video-player {
  max-width: 800px;
}
video {
  width: 100%;
  background: #000;
}
.error {
  color: red;
  padding: 10px;
}
.controls {
  display: flex;
  gap: 10px;
  padding: 10px 0;
}
</style>
```

## RTSP 转 HLS 服务端配置

本播放器需要 RTSP 流先转换为 HLS 格式。推荐使用 FFmpeg：

```bash
ffmpeg -rtsp_transport tcp \
  -i rtsp://username:password@192.168.1.100:554/stream \
  -c:v copy -c:a aac \
  -f hls -hls_time 2 -hls_list_size 3 \
  -hls_flags delete_segments \
  /path/to/output/stream.m3u8
```

或使用 Node.js + FFmpeg 实现动态转流服务。

## 浏览器兼容性

- Chrome/Edge 85+
- Firefox 78+
- Safari 14+（原生 HLS）
- 移动端 Safari（iOS）
- 移动端 Chrome（Android）

## 常见问题

### Q: 为什么自动播放失败？

A: 现代浏览器限制自动播放，需要设置 `muted: true` 或用户交互后播放。

### Q: 如何降低延迟？

A: 设置 `lowLatencyMode: true` 和 `maxBufferLength: 4`（更小的缓冲）。

### Q: 视频卡顿怎么办？

A: 检查网络带宽、调整 `maxBufferLength`，或优化 HLS 转码参数。

### Q: 支持 RTSP 直连吗？

A: 不支持。浏览器无法直接播放 RTSP，需要服务端转换为 HLS。

## 开发

```bash
# 克隆仓库
git clone https://github.com/yourusername/rtspplay.git
cd rtspplay

# 安装依赖
npm install

# 开发模式
npm run dev

# 构建
npm run build
```

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 相关项目

- [hls.js](https://github.com/video-dev/hls.js) - 本项目基于的 HLS 播放库
- [FFmpeg](https://ffmpeg.org/) - 推荐的 RTSP 转 HLS 工具

## 支持

如有问题或建议，请提交 [Issue](https://github.com/yourusername/rtspplay/issues)。
