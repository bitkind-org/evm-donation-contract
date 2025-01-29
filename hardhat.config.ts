import { HardhatUserConfig, vars } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import "@nomicfoundation/hardhat-verify";

// Import hardhat tasks
import "./tasks/token"
import "./tasks/tips"

export const DEPLOYER_PRIVATE_KEY = (process.env.DEPLOYER_PRIVATE_KEY) as `0x${string}`

const ETHERSCAN_API_KEY = vars.get("ETHERSCAN_API_KEY");

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  defaultNetwork: "localnet",
  networks: {
    bsc: {
      url: "https://bsc-dataseed1.binance.org/",
      chainId: 56,
      gasPrice: "auto",
      accounts: [DEPLOYER_PRIVATE_KEY]
    },
    mainnet: {
      url: "https://eth.llamarpc.com",
      chainId: 1,
      gasPrice: 5000000008,
      accounts: [DEPLOYER_PRIVATE_KEY]
    },
    localnet: {
      chainId: 31337,
      url: "http://127.0.0.1:8545",
    },
    localnet2: {
      chainId: 31338,
      url: "http://127.0.0.1:8546",
    }
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  },
};

export default config;
