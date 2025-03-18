import { task } from 'hardhat/config'
import getTotalStaked from '../scripts/get-total-staked'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

task('get-total-staked', 'Gets totalStaked').setAction(
  async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    await getTotalStaked(hre)
  }
)
