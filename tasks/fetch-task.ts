import { task, types } from 'hardhat/config'
import fetchTask from '../scripts/fetch-task'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

task('fetch-task', 'Fetches a task')
  .addParam('id', 'The task id', 1, types.int)
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { id } = taskArgs

    await fetchTask(id, hre)
  })
