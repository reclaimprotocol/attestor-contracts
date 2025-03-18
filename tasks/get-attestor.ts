import { task, types } from 'hardhat/config'
import getAttestor from '../scripts/get-attestor'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

task('get-attestor', 'Fetches an attestor')
  .addParam('host', 'The attstor WebSocket url', 1, types.string)
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { host } = taskArgs

    await getAttestor(host, hre)
  })
