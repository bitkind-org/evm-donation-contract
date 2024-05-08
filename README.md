# Bitkind contracts
This repository contains the all smart contracts for the BitKind project.

Currently, it includes:
1. Donation contract
2. BTK token contract

## Setup environment
Run `npx hardhat vars set ETHERSCAN_API_KEY`

## Deploy contract
Run `DEPLOYER_ACCOUNT_KEY={YOUR_SECRET_KEY} npx hardhat ignition deploy ignition/modules/Donation.ts --network {NETWORK}`

## Add token
Run `DEPLOYER_ACCOUNT_KEY={YOUR_SECRET_KEY} npx hardhat --network {NETWORK} add-token --contract {TOKEN_CONTRACT_ADDR} --fee 0 --address {DONATION_CONTRACT_ADDR} --symbol BTK --decimals 18`
