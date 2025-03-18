import { task, types } from 'hardhat/config'
import getStakedAmount from '../scripts/get-staked-amount'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

task('get-staked-amount', 'Fetches stake per attestor')
  .addParam('host', 'The attstor WebSocket url', 1, types.string)
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { host } = taskArgs

    await getStakedAmount(host, hre)
  })
