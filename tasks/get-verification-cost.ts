import { task } from 'hardhat/config'
import getVerificationCost from '../scripts/get-verification-cost'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

task('get-verification-cost', 'Gets verificationCost').setAction(
  async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    await getVerificationCost(hre)
  }
)
