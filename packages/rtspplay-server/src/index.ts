import { spawn, ChildProcess } from 'child_process'
import { WebSocket, WebSocketServer } from 'ws'
import { IncomingMessage } from 'http'
import { URL } from 'url'

export type StreamMode = 'jsmpeg' | 'mse'

export interface ServerOptions {
  /**
   * WebSocket 服务端口
   */
  port: number

  /**
   * 服务器主机地址（默认 0.0.0.0）
   */
  host?: string

  /**
   * 日志输出（默认 true）
   */
  verbose?: boolean
}

export class RtspStreamServer {
  private wss: WebSocketServer
  private options: Required<ServerOptions>
  private activeStreams: Map<WebSocket, ChildProcess> = new Map()

  constructor(options: ServerOptions) {
    this.options = {
      port: options.port,
      host: options.host ?? '0.0.0.0',
      verbose: options.verbose ?? true
    }

    this.wss = new WebSocketServer({
      host: this.options.host,
      port: this.options.port
    })

    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req)
    })

    this.log(`RTSP 转流服务已启动: ws://${this.options.host}:${this.options.port}`)
  }

  private handleConnection(ws: WebSocket, req: IncomingMessage): void {
    const url = new URL(req.url || '', `ws://${req.headers.host}`)
    const rtspUrl = url.searchParams.get('url')
    const mode = (url.searchParams.get('mode') as StreamMode) || 'jsmpeg'

    if (!rtspUrl) {
      this.log('错误: 缺少 RTSP URL 参数')
      ws.close(1008, '缺少 url 参数')
      return
    }

    this.log(`新连接: ${rtspUrl} (模式: ${mode})`)

    try {
      const ffmpeg = this.startFfmpeg(rtspUrl, mode, ws)
      this.activeStreams.set(ws, ffmpeg)

      ws.on('close', () => {
        this.log(`连接关闭: ${rtspUrl}`)
        ffmpeg.kill('SIGTERM')
        this.activeStreams.delete(ws)
      })

      ws.on('error', (error) => {
        this.log(`WebSocket 错误: ${error.message}`)
      })
    } catch (error) {
      this.log(`启动 FFmpeg 失败: ${(error as Error).message}`)
      ws.close(1011, 'FFmpeg 启动失败')
    }
  }

  private startFfmpeg(
    rtspUrl: string,
    mode: StreamMode,
    ws: WebSocket
  ): ChildProcess {
    const args = this.getFfmpegArgs(rtspUrl, mode)

    this.log(`启动 FFmpeg: ffmpeg ${args.join(' ')}`)

    const ffmpeg = spawn('ffmpeg', args)

    // 将视频流推送到 WebSocket
    ffmpeg.stdout.on('data', (data: Buffer) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data, (error) => {
          if (error) {
            this.log(`发送数据失败: ${error.message}`)
          }
        })
      }
    })

    // 记录 FFmpeg 错误
    ffmpeg.stderr.on('data', (data: Buffer) => {
      const message = data.toString()
      // 只记录关键错误，过滤冗长的进度信息
      if (message.includes('error') || message.includes('failed')) {
        this.log(`FFmpeg 错误: ${message.trim()}`)
      }
    })

    ffmpeg.on('error', (error) => {
      this.log(`FFmpeg 进程错误: ${error.message}`)
      ws.close(1011, 'FFmpeg 进程错误')
    })

    ffmpeg.on('close', (code) => {
      this.log(`FFmpeg 进程退出，代码: ${code}`)
      if (ws.readyState === WebSocket.OPEN) {
        ws.close(1000, 'FFmpeg 进程结束')
      }
    })

    return ffmpeg
  }

  private getFfmpegArgs(rtspUrl: string, mode: StreamMode): string[] {
    const baseArgs = [
      '-rtsp_transport', 'tcp',
      '-i', rtspUrl
    ]

    if (mode === 'jsmpeg') {
      // JSMpeg 模式：转换为 MPEG1
      return [
        ...baseArgs,
        '-f', 'mpegts',
        '-codec:v', 'mpeg1video',
        '-s', '640x480',
        '-b:v', '1000k',
        '-bf', '0',
        '-muxdelay', '0.001',
        '-'
      ]
    } else {
      // MSE 模式：转换为 fMP4
      return [
        ...baseArgs,
        '-c:v', 'copy',
        '-an',
        '-f', 'mp4',
        '-movflags', 'frag_keyframe+empty_moov+default_base_moof',
        '-reset_timestamps', '1',
        '-'
      ]
    }
  }

  private log(message: string): void {
    if (this.options.verbose) {
      const timestamp = new Date().toISOString()
      console.log(`[${timestamp}] ${message}`)
    }
  }

  /**
   * 关闭服务器
   */
  close(): Promise<void> {
    return new Promise((resolve) => {
      // 关闭所有活动的 FFmpeg 进程
      for (const ffmpeg of this.activeStreams.values()) {
        ffmpeg.kill('SIGTERM')
      }
      this.activeStreams.clear()

      // 关闭 WebSocket 服务器
      this.wss.close(() => {
        this.log('RTSP 转流服务已关闭')
        resolve()
      })
    })
  }

  /**
   * 获取活动连接数
   */
  getActiveConnections(): number {
    return this.activeStreams.size
  }
}
