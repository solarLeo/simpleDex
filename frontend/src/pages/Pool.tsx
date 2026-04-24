import { useAccount } from 'wagmi';
import { formatUnits } from 'viem';
import { CONTRACTS } from '../config/contracts';
import { useDexReserves, useUserLiquidity, useTotalLiquidity } from '../hooks/useDexContract';
import { useTokenSymbol } from '../hooks/useTokenContract';

export default function Pool() {
  const { address } = useAccount();
  const { data: reserves } = useDexReserves();
  const { data: userLiquidity } = useUserLiquidity(address);
  const { data: totalLiquidity } = useTotalLiquidity();
  const { data: symbolA } = useTokenSymbol(CONTRACTS.TOKEN_A_ADDRESS);
  const { data: symbolB } = useTokenSymbol(CONTRACTS.TOKEN_B_ADDRESS);

  const userShare = userLiquidity && totalLiquidity && totalLiquidity > 0n
    ? (Number(userLiquidity) / Number(totalLiquidity)) * 100
    : 0;

  const userAmount0 = userLiquidity && totalLiquidity && reserves && totalLiquidity > 0n
    ? (Number(userLiquidity) * Number(reserves[0])) / Number(totalLiquidity)
    : 0;

  const userAmount1 = userLiquidity && totalLiquidity && reserves && totalLiquidity > 0n
    ? (Number(userLiquidity) * Number(reserves[1])) / Number(totalLiquidity)
    : 0;

  return (
    <div className="pool-container">
      <h2>流动性池信息</h2>

      <div className="pool-card">
        <h3>池子总览</h3>
        <div className="pool-stats">
          <div className="stat-item">
            <span className="stat-label">{symbolA || 'Token A'} 储备:</span>
            <span className="stat-value">
              {reserves ? formatUnits(reserves[0], 18) : '0'}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">{symbolB || 'Token B'} 储备:</span>
            <span className="stat-value">
              {reserves ? formatUnits(reserves[1], 18) : '0'}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">总 LP 份额:</span>
            <span className="stat-value">
              {totalLiquidity ? formatUnits(totalLiquidity, 18) : '0'}
            </span>
          </div>
          {reserves && reserves[0] > 0n && (
            <div className="stat-item">
              <span className="stat-label">价格比率:</span>
              <span className="stat-value">
                1 {symbolA || 'Token A'} = {(Number(reserves[1]) / Number(reserves[0])).toFixed(6)} {symbolB || 'Token B'}
              </span>
            </div>
          )}
        </div>
      </div>

      {address && (
        <div className="pool-card">
          <h3>你的流动性</h3>
          <div className="pool-stats">
            <div className="stat-item">
              <span className="stat-label">你的 LP 份额:</span>
              <span className="stat-value">
                {userLiquidity ? formatUnits(userLiquidity, 18) : '0'}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">池子占比:</span>
              <span className="stat-value">{userShare.toFixed(4)}%</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">你的 {symbolA || 'Token A'}:</span>
              <span className="stat-value">
                {(userAmount0 / 1e18).toFixed(6)}
              </span>
            </div>
            <div className="stat-item">
              <span className="stat-label">你的 {symbolB || 'Token B'}:</span>
              <span className="stat-value">
                {(userAmount1 / 1e18).toFixed(6)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
