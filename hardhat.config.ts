import { HardhatUserConfig, task, vars } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import "@nomicfoundation/hardhat-verify";

import { donationAbi } from "./donationAbi"

const ETHERSCAN_API_KEY = vars.get("ETHERSCAN_API_KEY");

task("add-token", "Adds new allowed token to donation contract")
.addParam("contract", "Token contract address")
  .addParam("symbol", "Token symbol")
  .addParam("decimals", "Token decimals")
  .addParam("address", "Address of donation smart contract")
  .setAction(async ({ address, decimals, symbol, contract }, hre) => {
    const walletClient = await hre.viem.getWalletClient("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")
    const publicClient = await hre.viem.getPublicClient()

    // Simulate request and sign tx
    const { request } = await publicClient.simulateContract({
      address,
      abi: donationAbi,
      account: walletClient.account,
      functionName: 'addToken',
      args: [symbol, decimals, contract],
    })
    await walletClient.writeContract(request)
  });

task("delete-token", "Deletes allowed token from donation contract")
  .addParam("symbol", "Token symbol")
  .addParam("address", "Address of donation smart contract")
  .setAction(async ({ symbol, address }, hre) => {
    const walletClient = await hre.viem.getWalletClient("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")
    const publicClient = await hre.viem.getPublicClient()

    // Simulate request and sign tx
    const { request } = await publicClient.simulateContract({
      abi: donationAbi,
      account: walletClient.account,
      address: address,
      functionName: 'deleteToken',
      args: [symbol],
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
      url: "http://192.168.50.43:8545"
    }
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  },
};

export default config;
