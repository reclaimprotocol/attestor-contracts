import { task, types } from 'hardhat/config'
import stake from '../scripts/stake'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

task('stake', 'Stakes an amount')
  .addParam('amount', 'The amount to be staked', 1, types.string)
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { amount } = taskArgs

    await stake(amount, hre)
  })
