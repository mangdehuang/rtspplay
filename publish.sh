#!/bin/bash

set -e

echo "🚀 开始发布 rtspplay 系列包到 npm..."
echo ""

# 检查是否已登录 npm
if ! npm whoami &> /dev/null; then
    echo "❌ 未登录 npm，请先运行: npm login"
    exit 1
fi

echo "✓ npm 已登录: $(npm whoami)"
echo ""

# 发布 rtspplay (HLS 播放器)
echo "📦 发布 rtspplay..."
cd packages/rtspplay
npm publish
echo "✓ rtspplay 发布成功"
cd ../..
echo ""

# 发布 rtspplay-live (实时播放器)
echo "📦 发布 rtspplay-live..."
cd packages/rtspplay-live
npm publish
echo "✓ rtspplay-live 发布成功"
cd ../..
echo ""

# 发布 rtspplay-server (转流服务)
echo "📦 发布 rtspplay-server..."
cd packages/rtspplay-server
npm publish
echo "✓ rtspplay-server 发布成功"
cd ../..
echo ""

echo "🎉 所有包发布完成！"
echo ""
echo "验证发布:"
echo "  npm view rtspplay"
echo "  npm view rtspplay-live"
echo "  npm view rtspplay-server"
