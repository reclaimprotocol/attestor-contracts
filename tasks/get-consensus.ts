import { task, types } from 'hardhat/config'
import getConsensus from '../scripts/get-consensus'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

task('get-consensus', 'Fetches a task consensus result')
  .addParam('id', 'The task id', 1, types.int)
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { id } = taskArgs

    await getConsensus(id, hre)
  })
