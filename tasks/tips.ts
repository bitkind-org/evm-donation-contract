import { task, vars } from "hardhat/config";
import { keccak256, parseEther, parseUnits, stringToBytes, Abi, zeroAddress } from "viem";
import { privateKeyToAccount } from 'viem/accounts'
import * as DonationJSON from "../artifacts/contracts/Donation.sol/Donation.json";
import { DEPLOYER_PRIVATE_KEY } from "../hardhat.config";

const donationAbi = DonationJSON.abi as Abi;

const DONATION_CONTRACT_ADDRESS = vars.get("DONATION_CONTRACT_ADDRESS") as `0x${string}`

task("withdraw-native", "Transfers tips left by users in Ether to a specified address")
  .addParam("to", "Receiver address")
  .addParam("amount", "Amount in ether")
  .setAction(async ({ to, amount }, hre) => {
    const account = privateKeyToAccount(DEPLOYER_PRIVATE_KEY) 
    const walletClient = await hre.viem.getWalletClient(account.address)
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
  .addParam("amount", "Amount in token units, e.g. '1.5'")
  .setAction(async ({ symbol, to, amount }, hre) => {
    const account = privateKeyToAccount(DEPLOYER_PRIVATE_KEY) 
    const walletClient = await hre.viem.getWalletClient(account.address)
    const publicClient = await hre.viem.getPublicClient()
    const hashedSymbol = keccak256(stringToBytes(symbol))

    const tokenAddress = await publicClient.readContract({
      abi: donationAbi,
      address: DONATION_CONTRACT_ADDRESS,
      functionName: 'allowedTokens',
      args: [hashedSymbol],
    }) as `0x${string}`

    if (!tokenAddress || tokenAddress === zeroAddress) {
      throw new Error(`Token '${symbol}' is not registered in Donation.allowedTokens`)
    }

    const erc20Abi = [
      { name: 'decimals', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8', name: '' }] },
    ] as unknown as Abi

    const decimals = await publicClient.readContract({
      abi: erc20Abi,
      address: tokenAddress,
      functionName: 'decimals',
      args: [],
    }) as number

    const amountInSmallest = parseUnits(amount, Number(decimals))

    // Simulate request and sign tx
    const { request } = await publicClient.simulateContract({
      abi: donationAbi,
      address: DONATION_CONTRACT_ADDRESS,
      account: walletClient.account,
      functionName: 'withdrawToken',
      args: [hashedSymbol, to, amountInSmallest],
    })
    await walletClient.writeContract(request)
  });
