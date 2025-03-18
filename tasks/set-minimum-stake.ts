import { task, types } from 'hardhat/config'
import setMinimumStake from '../scripts/set-minimum-stake'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

task('set-minimum-stake', 'Sets minimumStake')
  .addParam('amount', 'minimumStake', 1, types.int)
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { amount } = taskArgs

    await setMinimumStake(amount, hre)
  })
