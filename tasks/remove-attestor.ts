import { task, types } from 'hardhat/config'
import removeAttestor from '../scripts/remove-attestor'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

task('remove-attestor', 'Removes an attestor from contract')
  .addParam('host', 'The attstor WebSocket url', 1, types.string)
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { host } = taskArgs

    await removeAttestor(host, hre)
  })
