import { task, types } from 'hardhat/config'
import verify from '../scripts/verify'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

task('verify-proof', 'verifies a proof')
  .addParam('id', 'The task id', 1, types.int)
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { id } = taskArgs
    await verify(id, hre)
  })
