// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

interface Vm {
    function prank(address msgSender) external;

    function startPrank(address msgSender) external;

    function stopPrank() external;

    function expectRevert(bytes4 revertData) external;

    function envUint(string calldata key) external view returns (uint256);

    function envOr(string calldata key, uint256 defaultValue) external view returns (uint256);

    function addr(uint256 privateKey) external pure returns (address);

    function startBroadcast(uint256 privateKey) external;

    function stopBroadcast() external;
}

abstract contract FoundryBase {
    Vm internal constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));
}
