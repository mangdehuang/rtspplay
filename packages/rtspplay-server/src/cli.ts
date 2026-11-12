#!/usr/bin/env node

import { RtspStreamServer } from './index.js'

const args = process.argv.slice(2)

function printHelp() {
  console.log(`
rtspplay-server - 极简 RTSP 转流服务

用法:
  rtspplay-server [选项]

选项:
  --port <端口>      WebSocket 服务端口 (默认: 8080)
  --host <地址>      服务器地址 (默认: 0.0.0.0)
  --quiet           禁用日志输出
  -h, --help        显示帮助信息

示例:
  rtspplay-server
  rtspplay-server --port 3000
  rtspplay-server --host 127.0.0.1 --port 8080

客户端连接:
  ws://localhost:8080?url=rtsp://192.168.1.100/stream&mode=jsmpeg
  ws://localhost:8080?url=rtsp://192.168.1.100/stream&mode=mse
`)
}

function parseArgs() {
  const config = {
    port: 8080,
    host: '0.0.0.0',
    verbose: true
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    if (arg === '-h' || arg === '--help') {
      printHelp()
      process.exit(0)
    }

    if (arg === '--port' && args[i + 1]) {
      config.port = parseInt(args[i + 1], 10)
      i++
    }

    if (arg === '--host' && args[i + 1]) {
      config.host = args[i + 1]
      i++
    }

    if (arg === '--quiet') {
      config.verbose = false
    }
  }

  return config
}

async function main() {
  const config = parseArgs()

  console.log('正在启动 RTSP 转流服务...')
  console.log(`端口: ${config.port}`)
  console.log(`地址: ${config.host}`)
  console.log()

  const server = new RtspStreamServer(config)

  process.on('SIGINT', async () => {
    console.log('\n正在关闭服务器...')
    await server.close()
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    console.log('\n正在关闭服务器...')
    await server.close()
    process.exit(0)
  })
}

main().catch((error) => {
  console.error('启动失败:', error.message)
  process.exit(1)
})
