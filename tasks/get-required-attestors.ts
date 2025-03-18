import { task } from 'hardhat/config'
import getRequiredAttestors from '../scripts/get-required-attestors'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

task('get-required-attestors', 'Gets requiredAttestors').setAction(
  async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    await getRequiredAttestors(hre)
  }
)
