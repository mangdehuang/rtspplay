import { JsMpegPlayer } from './jsmpeg-player'
import { MsePlayer } from './mse-player'
import type { BasePlayer, PlayerOptions, PlayerMode } from './types'

export { JsMpegPlayer, MsePlayer }
export type { BasePlayer, PlayerOptions, PlayerMode }

/**
 * 创建实时 RTSP 视频播放器
 *
 * @param options 播放器选项
 * @returns 播放器实例
 *
 * @example JSMpeg 模式（兼容性好，画质一般）
 * ```typescript
 * const player = createPlayer({
 *   serverUrl: 'ws://localhost:8080',
 *   rtspUrl: 'rtsp://192.168.1.100:554/stream',
 *   mode: 'jsmpeg',
 *   element: document.getElementById('canvas') as HTMLCanvasElement
 * })
 * ```
 *
 * @example MSE 模式（画质好，延迟低）
 * ```typescript
 * const player = createPlayer({
 *   serverUrl: 'ws://localhost:8080',
 *   rtspUrl: 'rtsp://192.168.1.100:554/stream',
 *   mode: 'mse',
 *   element: document.getElementById('video') as HTMLVideoElement
 * })
 * ```
 */
export function createPlayer(options: PlayerOptions): BasePlayer {
  if (options.mode === 'jsmpeg') {
    return new JsMpegPlayer(options)
  } else if (options.mode === 'mse') {
    return new MsePlayer(options)
  } else {
    throw new Error(`不支持的播放模式: ${options.mode}`)
  }
}

export default createPlayer
