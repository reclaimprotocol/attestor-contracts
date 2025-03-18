import { HardhatRuntimeEnvironment } from 'hardhat/types'

const getConsensus = async (id: number, hre: HardhatRuntimeEnvironment) => {
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
    const result = await contract.consensusReached(id)
    console.log(result)
  } catch (error) {
    console.error('Error calling contract:', error)
  }

  console.log(`Consensus for task ${id} is fetched!`)
}
export default getConsensus
