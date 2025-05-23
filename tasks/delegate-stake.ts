import { task, types } from 'hardhat/config'
import delegateStake from '../scripts/delegate-stake'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

task('delegate-stake', 'Performs delegate staking')
  .addParam('address', 'The benificiary address', 1, types.string)
  .addParam('amount', 'The amount to be staked', 1, types.string)
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { address, amount } = taskArgs
    // await delegatestake(address, amount, hre)
    await delegateStake(address, amount, hre)
  })
