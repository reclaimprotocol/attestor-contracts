import deploy from '../scripts/deploy'
import { task } from 'hardhat/config'

task('deploy', async (taskArgs, hre) => {
  await deploy(hre)
})
