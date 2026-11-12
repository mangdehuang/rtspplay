# rtspplay-server

极简 RTSP 转流服务，支持 JSMpeg 和 MSE 两种输出格式，配合 rtspplay-live 使用。

## 特性

- 🚀 **极简架构** - 核心代码不到 200 行
- 🎭 **双模式支持** - JSMpeg（MPEG1）和 MSE（fMP4）
- 🔌 **WebSocket 传输** - 实时流式推送
- ⚡ **低资源占用** - 只做转封装，不做重编码（MSE 模式）
- 📦 **零配置启动** - 一行命令即可运行
- 🛠️ **CLI 工具** - 支持命令行和编程两种使用方式

## 安装

```bash
npm install -g rtspplay-server
```

或作为项目依赖：

```bash
npm install rtspplay-server
```

## 快速开始

### CLI 使用

```bash
# 启动服务（默认端口 8080）
rtspplay-server

# 指定端口
rtspplay-server --port 3000

# 指定地址
rtspplay-server --host 127.0.0.1 --port 8080

# 禁用日志
rtspplay-server --quiet
```

### 编程使用

```typescript
import { RtspStreamServer } from 'rtspplay-server'

const server = new RtspStreamServer({
  port: 8080,
  host: '0.0.0.0',
  verbose: true
})

// 服务器会自动处理客户端连接
// 客户端通过 WebSocket 连接并提供 RTSP URL
```

## 客户端连接

### JSMpeg 模式

```
ws://localhost:8080?url=rtsp://192.168.1.100:554/stream&mode=jsmpeg
```

服务器自动将 RTSP 流转换为 MPEG1 格式推送。

### MSE 模式

```
ws://localhost:8080?url=rtsp://192.168.1.100:554/stream&mode=mse
```

服务器将 RTSP 流转换为 fMP4 分片推送。

## 配合前端使用

### 与 rtspplay-live 配合

```typescript
import { createPlayer } from 'rtspplay-live'

// 1. 启动 rtspplay-server
// npx rtspplay-server

// 2. 浏览器端创建播放器
const player = createPlayer({
  serverUrl: 'ws://localhost:8080',
  rtspUrl: 'rtsp://admin:pass123@192.168.1.100:554/stream',
  mode: 'jsmpeg',
  element: document.getElementById('canvas')
})
```

### 直接使用 WebSocket

```typescript
const ws = new WebSocket(
  'ws://localhost:8080?url=rtsp://192.168.1.100/stream&mode=jsmpeg'
)

ws.binaryType = 'arraybuffer'

ws.onmessage = (event) => {
  // 接收视频流数据
  const videoData = event.data
  // 用 JSMpeg 或 MSE 解码播放
}
```

## API 文档

### RtspStreamServer

#### 构造函数

```typescript
new RtspStreamServer(options: ServerOptions)
```

**参数：**

```typescript
interface ServerOptions {
  port: number        // WebSocket 服务端口
  host?: string       // 服务器地址（默认 0.0.0.0）
  verbose?: boolean   // 日志输出（默认 true）
}
```

#### 方法

- `close(): Promise<void>` - 关闭服务器
- `getActiveConnections(): number` - 获取当前活动连接数

## 工作原理

### JSMpeg 模式流程

```
RTSP 摄像头 → FFmpeg 转 MPEG1 → WebSocket → 浏览器 JSMpeg 解码
```

**FFmpeg 命令：**
```bash
ffmpeg -rtsp_transport tcp \
  -i rtsp://192.168.1.100/stream \
  -f mpegts \
  -codec:v mpeg1video \
  -s 640x480 \
  -b:v 1000k \
  -bf 0 \
  -
```

### MSE 模式流程

```
RTSP 摄像头 → FFmpeg 转 fMP4 → WebSocket → 浏览器 MSE 播放
```

**FFmpeg 命令：**
```bash
ffmpeg -rtsp_transport tcp \
  -i rtsp://192.168.1.100/stream \
  -c:v copy \
  -f mp4 \
  -movflags frag_keyframe+empty_moov \
  -
```

## 性能对比

| 模式 | CPU 占用 | 带宽 | 画质 | 兼容性 |
|-----|---------|------|------|--------|
| **JSMpeg** | 中等（需转码） | 低 | 中等 | ⭐⭐⭐⭐⭐ |
| **MSE** | 低（只转封装） | 中 | 高清 | ⭐⭐⭐⭐ |

## 生产部署

### Docker 部署

```dockerfile
FROM node:20-alpine

# 安装 FFmpeg
RUN apk add --no-cache ffmpeg

# 安装应用
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .

EXPOSE 8080
CMD ["node", "dist/cli.js"]
```

```bash
# 构建
docker build -t rtspplay-server .

# 运行
docker run -d -p 8080:8080 rtspplay-server
```

### PM2 守护进程

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start rtspplay-server --name rtsp-stream -- --port 8080

# 查看日志
pm2 logs rtsp-stream

# 设置开机自启
pm2 startup
pm2 save
```

### Nginx 反向代理

```nginx
server {
    listen 80;
    server_name example.com;

    location /rtsp/ {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

## 安全建议

### 1. 认证保护

```typescript
import { RtspStreamServer } from 'rtspplay-server'
import { WebSocketServer } from 'ws'

const wss = new WebSocketServer({ 
  port: 8080,
  verifyClient: (info, callback) => {
    const token = new URL(info.req.url, 'ws://localhost').searchParams.get('token')
    
    if (token === 'your-secret-token') {
      callback(true)
    } else {
      callback(false, 401, 'Unauthorized')
    }
  }
})
```

### 2. 限制连接数

```typescript
const MAX_CONNECTIONS = 10
let activeConnections = 0

wss.on('connection', (ws) => {
  if (activeConnections >= MAX_CONNECTIONS) {
    ws.close(1008, 'Too many connections')
    return
  }
  
  activeConnections++
  
  ws.on('close', () => {
    activeConnections--
  })
})
```

### 3. HTTPS/WSS

使用 Let's Encrypt 配置 SSL：

```bash
# 安装 Certbot
apt-get install certbot

# 获取证书
certbot certonly --standalone -d example.com

# 使用证书（通过 Nginx 代理）
```

## 故障排查

### 问题 1：FFmpeg 未找到

**错误：**
```
Error: spawn ffmpeg ENOENT
```

**解决：**
```bash
# Ubuntu/Debian
apt-get install ffmpeg

# macOS
brew install ffmpeg

# Windows
# 下载 FFmpeg 并添加到 PATH
```

### 问题 2：RTSP 连接超时

**错误：**
```
FFmpeg 错误: Connection timed out
```

**解决：**
- 检查 RTSP URL 是否正确
- 确认摄像头网络可达
- 尝试使用 `rtsp_transport tcp`（已默认）

### 问题 3：视频卡顿

**原因：**
- 网络带宽不足
- 服务器 CPU 占用过高（JSMpeg 模式）

**解决：**
- 降低视频分辨率（修改 FFmpeg 参数）
- 使用 MSE 模式（减少 CPU 占用）
- 增加服务器带宽

## 常见问题

### Q: 支持多少路并发？

A: 取决于服务器性能和网络带宽。一般服务器：
- JSMpeg 模式：5-10 路 720p
- MSE 模式：10-20 路 1080p

### Q: 能否录制视频？

A: 当前版本专注于实时流。录制功能可通过修改 FFmpeg 参数实现：

```typescript
// 添加录制输出
'-c:v', 'copy',
'-f', 'segment',
'-segment_time', '60',
'/path/to/output_%03d.mp4'
```

### Q: 支持音频吗？

A: 支持，需要修改 FFmpeg 参数添加音频流。

### Q: Windows 上如何使用？

A: 确保安装了 FFmpeg 并添加到系统 PATH。

## 相关项目

- [rtspplay-live](../rtspplay-live) - 前端播放器
- [rtspplay](../rtspplay) - HLS 播放器
- [FFmpeg](https://ffmpeg.org/) - 视频处理工具

## 许可证

MIT

## 贡献

欢迎提交 Issue 和 Pull Request！
