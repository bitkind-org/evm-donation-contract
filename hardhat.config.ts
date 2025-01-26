import { HardhatUserConfig, task, vars } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import "@nomicfoundation/hardhat-verify";

import { donationAbi } from "./donationAbi"
import { parseEther } from "viem";

const ETHERSCAN_API_KEY = vars.get("ETHERSCAN_API_KEY");
const DONATION_CONTRACT_ADDRESS = vars.get("DONATION_CONTRACT_ADDRESS") as `0x${string}`
const DEPLOYER_WALLET_ADDRESS = vars.get("DEPLOYER_WALLET_ADDRESS") as `0x${string}`

task("add-token", "Adds new allowed token to donation contract")
  .addParam("contract", "Token contract address")
  .addParam("symbol", "Token symbol")
  .addParam("decimals", "Token decimals")
  .setAction(async ({ decimals, symbol, contract }, hre) => {
    const walletClient = await hre.viem.getWalletClient(DEPLOYER_WALLET_ADDRESS)
    const publicClient = await hre.viem.getPublicClient()

    // Simulate request and sign tx
    const { request } = await publicClient.simulateContract({
      abi: donationAbi,
      address: DONATION_CONTRACT_ADDRESS,
      account: walletClient.account,
      functionName: 'addToken',
      args: [symbol, decimals, contract],
    })
    await walletClient.writeContract(request)
  });

task("delete-token", "Deletes allowed token from donation contract")
  .addParam("symbol", "Token symbol")
  .setAction(async ({ symbol }, hre) => {
    const walletClient = await hre.viem.getWalletClient(DEPLOYER_WALLET_ADDRESS)
    const publicClient = await hre.viem.getPublicClient()

    // Simulate request and sign tx
    const { request } = await publicClient.simulateContract({
      abi: donationAbi,
      address: DONATION_CONTRACT_ADDRESS,
      account: walletClient.account,
      functionName: 'deleteToken',
      args: [symbol],
    })
    await walletClient.writeContract(request)
  });

task("withdraw-native", "Transfers tips left by users in Ether to a specified address")
  .addParam("to", "Receiver address")
  .addParam("amount", "Amount in ether")
  .setAction(async ({ to, amount }, hre) => {
    const walletClient = await hre.viem.getWalletClient(DEPLOYER_WALLET_ADDRESS)
    const publicClient = await hre.viem.getPublicClient()
    const amountWei = parseEther(amount)

    // Simulate request and sign tx
    const { request } = await publicClient.simulateContract({
      abi: donationAbi,
      address: DONATION_CONTRACT_ADDRESS,
      account: walletClient.account,
      functionName: 'withdrawNativeToken',
      args: [to, amountWei],
    })
    await walletClient.writeContract(request)
  });

task("withdraw-token", "Transfers tips left by users in ERC20 token to a specified address")
  .addParam("symbol", "Token symbol")
  .addParam("to", "Receiver address")
  .addParam("amount", "Amount")
  .setAction(async ({ symbol, to, amount }, hre) => {
    const walletClient = await hre.viem.getWalletClient(DEPLOYER_WALLET_ADDRESS)
    const publicClient = await hre.viem.getPublicClient()
    const amountWei = parseEther(amount)

    // Simulate request and sign tx
    const { request } = await publicClient.simulateContract({
      abi: donationAbi,
      address: DONATION_CONTRACT_ADDRESS,
      account: walletClient.account,
      functionName: 'withdrawToken',
      args: [symbol, to, amountWei],
    })
    await walletClient.writeContract(request)
  });

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  defaultNetwork: "localnet",
  networks: {
    // mainnet: {
    //   url: "https://bsc-dataseed1.binance.org/",
    //   chainId: 56,
    //   gasPrice: "auto",
    //   accounts: [process.env.DEPLOYER_ACCOUNT_KEY || ""]
    // },
    // testnet: {
    //   url: "https://data-seed-prebsc-1-s1.binance.org:8545/",
    //   chainId: 97,
    //   gasPrice: "auto",
    //   accounts: [process.env.DEPLOYER_ACCOUNT_KEY || ""]
    // },
    localnet: {
      chainId: 31337,
      url: "http://127.0.0.1:8545"
    }
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  },
};

export default config;
