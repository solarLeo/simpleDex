import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import { useRemoveLiquidity, usePreviewRemoveLiquidity, useUserLiquidity } from '../hooks/useDexContract';

export default function RemoveLiquidity() {
  const { address } = useAccount();
  const [liquidityAmount, setLiquidityAmount] = useState('');
  const [slippage, setSlippage] = useState('0.5');

  const { data: userLiquidity } = useUserLiquidity(address);
  const { data: preview } = usePreviewRemoveLiquidity(liquidityAmount);
  const { removeLiquidity, isPending, isConfirming, isSuccess } = useRemoveLiquidity();

  useEffect(() => {
    if (isSuccess) {
      setLiquidityAmount('');
    }
  }, [isSuccess]);

  const handleRemoveLiquidity = () => {
    if (!liquidityAmount || !preview) return;
    const minAmount0 = (Number(formatUnits(preview[0], 18)) * (1 - parseFloat(slippage) / 100)).toString();
    const minAmount1 = (Number(formatUnits(preview[1], 18)) * (1 - parseFloat(slippage) / 100)).toString();
    removeLiquidity(liquidityAmount, minAmount0, minAmount1);
  };

  const setMaxLiquidity = () => {
    if (userLiquidity) {
      setLiquidityAmount(formatUnits(userLiquidity, 18));
    }
  };

  return (
    <div className="liquidity-container">
      <h2>移除流动性</h2>

      <div className="liquidity-card">
        <div className="input-group">
          <label>LP 份额数量</label>
          <input
            type="number"
            value={liquidityAmount}
            onChange={(e) => setLiquidityAmount(e.target.value)}
            placeholder="0.0"
          />
          <div className="balance">
            你的 LP 份额: {userLiquidity ? formatUnits(userLiquidity, 18) : '0'}
            <button className="max-button" onClick={setMaxLiquidity}>
              最大
            </button>
          </div>
        </div>

        {preview && (
          <div className="preview-info">
            <p>预计获得 Token A: {formatUnits(preview[0], 18)}</p>
            <p>预计获得 Token B: {formatUnits(preview[1], 18)}</p>
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
        ) : (
          <button
            className="action-button"
            onClick={handleRemoveLiquidity}
            disabled={!liquidityAmount || isPending || isConfirming}
          >
            {isPending || isConfirming ? '移除中...' : '移除流动性'}
          </button>
        )}
      </div>
    </div>
  );
}
