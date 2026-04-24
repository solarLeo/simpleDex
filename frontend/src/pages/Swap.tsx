import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import { CONTRACTS } from '../config/contracts.generated';
import { useSwap, useGetAmountOut } from '../hooks/useDexContract';
import { useTokenBalance, useTokenAllowance, useApproveToken } from '../hooks/useTokenContract';

export default function Swap() {
  const { address } = useAccount();
  const [tokenIn, setTokenIn] = useState<'A' | 'B'>('A');
  const [amountIn, setAmountIn] = useState('');
  const [slippage, setSlippage] = useState('0.5');

  const tokenInAddress = tokenIn === 'A' ? CONTRACTS.TOKEN_A_ADDRESS : CONTRACTS.TOKEN_B_ADDRESS;
  const tokenOutAddress = tokenIn === 'A' ? CONTRACTS.TOKEN_B_ADDRESS : CONTRACTS.TOKEN_A_ADDRESS;

  const { data: balanceIn } = useTokenBalance(tokenInAddress, address);
  const { data: balanceOut } = useTokenBalance(tokenOutAddress, address);
  const { data: allowance, refetch: refetchAllowance } = useTokenAllowance(tokenInAddress, address, CONTRACTS.DEX_ADDRESS);
  const { data: amountOut } = useGetAmountOut(tokenInAddress, amountIn);

  const { approve, isPending: isApproving, isConfirming: isApprovingConfirming, isSuccess: isApproveSuccess } = useApproveToken();
  const { swap, isPending: isSwapping, isConfirming: isSwapConfirming, isSuccess: isSwapSuccess } = useSwap();

  const needsApproval = allowance !== undefined && amountIn && BigInt(parseFloat(amountIn) * 1e18) > allowance;

  useEffect(() => {
    if (isApproveSuccess) {
      refetchAllowance();
    }
  }, [isApproveSuccess, refetchAllowance]);

  useEffect(() => {
    if (isSwapSuccess) {
      setAmountIn('');
    }
  }, [isSwapSuccess]);

  const handleApprove = () => {
    if (!amountIn) return;
    approve(tokenInAddress, CONTRACTS.DEX_ADDRESS, amountIn);
  };

  const handleSwap = () => {
    if (!amountIn || !amountOut) return;
    const minAmountOut = (Number(formatUnits(amountOut, 18)) * (1 - parseFloat(slippage) / 100)).toString();
    swap(tokenInAddress, amountIn, minAmountOut);
  };

  const switchTokens = () => {
    setTokenIn(tokenIn === 'A' ? 'B' : 'A');
    setAmountIn('');
  };

  return (
    <div className="swap-container">
      <h2>交换代币</h2>

      <div className="swap-card">
        <div className="input-group">
          <label>从</label>
          <div className="token-input">
            <input
              type="number"
              value={amountIn}
              onChange={(e) => setAmountIn(e.target.value)}
              placeholder="0.0"
            />
            <button className="token-select">Token {tokenIn}</button>
          </div>
          <div className="balance">
            余额: {balanceIn ? formatUnits(balanceIn, 18) : '0'} Token {tokenIn}
          </div>
        </div>

        <button className="switch-button" onClick={switchTokens}>
          ↓
        </button>

        <div className="input-group">
          <label>到</label>
          <div className="token-input">
            <input
              type="number"
              value={amountOut ? formatUnits(amountOut, 18) : ''}
              readOnly
              placeholder="0.0"
            />
            <button className="token-select">Token {tokenIn === 'A' ? 'B' : 'A'}</button>
          </div>
          <div className="balance">
            余额: {balanceOut ? formatUnits(balanceOut, 18) : '0'} Token {tokenIn === 'A' ? 'B' : 'A'}
          </div>
        </div>

        <div className="slippage-group">
          <label>滑点容忍度 (%)</label>
          <input
            type="number"
            value={slippage}
            onChange={(e) => setSlippage(e.target.value)}
            step="0.1"
            min="0"
            max="50"
          />
        </div>

        {!address ? (
          <button className="action-button" disabled>
            请先连接钱包
          </button>
        ) : needsApproval ? (
          <button
            className="action-button"
            onClick={handleApprove}
            disabled={isApproving || isApprovingConfirming}
          >
            {isApproving || isApprovingConfirming ? '授权中...' : '授权'}
          </button>
        ) : (
          <button
            className="action-button"
            onClick={handleSwap}
            disabled={!amountIn || !amountOut || isSwapping || isSwapConfirming}
          >
            {isSwapping || isSwapConfirming ? '交换中...' : '交换'}
          </button>
        )}
      </div>
    </div>
  );
}
