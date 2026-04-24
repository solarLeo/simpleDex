pragma solidity ^0.8.20;  // 编译器版本声明




contract SimpleContract {
    address public owner;
    uint256 public counter;


    event ValueChanged(address indexed changer, uint256 newValue);
}