# 完整部署和使用指南

从合约部署到前端调用的完整流程。

## 第一步：启动本地区块链

```bash
# 启动 Anvil 本地节点
make anvil
```

Anvil 会打印 10 个测试账户和私钥，保持这个终端运行。

## 第二步：配置环境变量

在新终端中：

```bash
# 复制配置模板
cp .env.example .env

# 使用默认配置即可（Anvil 第一个账户）
source .env
```

默认配置：
- 部署者私钥：`0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
- RPC 地址：`http://127.0.0.1:8545`

## 第三步：部署合约

```bash
# 编译合约
make build

# 部署到本地 Anvil
make deploy-local RPC_URL=$RPC_URL
```

部署脚本会自动完成：
1. 部署 Token A (DTA)
2. 部署 Token B (DTB)  
3. 部署 SimpleDex
4. 给部署账户铸造代币
5. 注入初始流动性

## 第四步：获取合约地址

### 方法 1：使用脚本自动计算

```bash
./scripts/compute-addresses.sh
```

输出示例：
```
Token A (DTA):  0x5FbDB2315678afecb367f032d93F642f64180aa3
Token B (DTB):  0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
SimpleDex:      0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
```

### 方法 2：从部署日志查看

```bash
cat broadcast/DeploySimpleDex.s.sol/31337/run-latest.json | grep contractAddress
```

## 第五步：配置前端

编辑 [frontend/src/config/contracts.ts](frontend/src/config/contracts.ts)：

```typescript
export const CONTRACTS = {
  DEX_ADDRESS: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0' as `0x${string}`,
  TOKEN_A_ADDRESS: '0x5FbDB2315678afecb367f032d93F642f64180aa3' as `0x${string}`,
  TOKEN_B_ADDRESS: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512' as `0x${string}`,
};
```

编辑 [frontend/src/config/wagmi.ts](frontend/src/config/wagmi.ts)，配置 WalletConnect Project ID：

```typescript
export const config = getDefaultConfig({
  appName: 'Simple DEX',
  projectId: 'YOUR_PROJECT_ID', // 从 https://cloud.walletconnect.com 获取
  // ...
});
```

## 第六步：启动前端

```bash
cd frontend

# 安装依赖（首次运行）
npm install

# 启动开发服务器
npm run dev
```

访问 http://localhost:5173

## 第七步：连接钱包并测试

### 1. 配置 MetaMask

添加 Hardhat 本地网络：
- 网络名称：Hardhat Local
- RPC URL：http://127.0.0.1:8545
- Chain ID：31337
- 货币符号：ETH

### 2. 导入测试账户

在 MetaMask 中导入 Anvil 第一个账户的私钥：
```
0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

### 3. 连接钱包

在前端页面点击 "Connect Wallet"，选择 MetaMask。

### 4. 测试功能

**查看池子信息：**
- 进入"池子"页面
- 查看储备量、LP 份额、价格比率

**交换代币：**
1. 进入"交换"页面
2. 输入要交换的数量（如 100）
3. 查看预估输出
4. 点击"授权"（首次需要）
5. 点击"交换"

**添加流动性：**
1. 进入"添加流动性"页面
2. 输入 Token A 数量（如 500）
3. Token B 会自动按比例计算
4. 授权两个代币（首次需要）
5. 点击"添加流动性"

**移除流动性：**
1. 进入"移除流动性"页面
2. 输入要移除的 LP 份额
3. 查看预估获得的代币
4. 点击"移除流动性"

## 工作原理

### 合约部署流程

```
部署者账户 (nonce=0) → Token A 合约
部署者账户 (nonce=1) → Token B 合约  
部署者账户 (nonce=2) → SimpleDex 合约
```

因为部署者地址和 nonce 固定，所以合约地址是确定的。

### 前端调用流程

```
用户操作 → React 组件
         ↓
    Custom Hooks (useDexContract, useTokenContract)
         ↓
    Wagmi Hooks (useReadContract, useWriteContract)
         ↓
    Viem (构造交易)
         ↓
    RainbowKit (钱包签名)
         ↓
    RPC 节点 (Anvil)
         ↓
    智能合约执行
```

### 关键文件说明

**合约端：**
- [src/SimpleDex.sol](src/SimpleDex.sol) - DEX 核心逻辑
- [src/MockERC20.sol](src/MockERC20.sol) - 测试代币
- [script/DeploySimpleDex.s.sol](script/DeploySimpleDex.s.sol) - 部署脚本

**前端端：**
- [frontend/src/config/contracts.ts](frontend/src/config/contracts.ts) - 合约地址和 ABI
- [frontend/src/hooks/useDexContract.ts](frontend/src/hooks/useDexContract.ts) - DEX 交互逻辑
- [frontend/src/pages/Swap.tsx](frontend/src/pages/Swap.tsx) - 交换界面

## 常见问题

**Q: 为什么合约地址总是一样？**
A: 因为使用相同的部署者地址和部署顺序，以太坊的地址生成是确定性的。

**Q: 如何重新部署？**
A: 重启 Anvil（会清空状态），然后重新执行部署命令。

**Q: 前端连接不上合约？**
A: 检查：
1. Anvil 是否在运行
2. MetaMask 是否连接到 Hardhat 网络
3. 合约地址配置是否正确

**Q: 交易失败？**
A: 常见原因：
1. 未授权代币
2. 余额不足
3. 滑点设置过低
4. Gas 不足

## 部署到测试网

如需部署到 Sepolia 等测试网：

```bash
# 配置 .env
PRIVATE_KEY=你的测试网私钥
RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY

# 部署
source .env
make deploy-network RPC_URL=$RPC_URL
```

然后更新前端配置，将 wagmi 配置中的默认链改为 Sepolia。
