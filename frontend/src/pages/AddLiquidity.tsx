import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import { CONTRACTS } from '../config/contracts.generated';
import { useAddLiquidity, usePreviewAddLiquidity, useDexReserves } from '../hooks/useDexContract';
import { useTokenBalance, useTokenAllowance, useApproveToken } from '../hooks/useTokenContract';

export default function AddLiquidity() {
  const { address } = useAccount();
  const [amount0, setAmount0] = useState('');
  const [amount1, setAmount1] = useState('');
  const [slippage, setSlippage] = useState('0.5');

  const { data: balanceA } = useTokenBalance(CONTRACTS.TOKEN_A_ADDRESS, address);
  const { data: balanceB } = useTokenBalance(CONTRACTS.TOKEN_B_ADDRESS, address);
  const { data: allowanceA, refetch: refetchAllowanceA } = useTokenAllowance(CONTRACTS.TOKEN_A_ADDRESS, address, CONTRACTS.DEX_ADDRESS);
  const { data: allowanceB, refetch: refetchAllowanceB } = useTokenAllowance(CONTRACTS.TOKEN_B_ADDRESS, address, CONTRACTS.DEX_ADDRESS);
  const { data: reserves } = useDexReserves();
  const { data: preview } = usePreviewAddLiquidity(amount0, amount1);

  const { approve: approveA, isPending: isApprovingA, isSuccess: isApproveASuccess } = useApproveToken();
  const { approve: approveB, isPending: isApprovingB, isSuccess: isApproveBSuccess } = useApproveToken();
  const { addLiquidity, isPending: isAdding, isConfirming: isAddingConfirming, isSuccess: isAddSuccess } = useAddLiquidity();

  const needsApprovalA = allowanceA !== undefined && amount0 && BigInt(parseFloat(amount0) * 1e18) > allowanceA;
  const needsApprovalB = allowanceB !== undefined && amount1 && BigInt(parseFloat(amount1) * 1e18) > allowanceB;

  useEffect(() => {
    if (isApproveASuccess) refetchAllowanceA();
  }, [isApproveASuccess, refetchAllowanceA]);

  useEffect(() => {
    if (isApproveBSuccess) refetchAllowanceB();
  }, [isApproveBSuccess, refetchAllowanceB]);

  useEffect(() => {
    if (isAddSuccess) {
      setAmount0('');
      setAmount1('');
    }
  }, [isAddSuccess]);

  useEffect(() => {
    if (reserves && amount0 && reserves[0] > 0n) {
      const ratio = Number(reserves[1]) / Number(reserves[0]);
      setAmount1((parseFloat(amount0) * ratio).toString());
    }
  }, [amount0, reserves]);

  const handleApproveA = () => {
    if (!amount0) return;
    approveA(CONTRACTS.TOKEN_A_ADDRESS, CONTRACTS.DEX_ADDRESS, amount0);
  };

  const handleApproveB = () => {
    if (!amount1) return;
    approveB(CONTRACTS.TOKEN_B_ADDRESS, CONTRACTS.DEX_ADDRESS, amount1);
  };

  const handleAddLiquidity = () => {
    if (!amount0 || !amount1 || !preview) return;
    const minLiquidity = (Number(formatUnits(preview[2], 18)) * (1 - parseFloat(slippage) / 100)).toString();
    addLiquidity(amount0, amount1, minLiquidity);
  };

  return (
    <div className="liquidity-container">
      <h2>添加流动性</h2>

      <div className="liquidity-card">
        <div className="input-group">
          <label>Token A 数量</label>
          <input
            type="number"
            value={amount0}
            onChange={(e) => setAmount0(e.target.value)}
            placeholder="0.0"
          />
          <div className="balance">
            余额: {balanceA ? formatUnits(balanceA, 18) : '0'} Token A
          </div>
        </div>

        <div className="plus-sign">+</div>

        <div className="input-group">
          <label>Token B 数量</label>
          <input
            type="number"
            value={amount1}
            onChange={(e) => setAmount1(e.target.value)}
            placeholder="0.0"
          />
          <div className="balance">
            余额: {balanceB ? formatUnits(balanceB, 18) : '0'} Token B
          </div>
        </div>

        {preview && (
          <div className="preview-info">
            <p>预计获得 LP 份额: {formatUnits(preview[2], 18)}</p>
            <p>实际使用 Token A: {formatUnits(preview[0], 18)}</p>
            <p>实际使用 Token B: {formatUnits(preview[1], 18)}</p>
          </div>
        )}

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
        ) : needsApprovalA ? (
          <button
            className="action-button"
            onClick={handleApproveA}
            disabled={isApprovingA}
          >
            {isApprovingA ? '授权中...' : '授权 Token A'}
          </button>
        ) : needsApprovalB ? (
          <button
            className="action-button"
            onClick={handleApproveB}
            disabled={isApprovingB}
          >
            {isApprovingB ? '授权中...' : '授权 Token B'}
          </button>
        ) : (
          <button
            className="action-button"
            onClick={handleAddLiquidity}
            disabled={!amount0 || !amount1 || isAdding || isAddingConfirming}
          >
            {isAdding || isAddingConfirming ? '添加中...' : '添加流动性'}
          </button>
        )}
      </div>
    </div>
  );
}
