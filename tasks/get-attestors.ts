import { task } from 'hardhat/config'
import getAttestors from '../scripts/get-attestors'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

task('get-attestors', 'Fetches all attestors').setAction(
  async (taskArgs, hre: HardhatRuntimeEnvironment) => {
    await getAttestors(hre)
  }
)
