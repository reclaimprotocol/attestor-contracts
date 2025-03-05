import { expect } from 'chai'
import { ethers } from 'hardhat'
import { ReclaimTask, Governance } from '../typechain-types'
import {
  createWallet,
  FALSE_IDENTIFIER,
  PROOF,
  signClaim,
  FALSE_SIGNATURES
} from './utils'
import { transformForOnchain } from '@reclaimprotocol/js-sdk'

describe('Integration', function () {
  let reclaim: ReclaimTask
  let governance: Governance
  let owner: any
  let attestor1: any
  let attestor2: any
  let attestor3: any
  const minimumStake = ethers.parseEther('1')
  const unbondingPeriod = 10

  beforeEach(async function () {
    ;[owner, attestor1, attestor2, attestor3] = await ethers.getSigners()

    const GovernanceFactory = await ethers.getContractFactory(
      'Governance',
      owner
    )
    governance = await GovernanceFactory.deploy(
      owner.address,
      minimumStake,
      unbondingPeriod
    )

    const ReclaimFactory = await ethers.getContractFactory('ReclaimTask')
    reclaim = await ReclaimFactory.deploy(
      owner.address,
      governance.getAddress()
    )

    await reclaim.setRequiredAttestors(4)

    await governance.setVerificationCost(ethers.parseEther('1.0'))

    await governance.setReclaimContractAddress(reclaim.getAddress())
  })

  describe('Verification', function () {
    it('Should verify a valid proof', async function () {
      //@ts-ignore
      const onChainProof = transformForOnchain(PROOF)

      let signatures = []

      signatures[0] = onChainProof.signedClaim.signatures[0]
      await governance.addAttestor('reclaim-attestor', PROOF.witnesses[0].id)

      for (let i = 1; i < 4; i++) {
        const wallet = await createWallet()
        signatures[i] = await signClaim(onChainProof.signedClaim.claim, wallet)

        await governance.addAttestor('attestor' + i, wallet.address)
      }

      const seed = ethers.randomBytes(32)
      const timestamp = Math.floor(Date.now() / 1000)
      await reclaim.createNewTaskRequest(seed, timestamp)

      onChainProof.signedClaim.signatures = signatures

      const verificationCost = await governance.verificationCost()

      const taskId = await reclaim.currentTask()

      await reclaim.verifyProof(onChainProof, taskId, {
        value: verificationCost
      })
      expect(await reclaim.consensusReached(taskId)).to.be.true
    })

    it('Should reject an invalid proof - duplicated signatures', async function () {
      const proof = JSON.parse(JSON.stringify(PROOF))

      //@ts-ignore
      const onChainProof = transformForOnchain(proof)

      let signatures = []

      signatures[0] = onChainProof.signedClaim.signatures[0]
      await governance.addAttestor('reclaim-attestor', PROOF.witnesses[0].id)

      for (let i = 1; i < 4; i++) {
        const wallet = await createWallet()
        signatures[i] = await signClaim(onChainProof.signedClaim.claim, wallet)

        await governance.addAttestor('attestor' + i, wallet.address)
      }

      signatures[2] = signatures[3]

      const seed = ethers.randomBytes(32)
      const timestamp = Math.floor(Date.now() / 1000)
      await reclaim.createNewTaskRequest(seed, timestamp)

      onChainProof.signedClaim.signatures = signatures

      const verificationCost = await governance.verificationCost()

      const taskId = await reclaim.currentTask()

      await expect(
        reclaim.verifyProof(onChainProof, taskId, {
          value: verificationCost
        })
      ).to.be.revertedWith('Duplicate signatures found')
    })

    it('Should reject an invalid proof - false identifier', async function () {
      let falseProof = JSON.parse(JSON.stringify(PROOF))

      falseProof.claimData.identifier = FALSE_IDENTIFIER

      //@ts-ignore
      const onChainProof = transformForOnchain(falseProof)

      let signatures = []

      signatures[0] = onChainProof.signedClaim.signatures[0]
      await governance.addAttestor('reclaim-attestor', PROOF.witnesses[0].id)

      for (let i = 1; i < 4; i++) {
        const wallet = await createWallet()
        signatures[i] = await signClaim(onChainProof.signedClaim.claim, wallet)

        await governance.addAttestor('attestor' + i, wallet.address)
      }

      const seed = ethers.randomBytes(32)
      const timestamp = Math.floor(Date.now() / 1000)
      await reclaim.createNewTaskRequest(seed, timestamp)

      onChainProof.signedClaim.signatures = signatures

      const verificationCost = await governance.verificationCost()

      const taskId = await reclaim.currentTask()

      await expect(
        reclaim.verifyProof(onChainProof, taskId, {
          value: verificationCost
        })
      ).to.be.revertedWith('Claim identifier mismatch')
    })

    it('Should reject an invalid proof - failed consensus', async function () {
      const proof = JSON.parse(JSON.stringify(PROOF))

      //@ts-ignore
      const onChainProof = transformForOnchain(proof)

      let signatures: string[] = []

      signatures[0] = onChainProof.signedClaim.signatures[0]
      await governance.addAttestor('reclaim-attestor', PROOF.witnesses[0].id)

      for (let i = 1; i < 4; i++) {
        const wallet = await createWallet()

        signatures[i] = FALSE_SIGNATURES[i - 1]

        await governance.addAttestor('attestor' + i, wallet.address)
      }

      const seed = ethers.randomBytes(32)
      const timestamp = Math.floor(Date.now() / 1000)
      await reclaim.createNewTaskRequest(seed, timestamp)

      onChainProof.signedClaim.signatures = signatures

      const verificationCost = await governance.verificationCost()

      const taskId = await reclaim.currentTask()

      await expect(
        reclaim.verifyProof(onChainProof, taskId, {
          value: verificationCost
        })
      ).to.be.revertedWith('Consensus failed')
      expect(await reclaim.consensusReached(taskId)).to.be.false
    })

    it('Should reject an underpriced proof', async function () {
      //@ts-ignore
      const onChainProof = transformForOnchain(PROOF)

      let signatures = []

      signatures[0] = onChainProof.signedClaim.signatures[0]
      await governance.addAttestor('reclaim-attestor', PROOF.witnesses[0].id)

      for (let i = 1; i < 4; i++) {
        const wallet = await createWallet()
        signatures[i] = await signClaim(onChainProof.signedClaim.claim, wallet)

        await governance.addAttestor('attestor' + i, wallet.address)
      }

      const seed = ethers.randomBytes(32)
      const timestamp = Math.floor(Date.now() / 1000)
      await reclaim.createNewTaskRequest(seed, timestamp)

      onChainProof.signedClaim.signatures = signatures

      const taskId = await reclaim.currentTask()

      await expect(
        reclaim.verifyProof(onChainProof, taskId, {
          value: ethers.parseEther('0.0')
        })
      ).to.be.revertedWith('Verification underpriced')
    })
  })
})
