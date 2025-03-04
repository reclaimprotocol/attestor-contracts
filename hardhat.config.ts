import dotenv from 'dotenv'
dotenv.config()

import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
const { PRIVATE_KEY } = process.env

const config: HardhatUserConfig = {
  networks: {
    hardhat: {},
    'mechain-testnet': {
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      url: 'https://testnet-rpc.mechain.tech'
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
