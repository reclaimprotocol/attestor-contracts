import { HardhatRuntimeEnvironment } from 'hardhat/types'

const stake = async (amount: number, hre: HardhatRuntimeEnvironment) => {
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
    const result = await contract.stake({ value: ethers.parseEther(amount) })
    console.log(result)
  } catch (error) {
    console.error('Error calling contract:', error)
  }

  console.log(`${amount} is staked!`)
}
export default stake
