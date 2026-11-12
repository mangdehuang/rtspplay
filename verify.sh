#!/bin/bash

echo "📋 验证发布准备情况..."
echo ""

# 检查构建文件
echo "1. 检查构建文件..."
for pkg in rtspplay rtspplay-live rtspplay-server; do
    if [ -d "packages/$pkg/dist" ]; then
        echo "  ✓ packages/$pkg/dist 存在"
    else
        echo "  ✗ packages/$pkg/dist 不存在，请运行 npm run build:all"
        exit 1
    fi
done
echo ""

# 检查 package.json
echo "2. 检查 package.json..."
for pkg in rtspplay rtspplay-live rtspplay-server; do
    if [ -f "packages/$pkg/package.json" ]; then
        name=$(grep -o '"name": "[^"]*"' "packages/$pkg/package.json" | cut -d'"' -f4)
        version=$(grep -o '"version": "[^"]*"' "packages/$pkg/package.json" | cut -d'"' -f4)
        echo "  ✓ $name@$version"
    fi
done
echo ""

# 检查 README
echo "3. 检查 README..."
for pkg in rtspplay rtspplay-live rtspplay-server; do
    if [ -f "packages/$pkg/README.md" ]; then
        echo "  ✓ packages/$pkg/README.md"
    else
        echo "  ✗ packages/$pkg/README.md 不存在"
    fi
done
echo ""

# 检查 LICENSE
echo "4. 检查 LICENSE..."
if [ -f "packages/rtspplay/LICENSE" ]; then
    echo "  ✓ LICENSE 文件存在"
else
    echo "  ✗ LICENSE 文件不存在"
fi
echo ""

echo "✅ 发布准备验证完成！"
echo ""
echo "下一步: 运行 ./publish.sh 发布到 npm"
