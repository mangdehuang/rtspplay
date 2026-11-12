import type { BasePlayer, PlayerOptions } from './types'

export class MsePlayer implements BasePlayer {
  private videoElement: HTMLVideoElement
  private ws: WebSocket | null = null
  private mediaSource: MediaSource | null = null
  private sourceBuffer: SourceBuffer | null = null
  private queue: ArrayBuffer[] = []
  private options: PlayerOptions

  constructor(options: PlayerOptions) {
    this.options = options

    if (!(options.element instanceof HTMLVideoElement)) {
      throw new Error('MSE 模式需要 Video 元素')
    }

    this.videoElement = options.element

    if (!('MediaSource' in window)) {
      const error = new Error('浏览器不支持 Media Source Extensions')
      options.onError?.(error)
      throw error
    }

    this.init()
  }

  private init(): void {
    this.mediaSource = new MediaSource()
    this.videoElement.src = URL.createObjectURL(this.mediaSource)

    this.mediaSource.addEventListener('sourceopen', () => {
      this.onSourceOpen()
    })
  }

  private onSourceOpen(): void {
    if (!this.mediaSource) return

    try {
      // 创建 SourceBuffer（H.264 视频）
      this.sourceBuffer = this.mediaSource.addSourceBuffer(
        'video/mp4; codecs="avc1.64001f"'
      )

      this.sourceBuffer.addEventListener('updateend', () => {
        this.processQueue()
      })

      this.sourceBuffer.addEventListener('error', (e) => {
        console.error('[MSE] SourceBuffer 错误:', e)
        this.options.onError?.(new Error('SourceBuffer 错误'))
      })

      // 连接 WebSocket
      this.connectWebSocket()
    } catch (error) {
      this.options.onError?.(error as Error)
      throw error
    }
  }

  private connectWebSocket(): void {
    const wsUrl = new URL(this.options.serverUrl)
    wsUrl.searchParams.set('url', this.options.rtspUrl)
    wsUrl.searchParams.set('mode', 'mse')

    this.ws = new WebSocket(wsUrl.toString())
    this.ws.binaryType = 'arraybuffer'

    this.ws.onopen = () => {
      console.log('[MSE] WebSocket 已连接')
      this.options.onReady?.()
    }

    this.ws.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        this.queue.push(event.data)
        this.processQueue()
      }
    }

    this.ws.onerror = (error) => {
      console.error('[MSE] WebSocket 错误:', error)
      this.options.onError?.(new Error('WebSocket 连接错误'))
    }

    this.ws.onclose = () => {
      console.log('[MSE] WebSocket 已关闭')
    }
  }

  private processQueue(): void {
    if (
      !this.sourceBuffer ||
      this.sourceBuffer.updating ||
      this.queue.length === 0
    ) {
      return
    }

    try {
      const data = this.queue.shift()
      if (data) {
        this.sourceBuffer.appendBuffer(data)

        // 自动播放
        if (
          this.options.autoPlay !== false &&
          this.videoElement.paused &&
          this.videoElement.readyState >= 2
        ) {
          this.videoElement.play().catch((err) => {
            console.warn('[MSE] 自动播放失败:', err)
          })
        }
      }
    } catch (error) {
      console.error('[MSE] appendBuffer 错误:', error)
      this.options.onError?.(error as Error)
    }
  }

  destroy(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    if (this.sourceBuffer && this.mediaSource) {
      try {
        this.mediaSource.removeSourceBuffer(this.sourceBuffer)
      } catch (e) {
        // SourceBuffer 可能已被移除
      }
    }

    if (this.mediaSource) {
      if (this.mediaSource.readyState === 'open') {
        this.mediaSource.endOfStream()
      }
      this.mediaSource = null
    }

    this.sourceBuffer = null
    this.queue = []
    this.videoElement.src = ''
  }
}
