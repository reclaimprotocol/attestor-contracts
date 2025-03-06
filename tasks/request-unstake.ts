import { task, types } from 'hardhat/config'
import requestUnstake from '../scripts/request-unstake'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

task('request-unstake', 'Request unstaking').setAction(
  async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    await requestUnstake(hre)
  }
)
