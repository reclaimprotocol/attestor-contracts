import { task, types } from 'hardhat/config'
import setVerificationCost from '../scripts/set-verification-cost'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

task('set-verification-cost', 'Sets verificationCost')
  .addParam('amount', 'verificationCost', 1, types.int)
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { amount } = taskArgs

    await setVerificationCost(amount, hre)
  })
