import { task } from 'hardhat/config'
import getMinimumStake from '../scripts/get-minimum-stake'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

task('get-minimum-stake', 'Gets minimumStake').setAction(
  async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    await getMinimumStake(hre)
  }
)
