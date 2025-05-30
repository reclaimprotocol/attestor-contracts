import { expect } from 'chai'
import { ethers } from 'hardhat'
import { loadFixture, mine } from '@nomicfoundation/hardhat-network-helpers'
import { ReclaimTask, Governance } from '../typechain-types'
import type { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers'
import { createWallet } from './utils'

describe('Reclaim', function () {
  let reclaim: ReclaimTask
  let governance: Governance
  let owner: SignerWithAddress
  let attestor1: SignerWithAddress
  let attestor2: SignerWithAddress
  let attestor3: SignerWithAddress

  let user: SignerWithAddress
  const minimumStake = ethers.parseEther('1')
  const unbondingPeriod = 10
  const verificationCost = ethers.parseEther('0.1')

  async function deployContractsFixture() {
    const [
      owner,
      attestor1,
      attestor2,
      attestor3,
      attestor4,
      attestor5,
      attestor6,
      attestor7,
      user
    ] = await ethers.getSigners()

    const GovernanceFactory = await ethers.getContractFactory('Governance')
    governance = await GovernanceFactory.deploy(
      owner.address,
      minimumStake,
      unbondingPeriod
    )

    // Delegate stake and add attestors
    await governance.delegateStake(attestor1.address, { value: minimumStake })
    await governance.delegateStake(attestor2.address, { value: minimumStake })
    await governance.delegateStake(attestor3.address, { value: minimumStake })

    await governance.addAttestor('attestor1', attestor1.address)
    await governance.addAttestor('attestor2', attestor2.address)
    await governance.addAttestor('attestor3', attestor3.address)
    await governance.setVerificationCost(verificationCost)

    const ReclaimFactory = await ethers.getContractFactory('ReclaimTask')
    reclaim = await ReclaimFactory.deploy(
      owner.address,
      await governance.getAddress()
    )

    await reclaim.setRequiredAttestors(1)

    return { reclaim, governance, owner, attestor1, attestor2, attestor3, user }
  }

  beforeEach(async function () {
    ;({ reclaim, governance, owner, attestor1, attestor2, attestor3, user } =
      await loadFixture(deployContractsFixture))
  })

  describe('Deployment', function () {
    it('Should set correct initial values', async function () {
      expect(await reclaim.owner()).to.equal(owner.address)
      expect(await reclaim.governanceAddress()).to.equal(
        await governance.getAddress()
      )
      expect(await reclaim.requiredAttestors()).to.equal(1)
      expect(await reclaim.taskDurationS()).to.equal(86400) // 1 day in seconds
    })

    it('Should create initial task', async function () {
      const initialTask = await reclaim.fetchTask(1)
      expect(initialTask.id).to.equal(1)
      expect(initialTask.attestors.length).to.equal(3)
    })
  })

  describe('Tasks', function () {
    it('Should create a new task request', async function () {
      const seed = ethers.randomBytes(32)
      const timestamp = Math.floor(Date.now() / 1000)
      const tx = await reclaim.createNewTaskRequest(seed, timestamp)

      await expect(tx).to.emit(reclaim, 'TaskAdded')

      const taskId = await reclaim.currentTask()
      expect(taskId).to.equal(2)

      const task = await reclaim.fetchTask(taskId)
      expect(task.id).to.equal(2)
      expect(task.attestors.length).to.equal(1)
      expect(task.timestampStart).to.be.gt(0)
      expect(task.timestampEnd).to.be.gt(task.timestampStart)
    })

    it('Should fetch existing task', async function () {
      const seed = ethers.randomBytes(32)
      const timestamp = Math.floor(Date.now() / 1000)
      await reclaim.createNewTaskRequest(seed, timestamp)

      const taskId = await reclaim.currentTask()
      const task = await reclaim.fetchTask(taskId)

      expect(task.id).to.equal(taskId)
      expect(task.attestors.length).to.equal(1)
    })

    it('Should revert when fetching non-existent task', async function () {
      await expect(reclaim.fetchTask(99)).to.be.revertedWith(
        'Tasks size limit exceeded'
      )
    })

    it('Should revert if fetching a non-existent task', async function () {
      await expect(reclaim.fetchTask(5)).to.be.revertedWith(
        'Tasks size limit exceeded'
      )
    })

    it('Should maintain task history', async function () {
      // Create multiple tasks
      for (let i = 0; i < 3; i++) {
        const seed = ethers.randomBytes(32)
        const timestamp = Math.floor(Date.now() / 1000)
        await reclaim.createNewTaskRequest(seed, timestamp)
        await mine(5)
      }

      const currentTaskId = await reclaim.currentTask()
      expect(currentTaskId).to.equal(4)

      // Verify all tasks are accessible
      for (let taskId = 1; taskId <= 4; taskId++) {
        const task = await reclaim.fetchTask(taskId)
        expect(task.id).to.equal(taskId)
      }
    })
  })

  describe('Attestor Selection', function () {
    it('Should select correct number of attestors', async function () {
      // Increase required attestors
      await reclaim.setRequiredAttestors(2)

      const seed = ethers.randomBytes(32)
      const timestamp = Math.floor(Date.now() / 1000)
      await reclaim.createNewTaskRequest(seed, timestamp)

      const taskId = await reclaim.currentTask()
      const task = await reclaim.fetchTask(taskId)
      expect(task.attestors.length).to.equal(2)
    })

    it('Should revert when not enough qualified attestors', async function () {
      // Slash all attestors to disqualify them
      await governance.removeAttestor('attestor1')
      await governance.removeAttestor('attestor2')
      await governance.removeAttestor('attestor3')

      const seed = ethers.randomBytes(32)
      const timestamp = Math.floor(Date.now() / 1000)
      await expect(
        reclaim.createNewTaskRequest(seed, timestamp)
      ).to.be.rejectedWith('Not enough attestors')
    })

    // it('Should select different attestors for different seeds', async function () {
    //   await reclaim.setRequiredAttestors(1)

    //   for (let i = 0; i < 100; i++) {
    //     const wallet = await createWallet()
    //     await governance.delegateStake(wallet.address, { value: minimumStake })
    //     await governance.addAttestor('wallet' + i, wallet.address)
    //   }

    //   const seed1 = ethers.randomBytes(32)
    //   const seed2 = ethers.hexlify(ethers.randomBytes(32))
    //   const timestamp = Math.floor(Date.now() / 1000)

    //   await reclaim.createNewTaskRequest(seed1, timestamp)
    //   const task1 = await reclaim.fetchTask(2)

    //   await reclaim.createNewTaskRequest(seed2, timestamp)
    //   const task2 = await reclaim.fetchTask(3)

    //   // Should have different attestors 99% of the time (probabilistic)
    //   expect(task1.attestors[0].addr).to.not.equal(task2.attestors[0].addr)
    // })
  })

  describe('Ownership', function () {
    it('Should allow owner to set required attestors', async function () {
      await reclaim.setRequiredAttestors(3)
      expect(await reclaim.requiredAttestors()).to.equal(3)
    })

    it('Should prevent non-owners from setting required attestors', async function () {
      await expect(
        reclaim.connect(user).setRequiredAttestors(3)
      ).to.be.revertedWithCustomError(reclaim, 'OwnableUnauthorizedAccount')
    })
  })
})
