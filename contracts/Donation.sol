// SPDX-License-Identifier: GNU-3
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract Donation is Ownable {
    struct TokenInfo {
        IERC20 token;
        uint256 decimals;
        uint256 feePercentage;
    }

    uint256 public constant MAX_FEE_PERCENTAGE = 10;

    mapping(string => TokenInfo) public tokens;
    uint256 public nativeFeePercentage = 0;

    event DonationMade(
        uint256 indexed storyId,
        address indexed receiver,
        address indexed sender,
        string tokenSymbol,
        uint256 grossAmount,
        uint256 netAmount,
        uint256 serviceFee,
        uint256 serviceTips
    );

    constructor() Ownable(msg.sender) {}

    function addToken(
        string memory symbol,
        uint256 decimals,
        address tokenAddress,
        uint256 feePercentage
    ) external onlyOwner {
        require(
            tokenAddress != address(0),
            "Token address cannot be the zero address"
        );
        require(
            feePercentage >= 0 && feePercentage <= MAX_FEE_PERCENTAGE,
            "The service fee cannot be less than zero or exceed 10%"
        );
        tokens[symbol] = TokenInfo(
            IERC20(tokenAddress),
            decimals,
            feePercentage
        );
    }

    function deleteToken(
        string memory symbol
    ) external onlyOwner {
        TokenInfo storage token = tokens[symbol];
        require(
            token.token != IERC20(address(0)),
            "Token not registered"
        );
        delete tokens[symbol];
    }

    function donate(
        uint256 storyId,
        string memory symbol,
        address receiver,
        uint256 amount,
        uint256 tips
    ) external payable {
        require(amount > 0, "Donation amount must be positive");
        require(receiver != address(0), "Receiver cannot be the zero address");

        uint256 amountToReceiver = 0;
        uint256 serviveFee = 0;

        // Donation using the native blockchain currency (ETH/BNB)
        if (keccak256(bytes(symbol)) == keccak256(bytes("NATIVE"))) {
            uint256 totalTransactionAmount = amount + tips;
            require(
                msg.value == totalTransactionAmount,
                "NATIVE value sent does not match the specified amount"
            );

            serviveFee = (amount * nativeFeePercentage) / 100;
            uint256 totalDeductions = serviveFee + tips;
            require(
                amount > totalDeductions,
                "Total transaction amount is too low after including tips"
            );

            amountToReceiver = amount - serviveFee;
            (bool sent, ) = receiver.call{value: amountToReceiver}("");
            require(sent, "Failed to send NATIVE");
        } else {
            // ERC20 token donation
            TokenInfo storage token = tokens[symbol];
            require(token.token != IERC20(address(0)), "Token not registered");

            serviveFee = (amount * token.feePercentage) / 100;
            uint256 totalDeductions = serviveFee + tips;
            require(amount > totalDeductions, "Donation amount is too low");

            amountToReceiver = amount - serviveFee;

            // Trensfer tokens
            require(
                token.token.transferFrom(
                    msg.sender,
                    address(this),
                    totalDeductions
                ),
                "Failed to transfer fees and tips"
            );
            require(
                token.token.transferFrom(
                    msg.sender,
                    receiver,
                    amountToReceiver
                ),
                "Failed to transfer amount to receiver"
            );
        }

        // Send donation made event
        emit DonationMade(
            storyId,
            receiver,
            msg.sender,
            symbol,
            amount,
            amountToReceiver,
            serviveFee,
            tips
        );
    }

    function setFeeRateForNative(uint256 newFeePercentage) external onlyOwner {
        require(
            newFeePercentage >= 0 && newFeePercentage <= MAX_FEE_PERCENTAGE,
            "The service fee cannot be less than zero or exceed 10%"
        );
        nativeFeePercentage = newFeePercentage;
    }

    function setFeeRateForToken(
        string memory symbol,
        uint256 newFeePercentage
    ) external onlyOwner {
        TokenInfo storage token = tokens[symbol];
        require(
            token.token != IERC20(address(0)),
            "Token not registered"
        );
        require(
            newFeePercentage >= 0 && newFeePercentage <= MAX_FEE_PERCENTAGE,
            "The service fee cannot be less than zero or exceed 10%"
        );
        tokens[symbol].feePercentage = newFeePercentage;
    }

    function withdrawNativeToken(
        address payable to,
        uint256 amount
    ) external onlyOwner {
        require(address(this).balance >= amount, "Insufficient balance");
        (bool sent, ) = to.call{value: amount}("");
        require(sent, "Failed to send Ether");
    }

    function withdrawToken(
        string memory symbol,
        address to,
        uint256 amount
    ) external onlyOwner {
        TokenInfo storage token = tokens[symbol];
        require(
            token.token.balanceOf(address(this)) >= amount,
            "Insufficient token balance"
        );

        require(token.token.transfer(to, amount), "Failed to transfer token");
    }
}
