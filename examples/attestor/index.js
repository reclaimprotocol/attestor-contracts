const {
  AttestorClient,
  createClaimOnAttestor
} = require('@reclaimprotocol/attestor-core')
const { transformForOnchain } = require('@reclaimprotocol/js-sdk')
const { ethers } = require('ethers')
const dotenv = require('dotenv')
const taskABI = require('./taskABI.json')
const governanceABI = require('./governanceABI.json')

dotenv.config()

const claimObj = {
  method: 'GET',
  url: 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
  responseMatches: [
    {
      type: 'regex',
      value: '{"ethereum":{"usd":(?<usd>.*?)}}'
    }
  ],
  responseRedactions: [
    {
      regex: '{"ethereum":{"usd":(?<usd>.*?)}}'
    }
  ],
  geoLocation: '',
  body: '',
  paramValues: {},
  headers: {}
}

async function transformProof(response) {
  let preChainProof = {
    identifier: '',
    claimData: {
      provider: '',
      parameters: '',
      owner: '',
      timestampS: 0,
      context: '',
      identifier: '',
      epoch: 0
    },
    signatures: ['']
  }

  preChainProof.identifier = response.claim.identifier
  preChainProof.claimData.provider = response.claim.provider
  preChainProof.claimData.parameters = response.claim.parameters
  preChainProof.claimData.owner = response.claim.owner
  preChainProof.claimData.timestampS = response.claim.timestampS
  preChainProof.claimData.context = response.claim.context
  preChainProof.claimData.identifier = response.claim.identifier
  preChainProof.claimData.epoch = response.claim.epoch
  preChainProof.signatures[0] =
    '0x' + response.signatures.claimSignature.toString('hex')

  return transformForOnchain(preChainProof)
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

const createClaim = async () => {
  try {
    const taskContract = await getTaskContract()
    const governanceContract = await getGovernanceContract()

    // Construct parameters for the createNewTaskRequest function
    const seed = ethers.utils.randomBytes(32)
    const timestamp = Math.floor(Date.now() / 1000)

    // Perform a static call to fetch taskId and attestors for the next task
    const result = await taskContract.callStatic.createNewTaskRequest(
      seed,
      timestamp
    )
    const taskId = result[0]

    // fetch requiredAttestors to determine how many proofs to request
    const requiredAttestors = await taskContract.requiredAttestors()

    let taskAttestors = []
    let attestorClients = []
    let proofs = []

    for (let i = 0; i < requiredAttestors; i++) {
      // Fetched attestors's WebSocket URI, e.g. wss://attestor.reclaimprotocol.org/ws
      const host = result[1][i].host
      taskAttestors[i] = host

      const client = new AttestorClient({
        url: host
      })
      attestorClients[i] = client
    }

    for (let i = 0; i < requiredAttestors; i++) {
      const client = attestorClients[i]

      // Request a proof from the designated attestor's client
      const response = await createClaimOnAttestor({
        name: 'http',
        params: {
          method: claimObj.method,
          url: claimObj.url,
          responseMatches: claimObj.responseMatches,
          responseRedactions: claimObj.responseRedactions,
          geoLocation: claimObj.geoLocation,
          body: claimObj.body,
          paramValues: claimObj.paramValues,
          additionalClientOptions: {}
        },
        secretParams: {
          headers: claimObj.headers,
          cookieStr: '',
          authorisationHeader: ''
        },
        ownerPrivateKey: '0x' + process.env.PRIVATE_KEY,
        client
      })

      // Transform the proof to Reclaim on-chain proof format
      const proof = await transformProof(response)
      proofs[i] = proof
    }

    // Perform the call that was statically-called previously
    const tx0 = await taskContract.createNewTaskRequest(seed, timestamp)
    await tx0.wait()

    const verificationCost = await governanceContract.verificationCost()

    const tx1 = await taskContract.verifyProofs(proofs, taskId, {
      value: verificationCost
    })

    await tx1.wait()

    console.log(
      'Proofs verified on-chain successfully, Here is Transaction Hash:',
      tx1.hash
    )
  } catch (error) {
    console.log(error)
  }
}

createClaim()
