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

  // Generate the proof
  const proof = await reclaimClient.zkFetch(
    url,
    { method: 'GET' },
    {
      responseMatches: [
        {
          type: 'regex',
          value: '\\{"ethereum":\\{"usd":(?<price>[\\d\\.]+)\\}\\}'
        }
      ]
    }
  )

  if (!proof) {
    console.log('Failed to generate proof')
    return
  }

  const proofData = await transformForOnchain(proof)
  console.log('Proof:', proofData)
  return proofData
}

async function createTaskRequest() {
  const seed = ethers.utils.randomBytes(32)
  const timestamp = Math.floor(Date.now() / 1000)
  const taskContract = await getTaskContract()

  const tx = await taskContract.createNewTaskRequest(seed, timestamp)
  await tx.wait()
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
    await createTaskRequest()
    const verificationCost = await governanceContract.verificationCost()
    const currentTask = await taskContract.currentTask()

    console.log('Verifying for task ID ', currentTask)

    const tx = await taskContract.verifyProof(proofData, currentTask, {
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
