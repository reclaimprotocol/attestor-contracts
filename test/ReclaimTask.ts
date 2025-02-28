import { expect } from 'chai'
import { ethers } from 'hardhat'
import { ReclaimTask, Governance } from '../typechain-types'

describe('Reclaim', function () {
  let reclaim: ReclaimTask
  let governance: Governance
  let owner: any
  let addr1: any
  let addr2: any
  let addr3: any
  let attestor1: any
  let attestor2: any
  let attestor3: any
  const minimumStake = ethers.parseEther('1')
  const unbondingPeriod = 10

  beforeEach(async function () {
    ;[owner, addr1, addr2, addr3, attestor1, attestor2, attestor3] =
      await ethers.getSigners()

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

  //   describe("Verification", function () {

  //     it("Should verify a valid proof", async function () {
  //         const seed = ethers.randomBytes(32);
  //         const timestamp = Math.floor(Date.now() / 1000);
  //         const [taskId, attestors] = await reclaim.createNewTaskRequest(seed, timestamp);

  //         const claimInfo = { /* ... create a valid ClaimInfo object ... */ }; // Replace with actual ClaimInfo
  //         const hashed = await Claims.hashClaimInfo(claimInfo);
  //         const claim = { identifier: hashed };
  //         const signatures = [];

  //         //Attestors sign the claim
  //         for (let i = 0; i < attestors.length; i++) {
  //           const signed = await attestors[i].addr.signMessage(ethers.getBytes(hashed));
  //           signatures.push(signed);
  //         }

  //         const signedClaim = { claim: claim, signatures: signatures };
  //         const proof = { claimInfo: claimInfo, signedClaim: signedClaim };

  //         const verificationResult = await reclaim.verifyProof(proof, taskId);
  //         expect(verificationResult).to.be.true;
  //         expect(await reclaim.Verifications(taskId)).to.be.true;
  //       });
  //  });

  describe('Settings', function () {
    it('Should set minimum attestors', async function () {
      await reclaim.setMinimumAttestors(3)
      expect(await reclaim.minimumAttestors()).to.equal(3)
    })
  })

  describe('Ownership', function () {
    it('Should prevent non-owners from setting minimum attestors', async function () {
      await expect(reclaim.connect(addr1).setMinimumAttestors(3)).to.be.reverted
    })
  })
})
