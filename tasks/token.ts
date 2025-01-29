import { task, vars } from "hardhat/config";
import { keccak256, stringToBytes, Abi } from "viem";
import { privateKeyToAccount } from 'viem/accounts'
import * as DonationJSON from "../artifacts/contracts/Donation.sol/Donation.json";
import { DEPLOYER_PRIVATE_KEY } from "../hardhat.config";

const donationAbi = DonationJSON.abi as Abi;

const DONATION_CONTRACT_ADDRESS = vars.get("DONATION_CONTRACT_ADDRESS") as `0x${string}`

task("add-token", "Adds new allowed token to donation contract")
  .addParam("contract", "Token contract address")
  .addParam("symbol", "Token symbol")
  .setAction(async ({ symbol, contract }, hre) => {
    const account = privateKeyToAccount(DEPLOYER_PRIVATE_KEY) 
    const walletClient = await hre.viem.getWalletClient(account.address)
    const publicClient = await hre.viem.getPublicClient()

    const hashedSymbol = keccak256(stringToBytes(symbol))

    // Simulate request and sign tx
    try {
      const { request } = await publicClient.simulateContract({
        abi: donationAbi,
        address: DONATION_CONTRACT_ADDRESS,
        account: walletClient.account,
        functionName: 'addToken',
        args: [hashedSymbol, contract],
      })
      await walletClient.writeContract(request)

      console.log(`Token ${symbol} (${contract}) added to allowed`)
    } catch (e) {
      console.error('Unable to add allowed token', e)
    }
  });

task("delete-token", "Deletes allowed token from donation contract")
  .addParam("symbol", "Token symbol")
  .setAction(async ({ symbol }, hre) => {
    const account = privateKeyToAccount(DEPLOYER_PRIVATE_KEY) 
    const walletClient = await hre.viem.getWalletClient(account.address)
    const publicClient = await hre.viem.getPublicClient()

    const hashedSymbol = keccak256(stringToBytes(symbol))

    // Simulate request and sign tx
    try {
      const { request } = await publicClient.simulateContract({
        abi: donationAbi,
        address: DONATION_CONTRACT_ADDRESS,
        account: walletClient.account,
        functionName: 'deleteToken',
        args: [hashedSymbol],
      })
      await walletClient.writeContract(request)
    
      console.log(`Token ${symbol} removed from allowed`)
    } catch (e) {
      console.error("Unable to remove allowed token", e)
    }
  });