import { task } from 'hardhat/config'
import getTotalSlashed from '../scripts/get-total-slashed'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

task('get-total-slashed', 'Gets totalSlashedAmount').setAction(
  async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    await getTotalSlashed(hre)
  }
)
