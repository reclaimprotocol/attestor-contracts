import { expect } from 'chai'
import { ethers } from 'hardhat'
import { loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import { ReclaimTask, Governance } from '../typechain-types'
import {
  createWallet,
  FALSE_IDENTIFIER,
  PROOF,
  signClaim,
  FALSE_SIGNATURES
} from './utils'
import type { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers'
import { transformForOnchain } from '@reclaimprotocol/js-sdk'

describe('Integration', function () {
  const minimumStake = ethers.parseEther('1')
  const unbondingPeriod = 10
  const verificationCost = ethers.parseEther('2.0')

  let reclaim: ReclaimTask
  let governance: Governance
  let owner: SignerWithAddress

  async function deployContractsFixture() {
    const [owner] = await ethers.getSigners()

    const GovernanceFactory = await ethers.getContractFactory('Governance')
    governance = await GovernanceFactory.deploy(
      owner.address,
      minimumStake,
      unbondingPeriod
    )

    const ReclaimFactory = await ethers.getContractFactory('ReclaimTask')
    reclaim = await ReclaimFactory.deploy(
      owner.address,
      await governance.getAddress()
    )

    await governance.setVerificationCost(verificationCost)
    await governance.setReclaimContractAddress(await reclaim.getAddress())
    await reclaim.setRequiredAttestors(4)

    return { reclaim, governance, owner }
  }

  async function setupAttestors(proofCount: number) {
    //@ts-ignore
    const onChainProof = transformForOnchain(PROOF)
    const proofs = []
    const attestors = []

    // Create primary attestor
    const primaryWallet = await createWallet()
    //@ts-ignore
    await governance.delegateStake(PROOF.witnesses[0].id, {
      value: minimumStake
    })
    //@ts-ignore
    await governance.addAttestor('reclaim-attestor', PROOF.witnesses[0].id)

    proofs[0] = { ...onChainProof }
    //@ts-ignore
    attestors.push(PROOF.witnesses[0].id)

    // Create additional attestors
    for (let i = 1; i < proofCount; i++) {
      const wallet = await createWallet()
      const proofCopy = JSON.parse(JSON.stringify(onChainProof))

      proofCopy.signedClaim.signatures[0] = await signClaim(
        onChainProof.signedClaim.claim,
        wallet
      )

      await governance.delegateStake(wallet.address, { value: minimumStake })
      await governance.addAttestor(`attestor-${i}`, wallet.address)

      proofs[i] = proofCopy
      attestors.push(wallet.address)
    }

    return { proofs, attestors, onChainProof }
  }

  async function createTask() {
    const seed = ethers.randomBytes(32)
    const timestamp = Math.floor(Date.now() / 1000)
    await reclaim.createNewTaskRequest(seed, timestamp)
    return await reclaim.currentTask()
  }

  beforeEach(async function () {
    ;({ reclaim, governance, owner } = await loadFixture(
      deployContractsFixture
    ))
  })
  describe('Verification', function () {
    it('should verify valid proofs and reach consensus', async function () {
      const { proofs } = await setupAttestors(4)
      const taskId = await createTask()

      const tx = await reclaim.verifyProofs(proofs, taskId, {
        value: verificationCost
      })

      await expect(tx).to.not.be.reverted
      expect(await reclaim.consensusReached(taskId)).to.be.true
    })

    it('should reject proofs with duplicate signatures', async function () {
      const { proofs } = await setupAttestors(4)

      // Create duplicate signature
      proofs[2].signedClaim.signatures[0] = proofs[3].signedClaim.signatures[0]

      const taskId = await createTask()

      await expect(
        reclaim.verifyProofs(proofs, taskId, {
          value: verificationCost
        })
      ).to.be.revertedWith('Duplicate signatures found')
    })

    it('should reject proofs with insufficient consensus', async function () {
      const { proofs, onChainProof } = await setupAttestors(4)

      // Invalidate 3 out of 4 proofs
      for (let i = 1; i < 4; i++) {
        proofs[i].signedClaim.signatures[0] = FALSE_SIGNATURES[i - 1]
      }

      const taskId = await createTask()

      await expect(
        reclaim.verifyProofs(proofs, taskId, {
          value: verificationCost
        })
      ).to.be.revertedWith('Consensus failed')
      expect(await reclaim.consensusReached(taskId)).to.be.false
    })

    it('should reject proofs with 50/50 consensus split', async function () {
      // Set to 2 attestors for 50/50 test
      await reclaim.setRequiredAttestors(2)
      const { proofs } = await setupAttestors(2)

      // Invalidate one proof
      proofs[1].signedClaim.signatures[0] = FALSE_SIGNATURES[0]

      const taskId = await createTask()

      await expect(
        reclaim.verifyProofs(proofs, taskId, {
          value: verificationCost
        })
      ).to.be.revertedWith('Consensus failed')
      expect(await reclaim.consensusReached(taskId)).to.be.false
    })

    it('should reject underpriced verification attempts', async function () {
      const { proofs } = await setupAttestors(4)
      const taskId = await createTask()

      await expect(
        reclaim.verifyProofs(proofs, taskId, {
          value: verificationCost / 2n
        })
      ).to.be.revertedWith('Verification underpriced')
    })

    it('should reject already processed tasks', async function () {
      const { proofs } = await setupAttestors(4)
      const taskId = await createTask()

      // First successful verification
      await reclaim.verifyProofs(proofs, taskId, {
        value: verificationCost
      })

      // Attempt second verification
      await expect(
        reclaim.verifyProofs(proofs, taskId, {
          value: verificationCost
        })
      ).to.be.revertedWith('Task already processed')
    })
  })

  describe('Reward Distribution', function () {
    it('should distribute rewards proportionally to attestor stakes', async function () {
      const stakes = [
        ethers.parseEther('10'),
        ethers.parseEther('20'),
        ethers.parseEther('30'),
        ethers.parseEther('40')
      ]

      const attestors = []
      const proofs = []
      //@ts-ignore
      const onChainProof = transformForOnchain(PROOF)
      const totalStake = stakes.reduce((sum, stake) => sum + stake, 0n)
      // Create attestors with different stakes
      for (let i = 0; i < 4; i++) {
        const wallet = await createWallet(50)
        const proofCopy = JSON.parse(JSON.stringify(onChainProof))

        proofCopy.signedClaim.signatures[0] = await signClaim(
          onChainProof.signedClaim.claim,
          wallet
        )

        // Stake and add attestor
        await governance.connect(wallet).stake({ value: stakes[i] })
        await governance.addAttestor(`attestor-${i}`, wallet.address)

        proofs[i] = proofCopy
        attestors.push(wallet.address)
      }

      const taskId = await createTask()
      await reclaim.verifyProofs(proofs, taskId, {
        value: verificationCost
      })
      // Verify proportional rewards
      for (let i = 0; i < 4; i++) {
        const expectedReward = (verificationCost * stakes[i]) / totalStake
        const actualReward = await governance.pendingRewards(attestors[i])

        expect(actualReward).to.be.closeTo(
          expectedReward,
          ethers.parseEther('0.001') // Account for rounding
        )
      }
    })
  })

  describe('Slashing Mechanism', function () {
    it('should slash attestors providing invalid proofs', async function () {
      const { proofs, attestors, onChainProof } = await setupAttestors(4)
      const taskId = await createTask()

      // 5 is the default
      const fradulentProofPenalityFactor =
        await governance.fradulentProofPenalityFactor()

      // Track initial stakes
      const initialStakes = await Promise.all(
        attestors.map((addr) => governance.stakedAmounts(addr))
      )

      // Invalidate one proof
      proofs[3].signedClaim.signatures[0] = FALSE_SIGNATURES[0]

      const tx = await reclaim.verifyProofs(proofs, taskId, {
        value: verificationCost
      })

      await expect(tx).to.emit(reclaim, 'AttestorSlashed')

      const finalStakes = await Promise.all(
        attestors.map((addr) => governance.stakedAmounts(addr))
      )

      // Verify slashing occurred
      const slashAmount = await governance.totalSlashedAmount()

      expect(slashAmount).to.be.gt(0)

      expect(slashAmount).to.equal(
        (fradulentProofPenalityFactor * initialStakes[3]) / 100n
      )

      // Verify attestor stake was reduced
      const finalStake = await governance.stakedAmounts(attestors[3])
      expect(finalStake).to.be.lt(initialStakes[3])

      // Verify other attestors remain untouched
      for (let i = 0; i < 3; i++) {
        expect(initialStakes[i]).to.equal(finalStakes[i])
      }
    })
  })
})
