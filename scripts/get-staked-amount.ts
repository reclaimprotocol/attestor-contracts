import { HardhatRuntimeEnvironment } from 'hardhat/types'

const getStakedAmount = async (
  host: string,
  hre: HardhatRuntimeEnvironment
) => {
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
    const result = await contract.stakedAmounts(host)
    console.log(result)
  } catch (error) {
    console.error('Error calling contract:', error)
  }

  console.log(`Attestor ${host} stake is fetched!`)
}
export default getStakedAmount
