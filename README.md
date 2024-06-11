# Bitkind contracts
This repository contains smart contracts for processing payments on BitKind.org.

Currently, it includes:
1. Donation contract
2. BTK ERC20 token contract

## Setup environment
1. Set etherscan API key to verify contract later `npx hardhat vars set ETHERSCAN_API_KEY`
2. Set address of the deployer wallet `npx hardhat vars set DEPLOYER_WALLET_ADDRESS`

## Deploy donation contract
Run `DEPLOYER_ACCOUNT_KEY={YOUR_SECRET_KEY} npx hardhat ignition deploy ignition/modules/Donation.ts --network {NETWORK}`

After donation smart contract was deployed, save its address to run hardhat tasks:

Run `npx hardhat vars set DONATION_CONTRACT_ADDRESS`

## Tasks

### Add token
This method adds new token to the allowed tokens list, after this users will be able to make donations in this token.

Run `DEPLOYER_ACCOUNT_KEY={YOUR_SECRET_KEY} npx hardhat --network {NETWORK} add-token --contract {TOKEN_CONTRACT_ADDR} --symbol {TOKEN_SYMBOL} --decimals 18`

### Delete token
Use this method to delete token from the allowed list. After that all donations in this token will be rejected.

Run `DEPLOYER_ACCOUNT_KEY={YOUR_SECRET_KEY} npx hardhat --network {NETWORK} delete-token --symbol {TOKEN_SYMBOL}`

### Withdraw native token
A special function that provides the ability to transfer tips left by users in Ether to a specified address. Specify the amount ​​on Ether and not on WEI, the function automatically performs formatting.

Run `DEPLOYER_ACCOUNT_KEY={YOUR_SECRET_KEY} npx hardhat --network {NETWORK} withdraw-native --to {RECEIVER_ADDRESS} --amount {AMOUNT_ETHER}`

### Withdraw ERC20 token
A special method that provides the ability to transfer tips left by users in ERC20 token to a specified address. Specify the amount ​​in WEI, this function doesn't automatically formatting of amount.

Run `DEPLOYER_ACCOUNT_KEY={YOUR_SECRET_KEY} npx hardhat --network {NETWORK} withdraw-token --to {RECEIVER_ADDRESS} --amount {AMOUNT_WEI} --symbol {TOKEN_SYMBOL}`

## Development
* Run node `npx hardhat node --hostname 192.168.50.43`
* Deploy ERC20 token `npx hardhat ignition deploy ignition/modules/Token.ts --network localnet`
* Deploy donation contract `npx hardhat ignition deploy ignition/modules/Donation.ts --network localnet`
* Register token on donation contract `npx hardhat --network localnet add-token --contract 0x5FbDB2315678afecb367f032d93F642f64180aa3 --symbol BTK --decimals 18`