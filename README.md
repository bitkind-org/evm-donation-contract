# Bitkind EVM Contracts
Smart contract for processing donations in various tokens on [Bitkind.org](https://bitkind.org) in EVM-compatible networks.

When you make a transaction, please verify:
1. The **contract address** you are interacting with.
2. That the **site domain** is indeed `https://bitkind.org`.

### Deployed Contract(s)

- **BNB Chain (BSC)**: [0x60DaF666f75329b740cDd16D2E71f9F04C97f67b](https://bscscan.com/address/0x60DaF666f75329b740cDd16D2E71f9F04C97f67b)
- **Ethereum Mainnet**: [0x7c570e77518f02ebecafac8ace0ea263abcb44bd](https://etherscan.com/address/0x7c570e77518f02ebecafac8ace0ea263abcb44bd)

## Deploy Donation Contract
To deploy the **donation contract**, run:

```bash
DEPLOYER_PRIVATE_KEY={YOUR_SECRET_KEY} \
npx hardhat ignition deploy ignition/modules/Donation.ts --network {NETWORK}
```

After the donation smart contract is deployed, save its address to run Hardhat tasks. For example:

```bash
npx hardhat vars set DONATION_CONTRACT_ADDRESS {CONTRACT_ADDRESS}
```

### Verify Contract
1. Set Etherscan API key:
   ```bash
   npx hardhat vars set ETHERSCAN_API_KEY
   ```
2. Run the verify script:
   ```bash
   DEPLOYER_PRIVATE_KEY={YOUR_SECRET_KEY} \
   npx hardhat ignition verify --network {NETWORK} chain-{CHAIN_ID}
   ```

## Tasks
Below are the custom Hardhat tasks for token management and withdrawals.

---

### Add Token
This method adds new token to the allowed tokens list, after this users will be able to make donations in this token.

Adds a new token to the allowed tokens list. After that, users can donate in this token.

```bash
DEPLOYER_PRIVATE_KEY={YOUR_SECRET_KEY} \
npx hardhat --network {NETWORK} \
  add-token \
  --contract {TOKEN_CONTRACT_ADDR} \
  --symbol {TOKEN_SYMBOL}
```

### Delete Token
Removes a token from the allowed list. Any donation in this token will be rejected afterward.

```bash
DEPLOYER_PRIVATE_KEY={YOUR_SECRET_KEY} \
npx hardhat --network {NETWORK} \
  delete-token \
  --symbol {TOKEN_SYMBOL}
```

### Withdraw Native Token
Transfers tips left by users in Ether to a specified address. Specify the amount in Ether (not Wei). The function automatically converts Ether to Wei internally.

```bash
DEPLOYER_PRIVATE_KEY={YOUR_SECRET_KEY} \
npx hardhat --network {NETWORK} \
  withdraw-native \
  --to {RECEIVER_ADDRESS} \
  --amount {AMOUNT_ETHER}
```

### Withdraw ERC20 Token
Transfers tips left by users in an ERC20 token to a specified address. Specify the amount in Wei. This function does not perform formatting automatically.

```bash
DEPLOYER_PRIVATE_KEY={YOUR_SECRET_KEY} \
npx hardhat --network {NETWORK} \
  withdraw-token \
  --to {RECEIVER_ADDRESS} \
  --amount {AMOUNT_WEI} \
  --symbol {TOKEN_SYMBOL}
```

## Development
Below is a quick reference for local development.

1. **Run a local node**  
   ```bash
   npx hardhat node --hostname 127.0.0.1
   ```
2. Deploy an ERC20 token (for testing)
   ```bash
   DEPLOYER_PRIVATE_KEY={YOUR_SECRET_KEY} \
   npx hardhat ignition deploy ignition/modules/Token.ts --network {NETWORK}
   ```
3. Deploy the donation contract
   ```bash
   DEPLOYER_PRIVATE_KEY={YOUR_SECRET_KEY} \
   npx hardhat ignition deploy ignition/modules/Donation.ts --network {NETWORK}
   ```

4. Register a token on the donation contract
   ```bash
   DEPLOYER_PRIVATE_KEY={YOUR_SECRET_KEY} \
   npx hardhat --network {NETWORK} add-token \
     --contract {TOKEN_ADDRESS} \
     --symbol {TOKEN_SYMBOL}
   ```

## Testing
Then simply run:

```bash
yarn test
```

This executes your Hardhat tests. You can also specify a network:

```bash
yarn test --network {NETWORK}
```

Be sure to have the local node running (if testing locally) before you run yarn test.

### Additional Testing Notes
To compile contracts via Yarn:
```bash
yarn hardhat compile
```

To run coverage (if have a coverage plugin):
```bash
yarn hardhat coverage
```