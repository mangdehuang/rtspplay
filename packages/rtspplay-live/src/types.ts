export type PlayerMode = 'jsmpeg' | 'mse'

export interface PlayerOptions {
  /**
   * WebSocket 服务器地址
   */
  serverUrl: string

  /**
   * RTSP 流地址
   */
  rtspUrl: string

  /**
   * 播放模式
   */
  mode: PlayerMode

  /**
   * Canvas 元素（JSMpeg 模式）或 Video 元素（MSE 模式）
   */
  element: HTMLCanvasElement | HTMLVideoElement

  /**
   * 是否自动播放（默认 true）
   */
  autoPlay?: boolean

  /**
   * 回调函数
   */
  onReady?: () => void
  onError?: (error: Error) => void
}

export interface BasePlayer {
  destroy(): void
}
