#!/bin/bash

# 从编译产物生成前端 ABI 配置
# 用法: ./scripts/generate-abi.sh

echo "正在从编译产物提取 ABI..."

# 确保合约已编译
if [ ! -f "out/SimpleDex.sol/SimpleDex.json" ]; then
    echo "错误: 找不到编译产物，请先运行 'forge build'"
    exit 1
fi

# 提取 SimpleDex ABI
SIMPLE_DEX_ABI=$(cat out/SimpleDex.sol/SimpleDex.json | jq -c '.abi')

# 提取 MockERC20 ABI
ERC20_ABI=$(cat out/MockERC20.sol/MockERC20.json | jq -c '.abi')

# 生成 TypeScript 配置文件
cat > frontend/src/config/contracts.generated.ts << EOF
// 此文件由 scripts/generate-abi.sh 自动生成
// 请勿手动编辑

export const CONTRACTS = {
  // 本地 Anvil 部署地址（需要替换为实际部署地址）
  DEX_ADDRESS: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0' as \`0x\${string}\`,
  TOKEN_A_ADDRESS: '0x5FbDB2315678afecb367f032d93F642f64180aa3' as \`0x\${string}\`,
  TOKEN_B_ADDRESS: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512' as \`0x\${string}\`,
};

export const SIMPLE_DEX_ABI = ${SIMPLE_DEX_ABI} as const;

export const ERC20_ABI = ${ERC20_ABI} as const;
EOF

echo "✅ ABI 已生成到 frontend/src/config/contracts.generated.ts"
echo ""
echo "包含的 ABI 条目："
echo "  - SimpleDex: $(echo $SIMPLE_DEX_ABI | jq '. | length') 个"
echo "  - ERC20: $(echo $ERC20_ABI | jq '. | length') 个"
