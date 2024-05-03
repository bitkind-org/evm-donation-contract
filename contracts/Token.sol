// SPDX-License-Identifier: GNU-3
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20 {
    constructor(uint256 initialSupply) ERC20("BitKind", "BTK") {
        _mint(msg.sender, initialSupply);
    }
}
