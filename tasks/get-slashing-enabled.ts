import { task } from 'hardhat/config'
import getSlashingEnabled from '../scripts/get-slashing-enabled'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

task('get-slashing-enabled', 'Gets slashingEnabled').setAction(
  async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    await getSlashingEnabled(hre)
  }
)
