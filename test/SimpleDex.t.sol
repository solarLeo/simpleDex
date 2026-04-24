// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import { MockERC20 } from "../src/MockERC20.sol";
import { SimpleDex } from "../src/SimpleDex.sol";
import { TestBase } from "./utils/TestBase.sol";

contract SimpleDexTest is TestBase {
    MockERC20 internal tokenA;
    MockERC20 internal tokenB;
    SimpleDex internal dex;

    address internal liquidityProvider = address(0xA11CE);
    address internal secondProvider = address(0xB0B);
    address internal trader = address(0xCAFE);

    uint256 internal constant INITIAL_USER_BALANCE = 1_000_000 ether;
    uint256 internal constant INITIAL_LIQUIDITY = 1_000 ether;

    function setUp() public {
        tokenA = new MockERC20("Token A", "TKA");
        tokenB = new MockERC20("Token B", "TKB");
        dex = new SimpleDex(address(tokenA), address(tokenB));

        tokenA.mint(liquidityProvider, INITIAL_USER_BALANCE);
        tokenB.mint(liquidityProvider, INITIAL_USER_BALANCE);
        tokenA.mint(secondProvider, INITIAL_USER_BALANCE);
        tokenB.mint(secondProvider, INITIAL_USER_BALANCE);
        tokenA.mint(trader, INITIAL_USER_BALANCE);
        tokenB.mint(trader, INITIAL_USER_BALANCE);

        _approveAll(liquidityProvider);
        _approveAll(secondProvider);
        _approveAll(trader);
    }

    function testAddInitialLiquidity() public {
        vm.prank(liquidityProvider);
        (uint256 amount0, uint256 amount1, uint256 liquidityMinted) =
            dex.addLiquidity(INITIAL_LIQUIDITY, INITIAL_LIQUIDITY, INITIAL_LIQUIDITY);

        assertEq(amount0, INITIAL_LIQUIDITY, "amount0 should match");
        assertEq(amount1, INITIAL_LIQUIDITY, "amount1 should match");
        assertEq(liquidityMinted, INITIAL_LIQUIDITY, "liquidity minted should equal sqrt(k)");
        assertEq(dex.totalLiquidity(), INITIAL_LIQUIDITY, "total liquidity mismatch");
        assertEq(dex.liquidityOf(liquidityProvider), INITIAL_LIQUIDITY, "provider shares mismatch");
    }

    function testAddLiquidityUsesPoolRatio() public {
        _seedPool();

        vm.prank(secondProvider);
        (uint256 amount0, uint256 amount1, uint256 liquidityMinted) =
            dex.addLiquidity(400 ether, 500 ether, 400 ether);

        assertEq(amount0, 400 ether, "token0 input should be fully used");
        assertEq(amount1, 400 ether, "token1 should be clipped to pool ratio");
        assertEq(liquidityMinted, 400 ether, "liquidity minted should track ratio");
        assertEq(
            tokenB.balanceOf(secondProvider),
            INITIAL_USER_BALANCE - 400 ether,
            "unused token1 should remain"
        );
    }

    function testRemoveLiquidityReturnsUnderlyingAssets() public {
        _seedPool();

        vm.prank(liquidityProvider);
        (uint256 amount0, uint256 amount1) = dex.removeLiquidity(250 ether, 250 ether, 250 ether);

        assertEq(amount0, 250 ether, "token0 withdrawal mismatch");
        assertEq(amount1, 250 ether, "token1 withdrawal mismatch");
        assertEq(dex.totalLiquidity(), 750 ether, "remaining liquidity mismatch");
        assertEq(
            tokenA.balanceOf(liquidityProvider),
            INITIAL_USER_BALANCE - 750 ether,
            "provider token0 balance mismatch"
        );
    }

    function testSwapToken0ForToken1() public {
        _seedPool();

        uint256 expectedOut = dex.getAmountOut(address(tokenA), 100 ether);

        vm.prank(trader);
        uint256 amountOut = dex.swap(address(tokenA), 100 ether, expectedOut);

        assertEq(amountOut, expectedOut, "swap output mismatch");
        assertEq(
            tokenA.balanceOf(trader),
            INITIAL_USER_BALANCE - 100 ether,
            "token0 trader balance mismatch"
        );
        assertEq(
            tokenB.balanceOf(trader),
            INITIAL_USER_BALANCE + expectedOut,
            "token1 trader balance mismatch"
        );

        (uint256 reserve0, uint256 reserve1) = dex.getReserves();
        assertEq(reserve0, 1_100 ether, "reserve0 mismatch after swap");
        assertEq(reserve1, INITIAL_LIQUIDITY - expectedOut, "reserve1 mismatch after swap");
    }

    function testSwapToken1ForToken0() public {
        _seedPool();

        uint256 expectedOut = dex.getAmountOut(address(tokenB), 100 ether);

        vm.prank(trader);
        uint256 amountOut = dex.swap(address(tokenB), 100 ether, expectedOut);

        assertEq(amountOut, expectedOut, "swap output mismatch");
        assertEq(
            tokenB.balanceOf(trader),
            INITIAL_USER_BALANCE - 100 ether,
            "token1 trader balance mismatch"
        );
        assertEq(
            tokenA.balanceOf(trader),
            INITIAL_USER_BALANCE + expectedOut,
            "token0 trader balance mismatch"
        );
    }

    function testSwapRevertsWhenSlippageIsTooHigh() public {
        _seedPool();

        uint256 expectedOut = dex.getAmountOut(address(tokenA), 100 ether);

        vm.startPrank(trader);
        vm.expectRevert(SimpleDex.SlippageExceeded.selector);
        dex.swap(address(tokenA), 100 ether, expectedOut + 1);
        vm.stopPrank();
    }

    function testGetAmountOutRevertsForUnsupportedToken() public {
        _seedPool();

        vm.expectRevert(SimpleDex.InvalidToken.selector);
        dex.getAmountOut(address(0xDEAD), 1 ether);
    }

    function _seedPool() internal {
        vm.prank(liquidityProvider);
        dex.addLiquidity(INITIAL_LIQUIDITY, INITIAL_LIQUIDITY, INITIAL_LIQUIDITY);
    }

    function _approveAll(address user) internal {
        vm.startPrank(user);
        tokenA.approve(address(dex), type(uint256).max);
        tokenB.approve(address(dex), type(uint256).max);
        vm.stopPrank();
    }
}
