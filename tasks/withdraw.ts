import { task, types } from 'hardhat/config'
import withdraw from '../scripts/withdraw'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

task('withdraw', 'Withdraws all funds').setAction(
  async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    await withdraw(hre)
  }
)
