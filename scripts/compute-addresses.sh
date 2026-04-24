#!/bin/bash

# 计算合约部署地址脚本
# 用法: ./scripts/compute-addresses.sh [DEPLOYER_ADDRESS] [PRIVATE_KEY]

# 默认使用 Anvil 第一个账户
DEFAULT_PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
DEFAULT_DEPLOYER="0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

# 获取参数或使用默认值
DEPLOYER=${1:-$DEFAULT_DEPLOYER}
PRIVATE_KEY=${2:-$DEFAULT_PRIVATE_KEY}

echo "=========================================="
echo "合约地址计算工具"
echo "=========================================="
echo ""
echo "部署者地址: $DEPLOYER"
echo "私钥: ${PRIVATE_KEY:0:10}...${PRIVATE_KEY: -8}"
echo ""
echo "=========================================="
echo "预计部署地址:"
echo "=========================================="
echo ""

# 计算 Token A 地址 (nonce=0)
TOKEN_A=$(cast compute-address $DEPLOYER --nonce 0 2>/dev/null | grep "Computed Address:" | awk '{print $3}')
echo "Token A (DTA):  $TOKEN_A"

# 计算 Token B 地址 (nonce=1)
TOKEN_B=$(cast compute-address $DEPLOYER --nonce 1 2>/dev/null | grep "Computed Address:" | awk '{print $3}')
echo "Token B (DTB):  $TOKEN_B"

# 计算 SimpleDex 地址 (nonce=2)
DEX=$(cast compute-address $DEPLOYER --nonce 2 2>/dev/null | grep "Computed Address:" | awk '{print $3}')
echo "SimpleDex:      $DEX"

echo ""
echo "=========================================="
echo "前端配置代码:"
echo "=========================================="
echo ""
cat << EOF
export const CONTRACTS = {
  DEX_ADDRESS: '$DEX' as \`0x\${string}\`,
  TOKEN_A_ADDRESS: '$TOKEN_A' as \`0x\${string}\`,
  TOKEN_B_ADDRESS: '$TOKEN_B' as \`0x\${string}\`,
};
EOF
echo ""
