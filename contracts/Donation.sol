// SPDX-License-Identifier: GNU-3
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Donation is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Constants
    bytes32 public constant NATIVE = keccak256("NATIVE");

    // Custom Errors
    error InvalidAddress();
    error TokenAlreadyRegistered();
    error TokenNotRegistered();
    error InsufficientBalance();
    error DonationAmountTooLow();
    error ValueDoesNotMatch();
    error TransferFailed();
    error InsufficientAllowance(uint256 required, uint256 available);

    // Storage
    mapping(bytes32 => IERC20) public allowedTokens;

    // Events
    event DonationMade(
        uint256 indexed storyId,
        address indexed receiver,
        address indexed sender,
        bytes32 tokenSymbol,
        uint256 grossAmount,
        uint256 serviceTips
    );

    event TokenAdded(bytes32 indexed symbol, address indexed tokenAddress);
    event TokenRemoved(bytes32 indexed symbol);

    constructor() Ownable(msg.sender) {}

    /// @notice Adds a new token to the list of allowed tokens.
    /// @param symbol The symbol of the token (as bytes32).
    /// @param tokenAddress The address of the token contract.
    function addToken(bytes32 symbol, address tokenAddress) external onlyOwner {
        if (tokenAddress == address(0)) revert InvalidAddress();
        if (allowedTokens[symbol] != IERC20(address(0)))
            revert TokenAlreadyRegistered();

        allowedTokens[symbol] = IERC20(tokenAddress);
        emit TokenAdded(symbol, tokenAddress);
    }

    /// @notice Removes a token from the list of allowed tokens.
    /// @param symbol The symbol of the token (as bytes32).
    function deleteToken(bytes32 symbol) external onlyOwner {
        if (allowedTokens[symbol] == IERC20(address(0)))
            revert TokenNotRegistered();

        emit TokenRemoved(symbol);
        delete allowedTokens[symbol];
    }

    /// @notice Allows users to donate using either native tokens or ERC20 tokens.
    /// @param storyId The ID of the story being donated to.
    /// @param symbol The symbol of the token (as bytes32).
    /// @param receiver The address receiving the donation.
    /// @param amount The amount of tokens to donate.
    /// @param tips The amount of tokens to tip the service.
    function donate(
        uint256 storyId,
        bytes32 symbol,
        address receiver,
        uint256 amount,
        uint256 tips
    ) external payable nonReentrant {
        if (amount == 0) revert DonationAmountTooLow();
        if (receiver == address(0)) revert InvalidAddress();

        if (symbol == NATIVE) {
            uint256 totalDue = amount + tips;
            if (msg.value != totalDue) revert ValueDoesNotMatch();

            // Transfer native tokens
            (bool success, ) = payable(receiver).call{value: amount}("");
            if (!success) revert TransferFailed();
        } else {
            IERC20 token = allowedTokens[symbol];
            if (address(token) == address(0)) revert TokenNotRegistered();

            uint256 totalRequired = amount + tips;
            uint256 currentAllowance = token.allowance(
                msg.sender,
                address(this)
            );
            if (currentAllowance < totalRequired) {
                revert InsufficientAllowance(totalRequired, currentAllowance);
            }

            // Transfer ERC20 tokens
            token.safeTransferFrom(msg.sender, receiver, amount);
            token.safeTransferFrom(msg.sender, address(this), tips);
        }

        emit DonationMade(storyId, receiver, msg.sender, symbol, amount, tips);
    }

    /// @notice Allows the owner to withdraw native tokens from the contract.
    /// @param to The address to withdraw to.
    /// @param amount The amount of native tokens to withdraw.
    function withdrawNativeToken(
        address payable to,
        uint256 amount
    ) external onlyOwner {
        if (to == address(0)) revert InvalidAddress();
        if (address(this).balance < amount) revert InsufficientBalance();

        (bool success, ) = to.call{value: amount}("");
        if (!success) revert TransferFailed();
    }

    /// @notice Allows the owner to withdraw ERC20 tokens from the contract.
    /// @param symbol The symbol of the token (as bytes32).
    /// @param to The address to withdraw to.
    /// @param amount The amount of tokens to withdraw.
    function withdrawToken(
        bytes32 symbol,
        address to,
        uint256 amount
    ) external onlyOwner {
        if (to == address(0)) revert InvalidAddress();

        IERC20 token = allowedTokens[symbol];
        if (address(token) == address(0)) revert TokenNotRegistered();

        if (token.balanceOf(address(this)) < amount)
            revert InsufficientBalance();

        token.safeTransfer(to, amount);
    }

    /// @notice Fallback function to accept native tokens.
    receive() external payable {}
}
