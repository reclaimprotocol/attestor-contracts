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
  describe('Verification', function () {
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

      await governance.setVerificationCost(ethers.parseEther('2.0'))

      await governance.setReclaimContractAddress(reclaim.getAddress())
    })

    it('Should verify valid proofs', async function () {
      //@ts-ignore
      const onChainProof = transformForOnchain(PROOF)

      let proofs = []
      let signatures = []

      proofs[0] = onChainProof
      signatures[0] = onChainProof.signedClaim.signatures[0]
      await governance.addAttestor('reclaim-attestor', PROOF.witnesses[0].id)

      for (let i = 1; i < 4; i++) {
        proofs[i] = JSON.parse(JSON.stringify(onChainProof))

        const wallet = await createWallet()
        proofs[i].signedClaim.signatures[0] = await signClaim(
          onChainProof.signedClaim.claim,
          wallet
        )

        await governance.addAttestor('attestor' + i, wallet.address)
      }

      const seed = ethers.randomBytes(32)
      const timestamp = Math.floor(Date.now() / 1000)
      await reclaim.createNewTaskRequest(seed, timestamp)

      const verificationCost = await governance.verificationCost()

      const taskId = await reclaim.currentTask()

      await reclaim.verifyProofs(proofs, taskId, {
        value: verificationCost
      })
      expect(await reclaim.consensusReached(taskId)).to.be.true
    })

    it('Should reject invalid proofs - duplicated signatures', async function () {
      //@ts-ignore
      const onChainProof = transformForOnchain(PROOF)

      let proofs = []
      let signatures = []

      proofs[0] = onChainProof
      signatures[0] = onChainProof.signedClaim.signatures[0]
      await governance.addAttestor('reclaim-attestor', PROOF.witnesses[0].id)

      for (let i = 1; i < 4; i++) {
        proofs[i] = JSON.parse(JSON.stringify(onChainProof))

        const wallet = await createWallet()
        proofs[i].signedClaim.signatures[0] = await signClaim(
          onChainProof.signedClaim.claim,
          wallet
        )

        await governance.addAttestor('attestor' + i, wallet.address)
      }

      proofs[2].signedClaim.signatures[0] = proofs[3].signedClaim.signatures[0]

      const seed = ethers.randomBytes(32)
      const timestamp = Math.floor(Date.now() / 1000)
      await reclaim.createNewTaskRequest(seed, timestamp)

      const verificationCost = await governance.verificationCost()

      const taskId = await reclaim.currentTask()

      await expect(
        reclaim.verifyProofs(proofs, taskId, {
          value: verificationCost
        })
      ).to.be.revertedWith('Duplicate signatures found')
    })

    it('Should reject an invalid proof - failed consensus', async function () {
      //@ts-ignore
      const onChainProof = transformForOnchain(PROOF)

      let proofs = []
      let signatures = []

      proofs[0] = onChainProof
      signatures[0] = onChainProof.signedClaim.signatures[0]
      await governance.addAttestor('reclaim-attestor', PROOF.witnesses[0].id)

      for (let i = 1; i < 4; i++) {
        proofs[i] = JSON.parse(JSON.stringify(onChainProof))

        const wallet = await createWallet()
        proofs[i].signedClaim.signatures[0] = FALSE_SIGNATURES[i - 1]

        await governance.addAttestor('attestor' + i, wallet.address)
      }

      const seed = ethers.randomBytes(32)
      const timestamp = Math.floor(Date.now() / 1000)
      await reclaim.createNewTaskRequest(seed, timestamp)

      const verificationCost = await governance.verificationCost()

      const taskId = await reclaim.currentTask()

      await expect(
        reclaim.verifyProofs(proofs, taskId, {
          value: verificationCost
        })
      ).to.be.revertedWith('Consensus failed')
      expect(await reclaim.consensusReached(taskId)).to.be.false
    })

    it('Should reject an underpriced proof', async function () {
      //@ts-ignore
      const onChainProof = transformForOnchain(PROOF)

      let proofs = []
      let signatures = []

      proofs[0] = onChainProof
      signatures[0] = onChainProof.signedClaim.signatures[0]
      await governance.addAttestor('reclaim-attestor', PROOF.witnesses[0].id)

      for (let i = 1; i < 4; i++) {
        proofs[i] = JSON.parse(JSON.stringify(onChainProof))

        const wallet = await createWallet()
        proofs[i].signedClaim.signatures[0] = await signClaim(
          onChainProof.signedClaim.claim,
          wallet
        )

        await governance.addAttestor('attestor' + i, wallet.address)
      }

      const seed = ethers.randomBytes(32)
      const timestamp = Math.floor(Date.now() / 1000)
      await reclaim.createNewTaskRequest(seed, timestamp)

      const taskId = await reclaim.currentTask()

      await expect(
        reclaim.verifyProofs(proofs, taskId, {
          value: ethers.parseEther('1.0')
        })
      ).to.be.revertedWith('Verification underpriced')
    })
  })

  describe('Dynamicity', function () {
    let reclaim: ReclaimTask
    let governance: Governance
    let owner: any

    const minimumStake = ethers.parseEther('10')
    const unbondingPeriod = 10

    beforeEach(async function () {
      ;[owner] = await ethers.getSigners()

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

      await governance.setVerificationCost(ethers.parseEther('2.0'))

      await governance.setReclaimContractAddress(reclaim.getAddress())
    })

    it('Should reward honest attestors', async function () {
      //@ts-ignore
      const onChainProof = transformForOnchain(PROOF)

      let proofs = []
      let signatures = []
      let addresses = []
      let stakes = ['10', '20', '30', '40']

      for (let i = 0; i < 4; i++) {
        proofs[i] = JSON.parse(JSON.stringify(onChainProof))
        const wallet = await createWallet(100)
        addresses[i] = wallet.address

        await governance
          .connect(wallet)
          .stake({ value: ethers.parseEther(stakes[i]) })

        proofs[i].signedClaim.signatures[0] = await signClaim(
          onChainProof.signedClaim.claim,
          wallet
        )

        await governance.addAttestor('attestor' + i, wallet.address)
      }

      const seed = ethers.randomBytes(32)
      const timestamp = Math.floor(Date.now() / 1000)
      await reclaim.createNewTaskRequest(seed, timestamp)

      const verificationCost = await governance.verificationCost()

      const taskId = await reclaim.currentTask()

      await reclaim.verifyProofs(proofs, taskId, {
        value: verificationCost
      })
      expect(await reclaim.consensusReached(taskId)).to.be.true

      const attestor1Rewards = await governance.pendingRewards(addresses[0])
      const attestor2Rewards = await governance.pendingRewards(addresses[1])
      const attestor3Rewards = await governance.pendingRewards(addresses[2])
      const attestor4Rewards = await governance.pendingRewards(addresses[3])

      expect(attestor1Rewards).to.equal(ethers.parseEther('0.2')) // 10 / 100 * 2 = 0.2
      expect(attestor2Rewards).to.equal(ethers.parseEther('0.4')) // 20 / 100 * 2 = 0.4
      expect(attestor3Rewards).to.equal(ethers.parseEther('0.6')) // 30 / 100 * 2 = 0.6
      expect(attestor4Rewards).to.equal(ethers.parseEther('0.8')) // 40 / 100 * 2 = 0.8
    })
  })
})
