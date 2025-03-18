import { task, types } from 'hardhat/config'
import slash from '../scripts/slash'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

task('slash', 'Slashes by an amount')
  .addParam('amount', 'slash amount', 1, types.int)
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { amount } = taskArgs

    await slash(amount, hre)
  })
