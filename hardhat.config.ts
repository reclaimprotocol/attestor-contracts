import dotenv from 'dotenv'
dotenv.config()

import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
const { PRIVATE_KEY } = process.env
import './tasks'

const config: HardhatUserConfig = {
  networks: {
    hardhat: {},
    'mechain-testnet': {
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      url: 'https://testnet-rpc.mechain.tech'
    },
    sepolia: {
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      url: 'https://ethereum-sepolia-rpc.publicnode.com'
    }
  },
  solidity: {
    version: '0.8.28',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  etherscan: {
    apiKey: {
      'mechain-testnet': 'empty'
    },
    customChains: [
      {
        network: 'mechain-testnet',
        chainId: 5151,
        urls: {
          apiURL: 'https://testnet-scan.mechain.tech/api',
          browserURL: 'https://testnet-scan.mechain.tech'
        }
      }
    ]
  }
}

export default config
