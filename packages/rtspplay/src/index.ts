import Hls, { ErrorTypes, Events } from 'hls.js'

export interface RtspPlayerOptions {
  /**
   * HLS 播放列表 URL（RTSP 流转换后的 HLS 地址）
   */
  playlistUrl: string

  /**
   * 视频元素或选择器
   */
  videoElement: HTMLVideoElement | string

  /**
   * 是否自动播放（默认 true）
   */
  autoPlay?: boolean

  /**
   * 是否静音（默认 true）
   */
  muted?: boolean

  /**
   * 最大缓冲长度（秒，默认 8）
   */
  maxBufferLength?: number

  /**
   * 低延迟模式（默认 true）
   */
  lowLatencyMode?: boolean

  /**
   * 网络错误重试次数（默认 2）
   */
  networkRetryCount?: number

  /**
   * 媒体错误重试次数（默认 2）
   */
  mediaRetryCount?: number

  /**
   * 事件回调
   */
  onReady?: () => void
  onPlaying?: () => void
  onPaused?: () => void
  onError?: (error: RtspPlayerError) => void
  onRecovering?: (message: string) => void
}

export interface RtspPlayerError {
  type: 'network' | 'media' | 'unsupported' | 'unknown'
  message: string
  fatal: boolean
  details?: string
}

export class RtspPlayer {
  private videoElement: HTMLVideoElement
  private hls: Hls | null = null
  private options: Required<Omit<RtspPlayerOptions, 'onReady' | 'onPlaying' | 'onPaused' | 'onError' | 'onRecovering'>> & Pick<RtspPlayerOptions, 'onReady' | 'onPlaying' | 'onPaused' | 'onError' | 'onRecovering'>
  private networkRecoveryAttempts = 0
  private mediaRecoveryAttempts = 0
  private disposed = false

  constructor(options: RtspPlayerOptions) {
    // 获取视频元素
    this.videoElement = typeof options.videoElement === 'string'
      ? document.querySelector(options.videoElement) as HTMLVideoElement
      : options.videoElement

    if (!this.videoElement) {
      throw new Error('视频元素未找到')
    }

    // 合并默认配置
    this.options = {
      playlistUrl: options.playlistUrl,
      videoElement: options.videoElement,
      autoPlay: options.autoPlay ?? true,
      muted: options.muted ?? true,
      maxBufferLength: options.maxBufferLength ?? 8,
      lowLatencyMode: options.lowLatencyMode ?? true,
      networkRetryCount: options.networkRetryCount ?? 2,
      mediaRetryCount: options.mediaRetryCount ?? 2,
      onReady: options.onReady,
      onPlaying: options.onPlaying,
      onPaused: options.onPaused,
      onError: options.onError,
      onRecovering: options.onRecovering
    }

    this.initialize()
  }

  private initialize(): void {
    this.videoElement.muted = this.options.muted

    // 绑定视频事件
    this.videoElement.addEventListener('play', this.handlePlay)
    this.videoElement.addEventListener('pause', this.handlePause)

    // 检查 HLS 支持
    if (!Hls.isSupported()) {
      // 尝试原生 HLS 支持（Safari）
      if (this.videoElement.canPlayType('application/vnd.apple.mpegurl')) {
        this.initNativeHls()
      } else {
        this.handleError({
          type: 'unsupported',
          message: '当前浏览器不支持 HLS 播放',
          fatal: true
        })
      }
      return
    }

    this.initHlsJs()
  }

  private initHlsJs(): void {
    this.hls = new Hls({
      backBufferLength: 0,
      liveSyncDurationCount: 2,
      lowLatencyMode: this.options.lowLatencyMode,
      maxBufferLength: this.options.maxBufferLength
    })

    this.hls.on(Events.MEDIA_ATTACHED, () => {
      this.hls!.loadSource(this.options.playlistUrl)
    })

    this.hls.on(Events.MANIFEST_PARSED, () => {
      this.options.onReady?.()
      if (this.options.autoPlay) {
        this.play().catch((error) => {
          console.warn('[RtspPlayer] 自动播放失败:', error)
        })
      }
    })

    this.hls.on(Events.ERROR, (_event, data) => {
      if (!data.fatal || this.disposed) {
        return
      }

      console.error(`[RtspPlayer] HLS 致命错误：${data.type} / ${data.details}`)

      if (data.type === ErrorTypes.NETWORK_ERROR) {
        if (this.networkRecoveryAttempts < this.options.networkRetryCount) {
          this.networkRecoveryAttempts++
          const message = '视频流连接中断，正在自动重连'
          this.options.onRecovering?.(message)
          this.hls!.startLoad()
          return
        }

        this.handleError({
          type: 'network',
          message: '视频流连接失败，请重试',
          fatal: true,
          details: data.details
        })
      } else if (data.type === ErrorTypes.MEDIA_ERROR) {
        if (this.mediaRecoveryAttempts < this.options.mediaRetryCount) {
          this.mediaRecoveryAttempts++
          const message = '视频解码异常，正在自动恢复'
          this.options.onRecovering?.(message)
          this.hls!.recoverMediaError()
          return
        }

        this.handleError({
          type: 'media',
          message: '视频流解码失败',
          fatal: true,
          details: data.details
        })
      } else {
        this.handleError({
          type: 'unknown',
          message: 'HLS 播放器错误',
          fatal: true,
          details: data.details
        })
      }
    })

    this.hls.attachMedia(this.videoElement)
  }

  private initNativeHls(): void {
    const handleNativeError = () => {
      this.handleError({
        type: 'media',
        message: '原生 HLS 加载失败，请重试',
        fatal: true
      })
    }

    const handleLoadedMetadata = () => {
      this.options.onReady?.()
      if (this.options.autoPlay) {
        this.play().catch((error) => {
          console.warn('[RtspPlayer] 自动播放失败:', error)
        })
      }
    }

    this.videoElement.src = this.options.playlistUrl
    this.videoElement.addEventListener('error', handleNativeError)
    this.videoElement.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true })
  }

  private handlePlay = (): void => {
    this.options.onPlaying?.()
  }

  private handlePause = (): void => {
    this.options.onPaused?.()
  }

  private handleError(error: RtspPlayerError): void {
    this.options.onError?.(error)
  }

  /**
   * 播放视频
   */
  async play(): Promise<void> {
    await this.videoElement.play()
  }

  /**
   * 暂停视频
   */
  pause(): void {
    this.videoElement.pause()
  }

  /**
   * 切换播放/暂停
   */
  togglePlayback(): void {
    if (this.videoElement.paused) {
      this.play().catch((error) => {
        console.warn('[RtspPlayer] 播放失败:', error)
      })
    } else {
      this.pause()
    }
  }

  /**
   * 设置音量（0-1）
   */
  setVolume(volume: number): void {
    this.videoElement.volume = Math.max(0, Math.min(1, volume))
  }

  /**
   * 获取音量
   */
  getVolume(): number {
    return this.videoElement.volume
  }

  /**
   * 设置静音
   */
  setMuted(muted: boolean): void {
    this.videoElement.muted = muted
  }

  /**
   * 获取静音状态
   */
  isMuted(): boolean {
    return this.videoElement.muted
  }

  /**
   * 切换静音
   */
  toggleMuted(): void {
    this.videoElement.muted = !this.videoElement.muted
  }

  /**
   * 进入全屏
   */
  async enterFullscreen(): Promise<void> {
    if (this.videoElement.requestFullscreen) {
      await this.videoElement.requestFullscreen()
    } else if ((this.videoElement as any).webkitRequestFullscreen) {
      await (this.videoElement as any).webkitRequestFullscreen()
    } else if ((this.videoElement as any).webkitEnterFullscreen) {
      // iOS Safari
      (this.videoElement as any).webkitEnterFullscreen()
    }
  }

  /**
   * 退出全屏
   */
  async exitFullscreen(): Promise<void> {
    if (document.exitFullscreen) {
      await document.exitFullscreen()
    } else if ((document as any).webkitExitFullscreen) {
      await (document as any).webkitExitFullscreen()
    }
  }

  /**
   * 切换全屏
   */
  async toggleFullscreen(): Promise<void> {
    if (document.fullscreenElement || (document as any).webkitFullscreenElement) {
      await this.exitFullscreen()
    } else {
      await this.enterFullscreen()
    }
  }

  /**
   * 是否全屏
   */
  isFullscreen(): boolean {
    return !!(document.fullscreenElement || (document as any).webkitFullscreenElement)
  }

  /**
   * 是否正在播放
   */
  isPlaying(): boolean {
    return !this.videoElement.paused
  }

  /**
   * 获取视频元素
   */
  getVideoElement(): HTMLVideoElement {
    return this.videoElement
  }

  /**
   * 销毁播放器
   */
  destroy(): void {
    this.disposed = true

    // 移除事件监听
    this.videoElement.removeEventListener('play', this.handlePlay)
    this.videoElement.removeEventListener('pause', this.handlePause)

    // 销毁 HLS 实例
    if (this.hls) {
      this.hls.destroy()
      this.hls = null
    }

    // 清空视频源
    this.videoElement.removeAttribute('src')
    this.videoElement.load()
  }
}

// 导出类型和类
export default RtspPlayer
