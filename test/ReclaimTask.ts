import { expect } from 'chai'
import { ethers } from 'hardhat'
import { ReclaimTask, Governance } from '../typechain-types'

describe('Reclaim', function () {
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

    await governance.addAttestors('attestor1', attestor1.address)
    await governance.addAttestors('attestor2', attestor2.address)
    await governance.addAttestors('attestor3', attestor3.address)

    const ReclaimFactory = await ethers.getContractFactory('ReclaimTask')
    reclaim = await ReclaimFactory.deploy(
      owner.address,
      governance.getAddress()
    )

    await reclaim.setMinimumAttestors(1)
  })

  describe('Tasks', function () {
    it('Should create a new task request', async function () {
      const seed = ethers.randomBytes(32)
      const timestamp = Math.floor(Date.now() / 1000)
      await reclaim.createNewTaskRequest(seed, timestamp)

      const taskId = await reclaim.currentTask()
      expect(taskId).to.equal(2)

      const fetchedTask = await reclaim.fetchTask(taskId)
      const attestors = fetchedTask.attestors

      expect(attestors.length).to.equal(await reclaim.minimumAttestors())
      expect(attestors.length).to.be.at.least(1) // Ensure at least 1 attestor is selected
      expect(fetchedTask.id).to.equal(taskId)
      expect(fetchedTask.minimumAttestorsForClaimCreation).to.equal(
        await reclaim.minimumAttestors()
      )
    })

    it('Should fetch a task', async function () {
      const seed = ethers.randomBytes(32)
      const timestamp = Math.floor(Date.now() / 1000)
      await reclaim.createNewTaskRequest(seed, timestamp)
      const taskId = await reclaim.currentTask()
      const fetchedTask = await reclaim.fetchTask(taskId)
      expect(fetchedTask.id).to.equal(taskId)
    })

    it('Should revert if fetching a non-existent task', async function () {
      await expect(reclaim.fetchTask(5)).to.be.revertedWith(
        'Tasks size limit exceeded'
      )
    })
  })

  describe('Settings', function () {
    it('Should set minimum attestors', async function () {
      await reclaim.setMinimumAttestors(3)
      expect(await reclaim.minimumAttestors()).to.equal(3)
    })
  })

  describe('Ownership', function () {
    it('Should prevent non-owners from setting minimum attestors', async function () {
      await expect(reclaim.connect(attestor1).setMinimumAttestors(3)).to.be
        .reverted
    })
  })
})
