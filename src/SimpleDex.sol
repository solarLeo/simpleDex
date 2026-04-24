// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import { IERC20Minimal } from "./interfaces/IERC20Minimal.sol";

contract SimpleDex {
    error InvalidToken();
    error InvalidTokenPair();
    error PoolNotInitialized();
    error SlippageExceeded();
    error TransferFailed();
    error ZeroAmount();
    error InsufficientLiquidity();

    uint256 public constant FEE_NUMERATOR = 997;
    uint256 public constant FEE_DENOMINATOR = 1000;

    address public immutable token0;
    address public immutable token1;

    uint256 public reserve0;
    uint256 public reserve1;
    uint256 public totalLiquidity;

    mapping(address provider => uint256 shares) public liquidityOf;

    uint256 private unlocked = 1;

    event LiquidityAdded(
        address indexed provider, uint256 amount0, uint256 amount1, uint256 liquidityMinted
    );
    event LiquidityRemoved(
        address indexed provider, uint256 amount0, uint256 amount1, uint256 liquidityBurned
    );
    event Swap(
        address indexed trader,
        address indexed tokenIn,
        uint256 amountIn,
        address indexed tokenOut,
        uint256 amountOut
    );

    modifier nonReentrant() {
        require(unlocked == 1, "REENTRANT");
        unlocked = 2;
        _;
        unlocked = 1;
    }

    constructor(address _token0, address _token1) {
        if (_token0 == address(0) || _token1 == address(0) || _token0 == _token1) {
            revert InvalidTokenPair();
        }

        token0 = _token0;
        token1 = _token1;
    }

    function getReserves() external view returns (uint256, uint256) {
        return (reserve0, reserve1);
    }

    function previewAddLiquidity(uint256 amount0Desired, uint256 amount1Desired)
        public
        view
        returns (uint256 amount0, uint256 amount1, uint256 liquidityMinted)
    {
        if (amount0Desired == 0 || amount1Desired == 0) revert ZeroAmount();

        if (totalLiquidity == 0) {
            amount0 = amount0Desired;
            amount1 = amount1Desired;
            liquidityMinted = _sqrt(amount0Desired * amount1Desired);
            if (liquidityMinted == 0) revert InsufficientLiquidity();
            return (amount0, amount1, liquidityMinted);
        }

        uint256 liquidityFromToken0 = (amount0Desired * totalLiquidity) / reserve0;
        uint256 liquidityFromToken1 = (amount1Desired * totalLiquidity) / reserve1;

        liquidityMinted = _min(liquidityFromToken0, liquidityFromToken1);
        if (liquidityMinted == 0) revert InsufficientLiquidity();

        amount0 = (liquidityMinted * reserve0) / totalLiquidity;
        amount1 = (liquidityMinted * reserve1) / totalLiquidity;
    }

    function addLiquidity(uint256 amount0Desired, uint256 amount1Desired, uint256 minLiquidity)
        external
        nonReentrant
        returns (uint256 amount0, uint256 amount1, uint256 liquidityMinted)
    {
        (amount0, amount1, liquidityMinted) = previewAddLiquidity(amount0Desired, amount1Desired);

        if (liquidityMinted < minLiquidity) revert SlippageExceeded();

        _safeTransferFrom(token0, msg.sender, address(this), amount0);
        _safeTransferFrom(token1, msg.sender, address(this), amount1);

        reserve0 += amount0;
        reserve1 += amount1;
        totalLiquidity += liquidityMinted;
        liquidityOf[msg.sender] += liquidityMinted;

        emit LiquidityAdded(msg.sender, amount0, amount1, liquidityMinted);
    }

    function previewRemoveLiquidity(uint256 liquidityAmount)
        public
        view
        returns (uint256 amount0, uint256 amount1)
    {
        if (liquidityAmount == 0) revert ZeroAmount();
        if (liquidityAmount > liquidityOf[msg.sender] || totalLiquidity == 0) {
            revert InsufficientLiquidity();
        }

        amount0 = (liquidityAmount * reserve0) / totalLiquidity;
        amount1 = (liquidityAmount * reserve1) / totalLiquidity;
    }

    function removeLiquidity(uint256 liquidityAmount, uint256 minAmount0, uint256 minAmount1)
        external
        nonReentrant
        returns (uint256 amount0, uint256 amount1)
    {
        (amount0, amount1) = previewRemoveLiquidity(liquidityAmount);

        if (amount0 < minAmount0 || amount1 < minAmount1) revert SlippageExceeded();

        liquidityOf[msg.sender] -= liquidityAmount;
        totalLiquidity -= liquidityAmount;
        reserve0 -= amount0;
        reserve1 -= amount1;

        _safeTransfer(token0, msg.sender, amount0);
        _safeTransfer(token1, msg.sender, amount1);

        emit LiquidityRemoved(msg.sender, amount0, amount1, liquidityAmount);
    }

    function getAmountOut(address tokenIn, uint256 amountIn)
        public
        view
        returns (uint256 amountOut)
    {
        if (amountIn == 0) revert ZeroAmount();
        if (totalLiquidity == 0) revert PoolNotInitialized();

        (uint256 reserveIn, uint256 reserveOut) = _getSwapReserves(tokenIn);

        uint256 amountInWithFee = amountIn * FEE_NUMERATOR;
        amountOut =
            (reserveOut * amountInWithFee) / ((reserveIn * FEE_DENOMINATOR) + amountInWithFee);

        if (amountOut == 0 || amountOut >= reserveOut) revert InsufficientLiquidity();
    }

    function swap(address tokenIn, uint256 amountIn, uint256 minAmountOut)
        external
        nonReentrant
        returns (uint256 amountOut)
    {
        amountOut = getAmountOut(tokenIn, amountIn);
        if (amountOut < minAmountOut) revert SlippageExceeded();

        bool zeroForOne = tokenIn == token0;
        address tokenOut = zeroForOne ? token1 : token0;

        _safeTransferFrom(tokenIn, msg.sender, address(this), amountIn);
        _safeTransfer(tokenOut, msg.sender, amountOut);

        if (zeroForOne) {
            reserve0 += amountIn;
            reserve1 -= amountOut;
        } else {
            reserve1 += amountIn;
            reserve0 -= amountOut;
        }

        emit Swap(msg.sender, tokenIn, amountIn, tokenOut, amountOut);
    }

    function _getSwapReserves(address tokenIn)
        internal
        view
        returns (uint256 reserveIn, uint256 reserveOut)
    {
        if (tokenIn == token0) {
            return (reserve0, reserve1);
        }

        if (tokenIn == token1) {
            return (reserve1, reserve0);
        }

        revert InvalidToken();
    }

    function _safeTransfer(address token, address to, uint256 amount) internal {
        (bool success, bytes memory data) =
            token.call(abi.encodeWithSelector(IERC20Minimal.transfer.selector, to, amount));

        if (!success || (data.length != 0 && !abi.decode(data, (bool)))) {
            revert TransferFailed();
        }
    }

    function _safeTransferFrom(address token, address from, address to, uint256 amount) internal {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(IERC20Minimal.transferFrom.selector, from, to, amount)
        );

        if (!success || (data.length != 0 && !abi.decode(data, (bool)))) {
            revert TransferFailed();
        }
    }

    function _sqrt(uint256 x) internal pure returns (uint256 y) {
        if (x == 0) return 0;

        uint256 z = (x + 1) / 2;
        y = x;

        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
    }

    function _min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }
}
