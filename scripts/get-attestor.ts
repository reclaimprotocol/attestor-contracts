import { HardhatRuntimeEnvironment } from 'hardhat/types'

const getAttestor = async (host: string, hre: HardhatRuntimeEnvironment) => {
  const addresses = require('./addresses.json')
  const governanceAddress = addresses.governance

  const fs = require('fs')
  const ContractArtifact = JSON.parse(
    fs.readFileSync(
      'artifacts/contracts/Governance.sol/Governance.json',
      'utf8'
    )
  )

  const contract = await hre.ethers.getContractAt(
    ContractArtifact.abi,
    governanceAddress
  )

  try {
    //@ts-ignore
    const result = await contract.getAttestor(host)
    console.log(result)
  } catch (error) {
    console.error('Error calling contract:', error)
  }

  console.log(`Attestor ${host} is fetched!`)
}
export default getAttestor
