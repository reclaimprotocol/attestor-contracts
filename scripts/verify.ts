import { HardhatRuntimeEnvironment } from 'hardhat/types'

const verify = async (id: number, hre: HardhatRuntimeEnvironment) => {
  const addresses = require('./addresses.json')
  const reclaimAddress = addresses.task

  const fs = require('fs')
  const TaskContractArtifact = JSON.parse(
    fs.readFileSync(
      'artifacts/contracts/ReclaimTask.sol/ReclaimTask.json',
      'utf8'
    )
  )

  const taskContract = await hre.ethers.getContractAt(
    TaskContractArtifact.abi,
    reclaimAddress
  )

  const governanceAddress = addresses.governance

  const GovernanceContractArtifact = JSON.parse(
    fs.readFileSync(
      'artifacts/contracts/Governance.sol/Governance.json',
      'utf8'
    )
  )

  const governanceContract = await hre.ethers.getContractAt(
    GovernanceContractArtifact.abi,
    governanceAddress
  )
  //@ts-ignore
  const verificationCost = await governanceContract.verificationCost()
  try {
    const proof = {
      claimInfo: {
        context: `{"contextAddress":"user's address","contextMessage":"for acmecorp.com on 1st january","extractedParameters":{"username":"hadi-saleh14"},"providerHash":"0xcb4a6b54d59f97b5891cced83e9e909c938bc06149a22f9e76309f2d20300609"}`,
        parameters:
          '{"additionalClientOptions":{},"body":"","geoLocation":"","headers":{"Referer":"https://github.com/settings/profile","Sec-Fetch-Mode":"same-origin","User-Agent":"Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.6668.69 Mobile Safari/537.36"},"method":"GET","paramValues":{"username":"hadi-saleh14"},"responseMatches":[{"invert":false,"type":"contains","value":"<span class=\\"color-fg-muted\\">({{username}})</span>"}],"responseRedactions":[{"jsonPath":"","regex":"<span class=\\"color-fg-muted\\">\\\\((.*)\\\\)</span>","xPath":""}],"url":"https://github.com/settings/profile"}',
        provider: 'http'
      },
      signedClaim: {
        claim: {
          epoch: 1,
          identifier:
            '0xb467e58748ddbad155ac6e58a007688ebbaff97ef8277856f5e95b11775039ff',
          owner: '0x2edddad5144aa9ab7e70c7c9c03c5fe5741be5cb',
          timestampS: 1738255480
        },
        signatures: [
          '0x10badfdfb051b1f54c476940e6004aa803e995231c839618455d5273f91c26ca4cc893337f40ea7462ba45789dde6255f51b94c873979b2739b2e8664a9748471b'
        ]
      }
    }

    //@ts-ignore
    const result = await taskContract.verifyProof(proof, id, {
      value: verificationCost
    })

    console.log(result)
  } catch (error) {
    console.error('Error calling contract:', error)
  }

  console.log(`Task ${id}'s proof is verified!`)
}
export default verify
