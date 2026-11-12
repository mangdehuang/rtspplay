import JSMpeg from '@cycjimmy/jsmpeg-player'
import type { BasePlayer, PlayerOptions } from './types'

export class JsMpegPlayer implements BasePlayer {
  private player: any
  private options: PlayerOptions

  constructor(options: PlayerOptions) {
    this.options = options

    if (!(options.element instanceof HTMLCanvasElement)) {
      throw new Error('JSMpeg 模式需要 Canvas 元素')
    }

    const wsUrl = new URL(options.serverUrl)
    wsUrl.searchParams.set('url', options.rtspUrl)
    wsUrl.searchParams.set('mode', 'jsmpeg')

    try {
      this.player = new JSMpeg.Player(wsUrl.toString(), {
        canvas: options.element,
        autoplay: options.autoPlay ?? true,
        audio: false,
        loop: false,
        onSourceEstablished: () => {
          options.onReady?.()
        },
        onSourceCompleted: () => {
          console.log('[JSMpeg] 流结束')
        }
      })
    } catch (error) {
      options.onError?.(error as Error)
      throw error
    }
  }

  destroy(): void {
    if (this.player) {
      this.player.destroy()
    }
  }
}
