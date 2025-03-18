import { HardhatRuntimeEnvironment } from 'hardhat/types'

const getRequiredAttestors = async (hre: HardhatRuntimeEnvironment) => {
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
    //@ts-ignore
    const result = await contract.requiredAttestors()
    console.log(`requiredAttestors is ${result} !`)
  } catch (error) {
    console.error('Error calling contract:', error)
  }
}
export default getRequiredAttestors
