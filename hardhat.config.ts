import dotenv from 'dotenv'
dotenv.config()

import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
const { PRIVATE_KEY } = process.env
import './tasks'

const config: HardhatUserConfig = {
  networks: {
    hardhat: {},
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
  }
}

export default config
