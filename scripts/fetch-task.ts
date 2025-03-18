import { HardhatRuntimeEnvironment } from 'hardhat/types'

const fetchTask = async (id: number, hre: HardhatRuntimeEnvironment) => {
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
    const result = await contract.fetchTask(id)
    console.log(result)
  } catch (error) {
    console.error('Error calling contract:', error)
  }

  console.log(`Task ${id} is fetched!`)
}
export default fetchTask
