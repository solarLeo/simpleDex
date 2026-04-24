# 快速启动指南

## 1. 安装依赖
```bash
npm install
```

## 2. 配置合约地址

编辑 `src/config/contracts.ts`，替换为你的实际部署地址：

```typescript
export const CONTRACTS = {
  DEX_ADDRESS: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  TOKEN_A_ADDRESS: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  TOKEN_B_ADDRESS: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
};
```

## 3. 配置 WalletConnect Project ID

编辑 `src/config/wagmi.ts`，替换 `YOUR_PROJECT_ID`：
- 访问 https://cloud.walletconnect.com
- 注册并创建项目
- 复制 Project ID

## 4. 启动开发服务器
```bash
npm run dev
```

访问 http://localhost:5173

## 功能说明

- **交换** - 代币互换
- **添加流动性** - 向池子注入代币
- **移除流动性** - 从池子提取代币
- **池子** - 查看池子信息和你的份额

## 注意事项

1. 确保钱包连接到正确的网络（本地测试用 Hardhat）
2. 首次使用需要授权代币
3. 建议设置 0.5% 的滑点容忍度
