import { task, types } from 'hardhat/config'
import createTaskRequest from '../scripts/create-task-request'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

task('create-task-request', 'create a task request').setAction(
  async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    await createTaskRequest(hre)
  }
)
