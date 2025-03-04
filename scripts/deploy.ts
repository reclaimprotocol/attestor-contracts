import { Governance } from '../typechain-types'
import fs from 'fs'

const delay = (ms: number | undefined) =>
  new Promise((res) => setTimeout(res, ms))

const deploy = async (hre: any) => {
  const minimumStake = hre.ethers.parseEther('10')
  const unbondingPeriod = 10
  let addresses = {
    governance: '',
    task: ''
  }

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

  await delay(5000)

  const ReclaimFactory = await hre.ethers.getContractFactory('ReclaimTask')
  const task = await ReclaimFactory.deploy(owner.address, governanceAddress)

  const taskAddress = await task.getAddress()

  console.log(
    'ReclaimTask contract was deployed successfully to ' + taskAddress
  )

  await delay(5000)

  await governance.setReclaimContractAddress(taskAddress)

  await delay(5000)

  await task.setRequiredAttestors(1)

  await delay(5000)

  await governance.setVerificationCost(hre.ethers.parseEther('1.0'))

  await delay(5000)

  await governance.addAttestor(
    'wss://attestor.reclaimprotocol.org/ws',
    '0x244897572368eadf65bfbc5aec98d8e5443a9072'
  )

  addresses.governance = governanceAddress
  addresses.task = taskAddress
  fs.writeFileSync('scripts/addresses.json', JSON.stringify(addresses))

  console.log('Setup is complete!')
}
export default deploy
