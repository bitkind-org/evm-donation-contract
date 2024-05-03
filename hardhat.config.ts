import { HardhatUserConfig, task } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";

const mnemonic = "test"

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  defaultNetwork: "localnet",
  networks: {
    localnet: {
      chainId: 31337,
      url: "http://192.168.50.43:8545"
    },
    testnet: {
      url: "https://data-seed-prebsc-1-s1.bnbchain.org:8545",
      chainId: 97,
      gasPrice: 20000000000,
      accounts: { mnemonic }
    },
    mainnet: {
      url: "https://bsc-dataseed.bnbchain.org/",
      chainId: 56,
      gasPrice: 20000000000,
      accounts: { mnemonic }
    }
  }
};

export default config;
