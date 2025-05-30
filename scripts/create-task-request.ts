import { HardhatRuntimeEnvironment } from 'hardhat/types'

const createTaskRequest = async (hre: HardhatRuntimeEnvironment) => {
  const addresses = require('./addresses.json')
  const reclaimAddress = addresses.task

  const fs = require('fs')
  const ContractArtifact = JSON.parse(
    fs.readFileSync(
      'artifacts/contracts/ReclaimTask.sol/ReclaimTask.json',
      'utf8'
    )
  )

  const contract = await hre.ethers.getContractAt(
    ContractArtifact.abi,
    reclaimAddress
  )

  try {
    const seed = hre.ethers.randomBytes(32)
    const timestamp = Math.floor(Date.now() / 1000)
    //@ts-ignore
    await contract.createNewTaskRequest(seed, timestamp)
  } catch (error) {
    console.error('Error calling contract:', error)
  }
}
export default createTaskRequest
