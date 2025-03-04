import { Governance } from '../typechain-types'

const deploy = async (hre: any) => {
  const minimumStake = hre.ethers.parseEther('10')
  const unbondingPeriod = 10

  const [owner] = await hre.ethers.getSigners()
  const GovernanceFactory = await hre.ethers.getContractFactory('Governance')
  const governance = (await GovernanceFactory.deploy(
    owner.address,
    minimumStake,
    unbondingPeriod
  )) as Governance

  const governanceAddress = await governance.getAddress()
  console.log(
    'Governance contract was deployed successfully to ' + governanceAddress
  )

  const ReclaimFactory = await hre.ethers.getContractFactory('ReclaimTask')
  const task = await ReclaimFactory.deploy(owner.address, governanceAddress)

  const taskAddress = await task.getAddress()
  console.log(
    'ReclaimTask contract was deployed successfully to ' + taskAddress
  )
}
export default deploy
