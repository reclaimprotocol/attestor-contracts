import { task, types } from 'hardhat/config'
import setUnbondingPeriod from '../scripts/set-unbonding-period'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

task('set-unbonding-period', 'Sets unbondingPeriod')
  .addParam('amount', 'unbondingPeriod', 1, types.int)
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { amount } = taskArgs

    await setUnbondingPeriod(amount, hre)
  })
