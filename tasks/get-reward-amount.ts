import { task, types } from 'hardhat/config'
import getRewardAmount from '../scripts/get-reward-amount'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

task('get-reward-amount', 'Fetches reward per attestor')
  .addParam('host', 'The attstor WebSocket url', 1, types.string)
  .setAction(async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    const { host } = taskArgs

    await getRewardAmount(host, hre)
  })
