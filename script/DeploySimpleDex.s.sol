// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import { MockERC20 } from "../src/MockERC20.sol";
import { SimpleDex } from "../src/SimpleDex.sol";
import { FoundryBase } from "../src/utils/FoundryVm.sol";

contract DeploySimpleDex is FoundryBase {
    uint256 internal constant DEFAULT_INITIAL_SUPPLY = 1_000_000 ether;
    uint256 internal constant DEFAULT_INITIAL_LIQUIDITY = 100_000 ether;

    function run() external {
        uint256 privateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(privateKey);
        uint256 initialSupply = vm.envOr("INITIAL_SUPPLY", DEFAULT_INITIAL_SUPPLY);
        uint256 initialLiquidity0 = vm.envOr("INITIAL_LIQUIDITY0", DEFAULT_INITIAL_LIQUIDITY);
        uint256 initialLiquidity1 = vm.envOr("INITIAL_LIQUIDITY1", DEFAULT_INITIAL_LIQUIDITY);

        vm.startBroadcast(privateKey);

        MockERC20 tokenA = new MockERC20("Demo Token A", "DTA");
        MockERC20 tokenB = new MockERC20("Demo Token B", "DTB");
        SimpleDex dex = new SimpleDex(address(tokenA), address(tokenB));

        tokenA.mint(deployer, initialSupply);
        tokenB.mint(deployer, initialSupply);
        tokenA.approve(address(dex), initialLiquidity0);
        tokenB.approve(address(dex), initialLiquidity1);
        dex.addLiquidity(initialLiquidity0, initialLiquidity1, 1);

        vm.stopBroadcast();
    }
}
