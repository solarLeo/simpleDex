import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACTS, SIMPLE_DEX_ABI } from '../config/contracts.generated';
import { parseUnits } from 'viem';

export function useDexReserves() {
  return useReadContract({
    address: CONTRACTS.DEX_ADDRESS,
    abi: SIMPLE_DEX_ABI,
    functionName: 'getReserves',
  });
}

export function useGetAmountOut(tokenIn: `0x${string}` | undefined, amountIn: string) {
  return useReadContract({
    address: CONTRACTS.DEX_ADDRESS,
    abi: SIMPLE_DEX_ABI,
    functionName: 'getAmountOut',
    args: tokenIn && amountIn ? [tokenIn, parseUnits(amountIn, 18)] : undefined,
    query: {
      enabled: !!tokenIn && !!amountIn && parseFloat(amountIn) > 0,
    },
  });
}

export function usePreviewAddLiquidity(amount0: string, amount1: string) {
  return useReadContract({
    address: CONTRACTS.DEX_ADDRESS,
    abi: SIMPLE_DEX_ABI,
    functionName: 'previewAddLiquidity',
    args: amount0 && amount1 ? [parseUnits(amount0, 18), parseUnits(amount1, 18)] : undefined,
    query: {
      enabled: !!amount0 && !!amount1 && parseFloat(amount0) > 0 && parseFloat(amount1) > 0,
    },
  });
}

export function usePreviewRemoveLiquidity(liquidityAmount: string) {
  return useReadContract({
    address: CONTRACTS.DEX_ADDRESS,
    abi: SIMPLE_DEX_ABI,
    functionName: 'previewRemoveLiquidity',
    args: liquidityAmount ? [parseUnits(liquidityAmount, 18)] : undefined,
    query: {
      enabled: !!liquidityAmount && parseFloat(liquidityAmount) > 0,
    },
  });
}

export function useUserLiquidity(address: `0x${string}` | undefined) {
  return useReadContract({
    address: CONTRACTS.DEX_ADDRESS,
    abi: SIMPLE_DEX_ABI,
    functionName: 'liquidityOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });
}

export function useTotalLiquidity() {
  return useReadContract({
    address: CONTRACTS.DEX_ADDRESS,
    abi: SIMPLE_DEX_ABI,
    functionName: 'totalLiquidity',
  });
}

export function useSwap() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const swap = (tokenIn: `0x${string}`, amountIn: string, minAmountOut: string) => {
    writeContract({
      address: CONTRACTS.DEX_ADDRESS,
      abi: SIMPLE_DEX_ABI,
      functionName: 'swap',
      args: [tokenIn, parseUnits(amountIn, 18), parseUnits(minAmountOut, 18)],
    });
  };

  return { swap, hash, isPending, isConfirming, isSuccess, error };
}

export function useAddLiquidity() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const addLiquidity = (amount0: string, amount1: string, minLiquidity: string) => {
    writeContract({
      address: CONTRACTS.DEX_ADDRESS,
      abi: SIMPLE_DEX_ABI,
      functionName: 'addLiquidity',
      args: [parseUnits(amount0, 18), parseUnits(amount1, 18), parseUnits(minLiquidity, 18)],
    });
  };

  return { addLiquidity, hash, isPending, isConfirming, isSuccess, error };
}

export function useRemoveLiquidity() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const removeLiquidity = (liquidityAmount: string, minAmount0: string, minAmount1: string) => {
    writeContract({
      address: CONTRACTS.DEX_ADDRESS,
      abi: SIMPLE_DEX_ABI,
      functionName: 'removeLiquidity',
      args: [parseUnits(liquidityAmount, 18), parseUnits(minAmount0, 18), parseUnits(minAmount1, 18)],
    });
  };

  return { removeLiquidity, hash, isPending, isConfirming, isSuccess, error };
}
