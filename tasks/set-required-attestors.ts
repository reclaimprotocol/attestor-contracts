import { task, types } from 'hardhat/config'
import setRequiredAttestors from '../scripts/set-required-attestors'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

task('set-required-attestors', 'Sets requiredAttestors')
  .addParam('amount', 'requiredAttestors', 1, types.int)
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { amount } = taskArgs

    await setRequiredAttestors(amount, hre)
  })
