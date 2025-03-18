import { task } from 'hardhat/config'
import getCurrentTask from '../scripts/get-current-task'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

task('get-current-task', 'Gets currentTask').setAction(
  async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    await getCurrentTask(hre)
  }
)
