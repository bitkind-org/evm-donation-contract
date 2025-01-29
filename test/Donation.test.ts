import { expect } from "chai";
import {
    Abi,
    keccak256,
    stringToBytes,
    createPublicClient,
    createWalletClient,
    http,
    parseAbiItem,
    parseEther,
    zeroAddress,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { hardhat } from "viem/chains";

import * as DonationJSON from "../artifacts/contracts/Donation.sol/Donation.json";
import * as MockERC20JSON from "../artifacts/contracts/mocks/MockERC20.sol/MockERC20.json";

const OWNER_PRIVATE_KEY = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const ADDR1_PRIVATE_KEY = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
const ADDR2_PRIVATE_KEY = "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a";

// Create a public client for reading chain data, used by all (e.g. for getBalance).
const publicClient = createPublicClient({
    chain: hardhat,
    transport: http("http://127.0.0.1:8545"),
});


// Create wallet clients for each signer
const ownerAccount = privateKeyToAccount(OWNER_PRIVATE_KEY);
const addr1Account = privateKeyToAccount(ADDR1_PRIVATE_KEY);
const addr2Account = privateKeyToAccount(ADDR2_PRIVATE_KEY);

// viem wallet clients
const ownerClient = createWalletClient({
    account: ownerAccount,
    chain: hardhat,
    transport: http("http://127.0.0.1:8545"),
});
const addr1Client = createWalletClient({
    account: addr1Account,
    chain: hardhat,
    transport: http("http://127.0.0.1:8545"),
});
const addr2Client = createWalletClient({
    account: addr2Account,
    chain: hardhat,
    transport: http("http://127.0.0.1:8545"),
});

describe("Donation Contract (viem test)", function () {
    // Contract addresses
    let donationAddress: `0x${string}`;
    let mockTokenAddress: `0x${string}`;

    // ABIs parsed by viem
    const donationAbi = DonationJSON.abi as Abi;
    const mockErc20Abi = MockERC20JSON.abi as Abi;

    // Bytecodes
    const donationBytecode = DonationJSON.bytecode as `0x${string}`;
    const mockErc20Bytecode = MockERC20JSON.bytecode as `0x${string}`;

    // Constants
    const NATIVE = keccak256(stringToBytes("NATIVE"));
    const TOKEN_SYMBOL = keccak256(stringToBytes("TEST"));

    before(async () => {
        // 1. Deploy MockERC20
        const mockERC20TxHash = await ownerClient.deployContract({
            chain: hardhat,
            account: ownerAccount.address,
            abi: mockErc20Abi,
            bytecode: mockErc20Bytecode,
            args: ["Mock Token", "MCK", BigInt(999_000_000) * BigInt(10 ** 18)], // constructor params for MockERC20
        });
        const erc20Receipt = await publicClient.waitForTransactionReceipt({ hash: mockERC20TxHash });
        expect(erc20Receipt.status).to.equal("success");
        mockTokenAddress = erc20Receipt.contractAddress!;

        // 2. Deploy Donation
        const donationTxHash = await ownerClient.deployContract({
            chain: hardhat,
            account: ownerAccount.address,
            abi: donationAbi,
            bytecode: donationBytecode,
            args: [], // constructor param: initial owner
        });
        const donationReceipt = await publicClient.waitForTransactionReceipt({ hash: donationTxHash });
        expect(donationReceipt.status).to.equal("success");
        donationAddress = donationReceipt.contractAddress!;
    });

    describe("Deployment", () => {
        it("Should set the owner correctly", async () => {
            const owner = (await publicClient.readContract({
                address: donationAddress,
                abi: donationAbi,
                functionName: "owner",
            })) as `0x${string}`;
            expect(owner).to.equal(
                (await ownerClient.account?.address) // The owner in our test is the 1st account
            );
        });
    });

    describe("Token Management", () => {
        it("Should add a token successfully", async () => {
            // call addToken
            const txHash = await ownerClient.writeContract({
                address: donationAddress,
                abi: donationAbi,
                functionName: "addToken",
                args: [TOKEN_SYMBOL, mockTokenAddress],
                account: ownerAccount,
            });
            await publicClient.waitForTransactionReceipt({ hash: txHash });

            // Check that allowedTokens(TOKEN_SYMBOL) == mockTokenAddress
            const storedToken = (await publicClient.readContract({
                address: donationAddress,
                abi: donationAbi,
                functionName: "allowedTokens",
                args: [TOKEN_SYMBOL],
            })) as `0x${string}`;
            expect(storedToken).to.equal(mockTokenAddress);
        });

        it("Should revert when adding a token with invalid address", async () => {
            const addTokenFn = parseAbiItem(
                "function addToken(bytes32, address) external"
            );
            let errorCaught = false;
            try {
                const txHash = await ownerClient.writeContract({
                    address: donationAddress,
                    abi: donationAbi,
                    functionName: addTokenFn.name,
                    args: [
                        // Some new symbol, e.g. "INVALID"
                        "0x" + Buffer.from("INVALID", "utf-8").toString("hex").padEnd(64, "0"),
                        zeroAddress,
                    ],
                });
                await publicClient.waitForTransactionReceipt({ hash: txHash });
            } catch (error: any) {
                errorCaught = true;
                // viem includes error data, can do an assertion on error.shortMessage, etc.
                expect(error.shortMessage).to.contain("InvalidAddress");
            }
            expect(errorCaught).to.be.true;
        });

        it("Should revert when adding a token that is already registered", async () => {
            let errorCaught = false;
            try {
                const txHash = await ownerClient.writeContract({
                    address: donationAddress,
                    abi: donationAbi,
                    functionName: "addToken",
                    args: [TOKEN_SYMBOL, mockTokenAddress],
                });
                await publicClient.waitForTransactionReceipt({ hash: txHash });
            } catch (error: any) {
                errorCaught = true;
                expect(error.shortMessage).to.contain("TokenAlreadyRegistered");
            }
            expect(errorCaught).to.be.true;
        });

        it("Should remove a token successfully", async () => {
            // deleteToken
            const txHash = await ownerClient.writeContract({
                address: donationAddress,
                abi: donationAbi,
                functionName: "deleteToken",
                args: [TOKEN_SYMBOL],
            });
            await publicClient.waitForTransactionReceipt({ hash: txHash });

            const storedToken = (await publicClient.readContract({
                address: donationAddress,
                abi: donationAbi,
                functionName: "allowedTokens",
                args: [TOKEN_SYMBOL],
            })) as `0x${string}`;
            expect(storedToken).to.equal(zeroAddress);
        });

        it("Should revert when removing a token that is not registered", async () => {
            let errorCaught = false;
            try {
                const txHash = await ownerClient.writeContract({
                    address: donationAddress,
                    abi: donationAbi,
                    functionName: "deleteToken",
                    args: [TOKEN_SYMBOL],
                });
                await publicClient.waitForTransactionReceipt({ hash: txHash });
            } catch (error: any) {
                errorCaught = true;
                expect(error.shortMessage).to.contain("TokenNotRegistered");
            }
            expect(errorCaught).to.be.true;
        });
    });

    describe("Donations", () => {
        before(async () => {
            // Re-add the token so we can donate with it
            await ownerClient.writeContract({
                address: donationAddress,
                abi: donationAbi,
                functionName: "addToken",
                args: [TOKEN_SYMBOL, mockTokenAddress],
            });
        });

        it("Should revert if donation amount is 0", async () => {
            let errorCaught = false;
            try {
                const txHash = await addr1Client.writeContract({
                    address: donationAddress,
                    abi: donationAbi,
                    functionName: "donate",
                    // donate(uint256 storyId, bytes32 symbol, address receiver, uint256 amount, uint256 tips)
                    args: [
                        123,
                        NATIVE,
                        await addr2Client.account?.address,
                        0,
                        0,
                    ],
                    // no value here because tips + amount = 0
                });
                await publicClient.waitForTransactionReceipt({ hash: txHash });
            } catch (error: any) {
                errorCaught = true;
                expect(error.shortMessage).to.contain("DonationAmountTooLow");
            }
            expect(errorCaught).to.be.true;
        });

        it("Should revert if receiver is zero address", async () => {
            let errorCaught = false;
            try {
                const txHash = await addr1Client.writeContract({
                    address: donationAddress,
                    abi: donationAbi,
                    functionName: "donate",
                    args: [456, NATIVE, zeroAddress, parseEther("1"), parseEther("0.1")],
                    // Provide enough value
                    value: parseEther("1.1"),
                });
                await publicClient.waitForTransactionReceipt({ hash: txHash });
            } catch (error: any) {
                errorCaught = true;
                expect(error.shortMessage).to.contain("InvalidAddress");
            }
            expect(errorCaught).to.be.true;
        });

        it("Should donate native tokens successfully", async () => {
            const receiverBalanceBefore = await publicClient.getBalance({
                address: addr2Client.account?.address as `0x${string}`,
            });

            // Donate 1 + 0.1 tips
            const txHash = await addr1Client.writeContract({
                address: donationAddress,
                abi: donationAbi,
                functionName: "donate",
                args: [
                    123,
                    NATIVE,
                    addr2Client.account?.address,
                    parseEther("1"),
                    parseEther("0.1"),
                ],
                value: parseEther("1.1"),
            });
            await publicClient.waitForTransactionReceipt({ hash: txHash });

            const receiverBalanceAfter = await publicClient.getBalance({
                address: addr2Client.account?.address as `0x${string}`,
            });

            // The difference should be exactly 1 ETH. 
            // (The receiver doesn't pay gas for receiving ETH.)
            expect(receiverBalanceAfter - receiverBalanceBefore).to.equal(
                Number(parseEther("1"))
            );
        });

        it("Should revert if msg.value does not match amount+tips for native donation", async () => {
            let errorCaught = false;
            try {
                const txHash = await addr1Client.writeContract({
                    address: donationAddress,
                    abi: donationAbi,
                    functionName: "donate",
                    args: [
                        123,
                        NATIVE,
                        addr2Client.account?.address,
                        parseEther("1"),
                        parseEther("0.1"),
                    ],
                    // This is only 1 ETH total, but needed 1.1
                    value: parseEther("1"),
                });
                await publicClient.waitForTransactionReceipt({ hash: txHash });
            } catch (error: any) {
                errorCaught = true;
                expect(error.shortMessage).to.contain("ValueDoesNotMatch");
            }
            expect(errorCaught).to.be.true;
        });

        it("Should revert for ERC20 donation if token is not registered", async () => {
            const nonRegisteredSymbol = "0x" + Buffer.from("FAKE", "utf-8").toString("hex").padEnd(64, "0");
            let errorCaught = false;
            try {
                const txHash = await addr1Client.writeContract({
                    address: donationAddress,
                    abi: donationAbi,
                    functionName: "donate",
                    args: [999, nonRegisteredSymbol, addr2Client.account?.address, 100, 10],
                });
                await publicClient.waitForTransactionReceipt({ hash: txHash });
            } catch (error: any) {
                errorCaught = true;
                expect(error.shortMessage).to.contain("TokenNotRegistered");
            }
            expect(errorCaught).to.be.true;
        });

        it("Should revert for ERC20 donation if allowance is insufficient", async () => {
            // Approve only 50 tokens but require 110
            const approveFn = parseAbiItem(
                "function approve(address spender, uint256 amount) external returns (bool)"
            );

            // 1) Approve 50
            const txHashApprove = await addr1Client.writeContract({
                address: mockTokenAddress,
                abi: mockErc20Abi,
                functionName: approveFn.name,
                args: [donationAddress, 50],
            });
            await publicClient.waitForTransactionReceipt({ hash: txHashApprove });

            // 2) Attempt to donate 100 + 10 tips
            let errorCaught = false;
            try {
                const txHashDonate = await addr1Client.writeContract({
                    address: donationAddress,
                    abi: donationAbi,
                    functionName: "donate",
                    args: [321, TOKEN_SYMBOL, addr2Client.account?.address, 100, 10],
                });
                await publicClient.waitForTransactionReceipt({ hash: txHashDonate });
            } catch (error: any) {
                errorCaught = true;
                expect(error.shortMessage).to.contain("InsufficientAllowance");
            }
            expect(errorCaught).to.be.true;
        });

        it("Should donate ERC20 tokens successfully", async () => {
            // 1) Mint tokens to addr1
            const mintFn = parseAbiItem("function mint(address to, uint256 amount) external");
            const mintTxHash = await ownerClient.writeContract({
                address: mockTokenAddress,
                abi: mockErc20Abi,
                functionName: mintFn.name,
                args: [addr1Client.account?.address, 10000n],
            });
            await publicClient.waitForTransactionReceipt({ hash: mintTxHash });

            // 2) Approve enough tokens
            const approveTx = await addr1Client.writeContract({
                address: mockTokenAddress,
                abi: mockErc20Abi,
                functionName: "approve",
                args: [donationAddress, 10000n],
            });
            await publicClient.waitForTransactionReceipt({ hash: approveTx });

            // 3) Check balances before
            const receiverBalBefore = (await publicClient.readContract({
                address: mockTokenAddress,
                abi: mockErc20Abi,
                functionName: "balanceOf",
                args: [addr2Client.account?.address],
            })) as bigint;

            const contractBalBefore = (await publicClient.readContract({
                address: mockTokenAddress,
                abi: mockErc20Abi,
                functionName: "balanceOf",
                args: [donationAddress],
            })) as bigint;

            // 4) Donate
            const donationAmount = 200n;
            const tipsAmount = 50n;
            const donateTx = await addr1Client.writeContract({
                address: donationAddress,
                abi: donationAbi,
                functionName: "donate",
                args: [999, TOKEN_SYMBOL, addr2Client.account?.address, donationAmount, tipsAmount],
            });
            await publicClient.waitForTransactionReceipt({ hash: donateTx });

            // 5) Check balances after
            const receiverBalAfter = (await publicClient.readContract({
                address: mockTokenAddress,
                abi: mockErc20Abi,
                functionName: "balanceOf",
                args: [addr2Client.account?.address],
            })) as bigint;

            const contractBalAfter = (await publicClient.readContract({
                address: mockTokenAddress,
                abi: mockErc20Abi,
                functionName: "balanceOf",
                args: [donationAddress],
            })) as bigint;

            expect(receiverBalAfter - receiverBalBefore).to.equal(donationAmount);
            expect(contractBalAfter - contractBalBefore).to.equal(tipsAmount);
        });
    });

    describe("Withdrawals", () => {
        it("Should revert if withdrawNativeToken target is zero address", async () => {
            let errorCaught = false;
            try {
                const txHash = await ownerClient.writeContract({
                    address: donationAddress,
                    abi: donationAbi,
                    functionName: "withdrawNativeToken",
                    args: [zeroAddress, parseEther("1")],
                });
                await publicClient.waitForTransactionReceipt({ hash: txHash });
            } catch (error: any) {
                errorCaught = true;
                expect(error.shortMessage).to.contain("InvalidAddress");
            }
            expect(errorCaught).to.be.true;
        });

        it("Should revert if contract doesn't have enough native tokens", async () => {
            let errorCaught = false;
            try {
                const txHash = await ownerClient.writeContract({
                    address: donationAddress,
                    abi: donationAbi,
                    functionName: "withdrawNativeToken",
                    args: [ownerClient.account?.address, parseEther("9999")],
                });
                await publicClient.waitForTransactionReceipt({ hash: txHash });
            } catch (error: any) {
                errorCaught = true;
                expect(error.shortMessage).to.contain("InsufficientBalance");
            }
            expect(errorCaught).to.be.true;
        });

        it("Should withdraw native tokens successfully", async () => {
            // 1) Send some ETH to contract
            const contractBalBefore = await publicClient.getBalance({
                address: donationAddress,
            });
            const txHash = await addr1Client.sendTransaction({
                to: donationAddress,
                value: parseEther("0.5"),
            });
            await publicClient.waitForTransactionReceipt({ hash: txHash });

            const contractBalAfter = await publicClient.getBalance({
                address: donationAddress,
            });
            expect(contractBalAfter - contractBalBefore).to.equal(Number(parseEther("0.5")));

            // 2) Withdraw by owner
            const ownerBalBefore = await publicClient.getBalance({
                address: ownerClient.account?.address as `0x${string}`,
            });

            const withdrawTx = await ownerClient.writeContract({
                address: donationAddress,
                abi: donationAbi,
                functionName: "withdrawNativeToken",
                args: [ownerClient.account?.address, parseEther("0.5")],
            });
            // The transaction receipt
            const withdrawReceipt = await publicClient.waitForTransactionReceipt({ hash: withdrawTx });

            // Evaluate final balance
            const ownerBalAfter = await publicClient.getBalance({
                address: ownerClient.account?.address as `0x${string}`,
            });
            // Gas used
            const gasUsed = withdrawReceipt.gasUsed * (withdrawReceipt.effectiveGasPrice || 0n);
            // The difference in the owner's balance, ignoring gas cost, is 0.5 ETH
            expect(ownerBalAfter + gasUsed - ownerBalBefore).to.equal(Number(parseEther("0.5")));
        });

        it("Should revert if withdrawToken target is zero address", async () => {
            let errorCaught = false;
            try {
                const txHash = await ownerClient.writeContract({
                    address: donationAddress,
                    abi: donationAbi,
                    functionName: "withdrawToken",
                    args: [TOKEN_SYMBOL, zeroAddress, 10],
                });
                await publicClient.waitForTransactionReceipt({ hash: txHash });
            } catch (error: any) {
                errorCaught = true;
                expect(error.shortMessage).to.contain("InvalidAddress");
            }
            expect(errorCaught).to.be.true;
        });

        it("Should revert if token is not registered", async () => {
            const nonRegisteredSymbol = "0x" + Buffer.from("FAKE", "utf-8").toString("hex").padEnd(64, "0");
            let errorCaught = false;
            try {
                const txHash = await ownerClient.writeContract({
                    address: donationAddress,
                    abi: donationAbi,
                    functionName: "withdrawToken",
                    args: [nonRegisteredSymbol, ownerClient.account?.address, 10],
                });
                await publicClient.waitForTransactionReceipt({ hash: txHash });
            } catch (error: any) {
                errorCaught = true;
                expect(error.shortMessage).to.contain("TokenNotRegistered");
            }
            expect(errorCaught).to.be.true;
        });

        it("Should revert if contract doesn't have enough ERC20 tokens", async () => {
            // Try to withdraw more than the contract has
            const contractBal = (await publicClient.readContract({
                address: mockTokenAddress,
                abi: mockErc20Abi,
                functionName: "balanceOf",
                args: [donationAddress],
            })) as bigint;

            let errorCaught = false;
            try {
                const txHash = await ownerClient.writeContract({
                    address: donationAddress,
                    abi: donationAbi,
                    functionName: "withdrawToken",
                    args: [TOKEN_SYMBOL, ownerClient.account?.address, contractBal + 1n],
                });
                await publicClient.waitForTransactionReceipt({ hash: txHash });
            } catch (error: any) {
                errorCaught = true;
                expect(error.shortMessage).to.contain("InsufficientBalance");
            }
            expect(errorCaught).to.be.true;
        });

        it("Should withdraw ERC20 tokens successfully", async () => {
            // Let's see how many tokens the contract has:
            const contractBalBefore = (await publicClient.readContract({
                address: mockTokenAddress,
                abi: mockErc20Abi,
                functionName: "balanceOf",
                args: [donationAddress],
            })) as bigint;

            const ownerBalBefore = (await publicClient.readContract({
                address: mockTokenAddress,
                abi: mockErc20Abi,
                functionName: "balanceOf",
                args: [ownerClient.account?.address],
            })) as bigint;

            // We'll withdraw 50
            const withdrawAmount = 50n;
            const txHash = await ownerClient.writeContract({
                address: donationAddress,
                abi: donationAbi,
                functionName: "withdrawToken",
                args: [TOKEN_SYMBOL, ownerClient.account?.address, withdrawAmount],
            });
            await publicClient.waitForTransactionReceipt({ hash: txHash });

            const contractBalAfter = (await publicClient.readContract({
                address: mockTokenAddress,
                abi: mockErc20Abi,
                functionName: "balanceOf",
                args: [donationAddress],
            })) as bigint;

            const ownerBalAfter = (await publicClient.readContract({
                address: mockTokenAddress,
                abi: mockErc20Abi,
                functionName: "balanceOf",
                args: [ownerClient.account?.address],
            })) as bigint;

            expect(contractBalBefore - contractBalAfter).to.equal(withdrawAmount);
            expect(ownerBalAfter - ownerBalBefore).to.equal(withdrawAmount);
        });
    });
});
