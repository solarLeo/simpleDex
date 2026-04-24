// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import { FoundryBase } from "../../src/utils/FoundryVm.sol";

abstract contract TestBase is FoundryBase {
    function assertEq(uint256 left, uint256 right, string memory message) internal pure {
        require(left == right, message);
    }

    function assertEq(address left, address right, string memory message) internal pure {
        require(left == right, message);
    }

    function assertTrue(bool condition, string memory message) internal pure {
        require(condition, message);
    }
}
