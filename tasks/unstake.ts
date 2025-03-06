import { task } from 'hardhat/config'
import unstake from '../scripts/unstake'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

task('unstake', 'Unstakes balance').setAction(
  async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    await unstake(hre)
  }
)
