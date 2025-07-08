/*
This example is for an outdated deployment, we keep it merely for demonstration purposes.

The governance contract holds one attestor, Reclaim's official, hence no decentralized task management.

Reclaim's Attestor:
{
host: 'wss://attestor.reclaimprotocol.org/ws',
address: '0x244897572368Eadf65bfBc5aec98D8e5443a9072'
}
*/

const { ReclaimClient } = require('@reclaimprotocol/zk-fetch')
const { transformForOnchain } = require('@reclaimprotocol/js-sdk')
const { ethers } = require('ethers')
const dotenv = require('dotenv')
const taskABI = require('./taskABI.json')
const governanceABI = require('./governanceABI.json')

dotenv.config()

async function generateProof() {
  // Initialize the ReclaimClient
  const reclaimClient = new ReclaimClient(
    process.env.APP_ID,
    process.env.APP_SECRET
  )

  // Example URL to fetch the data from
  const url =
    'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'

  // Generate proofs
  const proofs = await reclaimClient.zkFetch(
    url,
    { method: 'GET' },
    {
      responseMatches: [
        {
          type: 'regex',
          value: '\\{"ethereum":\\{"usd":(?<price>[\\d\\.]+)\\}\\}'
        }
      ]
    },
    // The isDecentralised option
    true
  )

  if (!proofs) {
    console.log('Failed to generate proof')
    return
  }

  const proofData = await proofs.map(transformForOnchain)
  return proofData
}

async function getTaskContract() {
  const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL)
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider)
  const taskContract = new ethers.Contract(
    process.env.TASK_CONTRACT_ADDRESS,
    taskABI,
    signer
  )
  return taskContract
}

async function getGovernanceContract() {
  const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL)
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider)

  const governanceContract = new ethers.Contract(
    process.env.GOVERNANCE_CONTRACT_ADDRESS,
    governanceABI,
    signer
  )

  return governanceContract
}

async function verifyProof() {
  try {
    const proofData = await generateProof()
    const taskContract = await getTaskContract()
    const governanceContract = await getGovernanceContract()

    const verificationCost = await governanceContract.verificationCost()
    const currentTask = await taskContract.currentTask()

    console.log('Verifying for task ID ', currentTask)

    const tx = await taskContract.verifyProofs(proofData, currentTask, {
      value: verificationCost
    })

    await tx.wait()

    console.log(
      'Proof verified on-chain successfully, Here is Transaction Hash:',
      tx.hash
    )

    process.exit(0)
  } catch (e) {
    console.error('Error verifying proof:', e.message)
    process.exit(1)
  }
}

// Run the verification function
verifyProof()
