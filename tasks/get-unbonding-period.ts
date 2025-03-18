import { task, types } from 'hardhat/config'
import getUnbondingPeriod from '../scripts/get-unbonding-period'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

task('get-unbonding-period', 'Gets unbondingPeriod').setAction(
  async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    await getUnbondingPeriod(hre)
  }
)
