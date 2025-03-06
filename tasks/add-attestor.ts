import { task, types } from 'hardhat/config'
import addAttestor from '../scripts/add-attestor'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

task('add-attestor', 'Adds an attestor to contract')
  .addParam('host', 'The attstor WebSocket url', 1, types.string)
  .addParam('address', 'The attestor signing address', 1, types.string)
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { host, address } = taskArgs

    await addAttestor(host, address, hre)
  })
