# Simple DEX Frontend

基于 React + RainbowKit + Wagmi + Viem 构建的去中心化交易所前端应用。

## 功能特性

- 代币交换（Swap）
- 添加流动性
- 移除流动性
- 池子信息查看
- 钱包连接（RainbowKit）
- 多链支持（Mainnet、Sepolia、Hardhat）

## 技术栈

- React 19
- TypeScript
- Viem 2.x
- Wagmi 2.x
- RainbowKit 2.x
- React Router 7
- Vite 8

## 开始使用

### 1. 安装依赖

```bash
npm install
```

### 2. 配置合约地址

编辑 [src/config/contracts.generated.ts](src/config/contracts.generated.ts)，更新为你的实际部署地址：

```typescript
export const CONTRACTS = {
  DEX_ADDRESS: '0x你的DEX合约地址' as `0x${string}`,
  TOKEN_A_ADDRESS: '0x你的TokenA地址' as `0x${string}`,
  TOKEN_B_ADDRESS: '0x你的TokenB地址' as `0x${string}`,
};
```

### 3. 配置 WalletConnect Project ID

编辑 [src/config/wagmi.ts](src/config/wagmi.ts)，替换为你的 WalletConnect Project ID：

```typescript
export const config = getDefaultConfig({
  appName: 'Simple DEX',
  projectId: 'YOUR_PROJECT_ID', // 从 https://cloud.walletconnect.com 获取
  // ...
});
```

### 4. 启动开发服务器

```bash
npm run dev
```

应用将在 http://localhost:5173 启动。

## 项目结构

```
src/
├── config/
│   ├── contracts.ts      # 合约地址和 ABI
│   └── wagmi.ts          # Wagmi 配置
├── hooks/
│   ├── useDexContract.ts # DEX 合约交互 hooks
│   └── useTokenContract.ts # ERC20 代币交互 hooks
├── pages/
│   ├── Swap.tsx          # 交换页面
│   ├── AddLiquidity.tsx  # 添加流动性页面
│   ├── RemoveLiquidity.tsx # 移除流动性页面
│   └── Pool.tsx          # 池子信息页面
├── components/
│   └── Layout.tsx        # 布局组件
├── App.tsx               # 应用入口
├── App.css               # 样式文件
└── main.tsx              # React 入口
```

## 使用说明

### 连接钱包

1. 点击右上角的 "Connect Wallet" 按钮
2. 选择你的钱包（MetaMask、WalletConnect 等）
3. 确认连接

### 交换代币

1. 进入"交换"页面
2. 输入要交换的代币数量
3. 查看预估输出
4. 如需授权，先点击"授权"按钮
5. 点击"交换"按钮完成交易

### 添加流动性

1. 进入"添加流动性"页面
2. 输入 Token A 和 Token B 的数量
3. 系统会自动计算池子比例
4. 授权两个代币（如需要）
5. 点击"添加流动性"完成操作

### 移除流动性

1. 进入"移除流动性"页面
2. 输入要移除的 LP 份额数量
3. 查看预估获得的代币数量
4. 点击"移除流动性"完成操作

### 查看池子信息

进入"池子"页面可以查看：
- 池子总储备量
- 总 LP 份额
- 代币价格比率
- 你的流动性份额和占比

## 构建生产版本

```bash
npm run build
```

构建产物将输出到 `dist/` 目录。

## 注意事项

1. 确保已部署 SimpleDex 合约和测试代币
2. 在本地测试时，需要先启动 Anvil 本地节点
3. 交易前确保钱包有足够的 ETH 支付 gas 费用
4. 首次交互需要授权代币给 DEX 合约
5. 建议设置合理的滑点容忍度（默认 0.5%）
