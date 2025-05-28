import { task, types } from 'hardhat/config'
import slashAttestor from '../scripts/slash-attestor'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

task('slash-attestor', 'Performs attestor slashing')
  .addParam('address', 'The slashed address', 1, types.string)
  .addParam('amount', 'The amount to be slashed', 1, types.string)
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { address, amount } = taskArgs

    await slashAttestor(address, amount, hre)
  })
