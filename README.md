# Simple DEX 示例

这是一个最小可运行的去中心化交易所示例，使用 Solidity + Foundry 实现了一个基于恒定乘积公式 `x * y = k` 的 AMM。

项目包含：

- 两个测试 ERC20 代币 `MockERC20`
- 一个简化版 DEX 合约 `SimpleDex`
- 本地单元测试
- 本地部署脚本
- 测试网部署步骤

## 1. 功能说明

`SimpleDex` 支持以下核心能力：

- 初始化和追加流动性
- 按比例移除流动性
- 按 `997 / 1000` 手续费模型做代币交换
- 基于最小输出和最小 LP 份额的滑点保护

当前设计刻意保持简单，便于学习和本地演示，不适合作为生产级 DEX 直接上线。主要限制包括：

- 只支持一个交易对
- LP 份额没有做成可转让 ERC20
- 没有 TWAP、预言机、防 MEV、协议费治理等生产能力
- 只针对标准 ERC20 代币设计，不支持手续费代币等特殊代币

## 2. 项目结构

```text
.
├── foundry.toml
├── Makefile
├── src
│   ├── MockERC20.sol
│   ├── SimpleDex.sol
│   ├── interfaces
│   │   └── IERC20Minimal.sol
│   └── utils
│       └── FoundryVm.sol
├── script
│   └── DeploySimpleDex.s.sol
└── test
    ├── SimpleDex.t.sol
    └── utils
        └── TestBase.sol
```

## 3. 环境准备

确认本机已安装 Foundry：

```bash
forge --version
anvil --version
cast --version
```

如果还没安装，可以执行：

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

## 4. 编译与测试

### 4.1 编译

```bash
make build
```

### 4.2 运行测试

```bash
make test
```

测试覆盖了：

- 初次添加流动性
- 按池子比例追加流动性
- 移除流动性
- 两个方向的 swap
- 滑点保护回滚
- 非法代币地址回滚

## 5. 本地部署

### 5.1 启动本地区块链

在第一个终端运行：

```bash
make anvil
```

Anvil 默认会监听 `http://127.0.0.1:8545`，并打印一组测试账号和私钥。

如果 `8545` 已经被占用，也可以显式换一个端口：

```bash
anvil --host 127.0.0.1 --port 18545
```

### 5.2 设置部署私钥

在第二个终端中，使用 Anvil 打印出来的第一个私钥：

```bash
export PRIVATE_KEY=你的_anvil_测试私钥
export RPC_URL=http://127.0.0.1:8545
```

你也可以先复制环境变量模板：

```bash
cp .env.example .env
source .env
```

如果你想自定义初始代币和流动性，也可以额外设置：

```bash
export INITIAL_SUPPLY=1000000000000000000000000
export INITIAL_LIQUIDITY0=100000000000000000000000
export INITIAL_LIQUIDITY1=100000000000000000000000
```

上面的数值单位都是 `wei`，18 位精度。

### 5.3 执行部署

./scripts/compute-addresses.sh

Token A (DTA): 0x5FbDB2315678afecb367f032d93F642f64180aa3
Token B (DTB): 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
SimpleDex: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0

```bash
make deploy-local RPC_URL=$RPC_URL
```

或者直接执行：

```bash
forge script script/DeploySimpleDex.s.sol:DeploySimpleDex \
  --rpc-url $RPC_URL \
  --broadcast \
  -vvv
```

部署脚本会完成这些事情：

1. 部署 `Demo Token A`
2. 部署 `Demo Token B`
3. 部署 `SimpleDex`
4. 给部署账户铸造初始代币
5. 自动往 DEX 注入首笔流动性

### 5.4 获取部署地址

部署完成后，你可以通过以下两个方式拿到地址：

1. 直接看命令行输出
2. 查看 Foundry 的广播文件

广播文件路径类似：

```text
broadcast/DeploySimpleDex.s.sol/31337/run-latest.json
```

如果你的机器安装了 `jq`，可以进一步查看交易详情：

```bash
cat broadcast/DeploySimpleDex.s.sol/31337/run-latest.json | jq
```

## 6. 本地交互示例

下面示例基于 Anvil 默认本地链。

### 6.1 查询部署账户地址

```bash
cast wallet address --private-key $PRIVATE_KEY
```

### 6.2 查询 DEX 储备金

将 `DEX_ADDRESS` 替换成你的部署地址：

```bash
cast call $DEX_ADDRESS "getReserves()(uint256,uint256)" --rpc-url $RPC_URL
```

### 6.3 查询 swap 预估输出

将 `TOKEN_A_ADDRESS` 替换成真实地址，示例输入为 `100 ether`：

```bash
cast call $DEX_ADDRESS \
  "getAmountOut(address,uint256)(uint256)" \
  $TOKEN_A_ADDRESS \
  100000000000000000000 \
  --rpc-url $RPC_URL
```

### 6.4 追加流动性

先授权：

```bash
cast send $TOKEN_A_ADDRESS "approve(address,uint256)" $DEX_ADDRESS 500000000000000000000 \
  --private-key $PRIVATE_KEY --rpc-url $RPC_URL

cast send $TOKEN_B_ADDRESS "approve(address,uint256)" $DEX_ADDRESS 500000000000000000000 \
  --private-key $PRIVATE_KEY --rpc-url $RPC_URL
```

再添加流动性：

```bash
cast send $DEX_ADDRESS \
  "addLiquidity(uint256,uint256,uint256)" \
  500000000000000000000 \
  500000000000000000000 \
  1 \
  --private-key $PRIVATE_KEY --rpc-url $RPC_URL
```

### 6.5 执行一次 swap

先授权输入代币：

```bash
cast send $TOKEN_A_ADDRESS "approve(address,uint256)" $DEX_ADDRESS 100000000000000000000 \
  --private-key $PRIVATE_KEY --rpc-url $RPC_URL
```

然后执行 swap：

```bash
cast send $DEX_ADDRESS \
  "swap(address,uint256,uint256)" \
  $TOKEN_A_ADDRESS \
  100000000000000000000 \
  1 \
  --private-key $PRIVATE_KEY --rpc-url $RPC_URL
```

## 7. 部署到测试网

这里以 Sepolia 为例。

### 7.1 准备环境变量

```bash
export PRIVATE_KEY=你的测试网钱包私钥
export RPC_URL=你的_sepolia_rpc_url
```

### 7.2 执行部署

```bash
make deploy-network RPC_URL=$RPC_URL
```

或直接：

```bash
forge script script/DeploySimpleDex.s.sol:DeploySimpleDex \
  --rpc-url $RPC_URL \
  --broadcast \
  -vvv
```

### 7.3 可选：链上验证

如果你要做源码验证，可以继续补充区块浏览器 API Key，并在部署命令中加入 `--verify`。

## 8. 合约设计说明

### 8.1 定价模型

Swap 使用恒定乘积做市模型：

```text
x * y = k
```

手续费模型为：

```text
amountInWithFee = amountIn * 997
amountOut = reserveOut * amountInWithFee / (reserveIn * 1000 + amountInWithFee)
```

### 8.2 流动性份额

第一次注入流动性时：

```text
liquidity = sqrt(amount0 * amount1)
```

后续注入时，LP 份额按池子当前比例计算。

### 8.3 安全保护

当前示例包含这些基础保护：

- 输入金额不能为 0
- 非法交易对直接回滚
- swap 和增减流动性都带最小值保护
- 使用简单的 `nonReentrant` 防重入锁
- 通过安全转账包装处理 ERC20 返回值

## 9. 后续可扩展方向

如果你想把这个项目继续往实战方向推进，下一步建议是：

1. 把 LP 份额升级成 ERC20 LP Token
2. 增加工厂合约，支持多交易对
3. 增加 Router，简化用户交互
4. 增加前端页面
5. 增加脚本，把部署结果自动写入前端配置
