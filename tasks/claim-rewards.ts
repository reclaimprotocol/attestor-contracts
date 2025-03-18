import { task } from 'hardhat/config'
import claimRewards from '../scripts/claim-rewards'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

task('claim-rewards', 'Claims rewards').setAction(
  async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    await claimRewards(hre)
  }
)
