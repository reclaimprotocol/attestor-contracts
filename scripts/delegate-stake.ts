import { HardhatRuntimeEnvironment } from 'hardhat/types'

const delegateStake = async (
  address: string,
  amount: number,
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
    await contract.delegateStake(address, { value: amount })
  } catch (error) {
    console.error('Error calling contract:', error)
  }

  console.log(`${amount} is staked!`)
}
export default delegateStake
