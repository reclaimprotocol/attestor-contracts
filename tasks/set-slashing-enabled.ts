import { task, types } from 'hardhat/config'
import setSlashingEnabled from '../scripts/set-slashing-enabled'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

task('set-slashing-enabled', 'Sets slashingEnabled')
  .addParam('flag', 'slashingEnabled', 1, types.boolean)
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { flag } = taskArgs

    await setSlashingEnabled(flag, hre)
  })
