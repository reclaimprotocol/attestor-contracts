import { expect } from 'chai'
import { ethers } from 'hardhat'
import { Governance } from '../typechain-types'

describe('Governance', function () {
  let governance: Governance
  let owner: any
  let attestor1: any
  let attestor2: any
  let attestor3: any
  let attestor4: any
  const minimumStake = ethers.parseEther('1')
  const unbondingPeriod = 10 // 10 blocks for testing

  beforeEach(async function () {
    ;[owner, attestor1, attestor2, attestor3, attestor4] =
      await ethers.getSigners()
    const GovernanceFactory = await ethers.getContractFactory('Governance')
    governance = (await GovernanceFactory.deploy(
      owner.address,
      minimumStake,
      unbondingPeriod
    )) as Governance

    await governance.delegateStake(attestor1.address, { value: minimumStake })
    await governance.delegateStake(attestor2.address, { value: minimumStake })
    await governance.delegateStake(attestor3.address, { value: minimumStake })
  })

  describe('Attestors', function () {
    it('Should add an attestor', async function () {
      await governance.addAttestor('attestor1', attestor1.address)
      const attestorAddress = await governance.getAttestor('attestor1')
      expect(attestorAddress).to.equal(attestor1.address)
    })

    it('Should revert if adding an existing attestor', async function () {
      await governance.addAttestor('attestor1', attestor1.address)
      await expect(
        governance.addAttestor('attestor1', attestor2.address)
      ).to.be.revertedWith('Attestor already exists')
    })

    it('Should remove an attestor', async function () {
      await governance.addAttestor('attestor1', attestor1.address)
      await governance.removeAttestor('attestor1')
      const attestorAddress = await governance.getAttestor('attestor1')
      expect(attestorAddress).to.equal(ethers.ZeroAddress)
    })

    it('Should revert if removing a non-existent attestor', async function () {
      await expect(governance.removeAttestor('attestor1')).to.be.revertedWith(
        'Attestor does not exist'
      )
    })

    it('Should get all attestors', async function () {
      await governance.addAttestor('attestor1', attestor1.address)
      await governance.addAttestor('attestor2', attestor2.address)
      const [keys, addresses] = await governance.getAttestors()
      expect(keys).to.deep.equal(['attestor1', 'attestor2'])
      expect(addresses).to.deep.equal([attestor1.address, attestor2.address])
    })

    it('Should maintain order in getAttestors after removal', async function () {
      await governance.addAttestor('attestor1', attestor1.address)
      await governance.addAttestor('attestor2', attestor2.address)
      await governance.removeAttestor('attestor1')
      const [keys, addresses] = await governance.getAttestors()
      expect(keys[0]).to.equal('attestor2')
      expect(addresses[0]).to.equal(attestor2.address)
    })
  })

  describe('Settings', function () {
    it('Should set verification cost', async function () {
      const cost = 100
      await governance.setVerificationCost(cost)
      expect(await governance.verificationCost()).to.equal(cost)
    })
  })

  describe('Ownership', function () {
    it('Should set the owner during construction', async function () {
      expect(await governance.owner()).to.equal(owner.address)
    })

    it('Should allow the owner to transfer ownership', async function () {
      await governance.transferOwnership(attestor1.address)
      expect(await governance.owner()).to.equal(attestor1.address)
    })

    it('Should prevent non-owners from calling owner-only functions', async function () {
      await expect(
        governance
          .connect(attestor1)
          .addAttestor('attestor1', attestor1.address)
      ).to.be.reverted

      await expect(governance.connect(attestor1).removeAttestor('attestor1')).to
        .be.reverted

      await expect(governance.connect(attestor1).setVerificationCost(100)).to.be
        .reverted
    })
  })

  describe('stake', function () {
    it('Should allow Attestor to stake native currency', async function () {
      const totalStaked = await governance.totalStaked()
      const initialStake = await governance.stakedAmounts(attestor1.address)
      await governance.connect(attestor1).stake({ value: minimumStake })
      expect(await governance.stakedAmounts(attestor1.address)).to.equal(
        initialStake + minimumStake
      )
      expect(await governance.totalStaked()).to.equal(
        minimumStake + totalStaked
      )
    })

    it('Should revert if stake amount is below minimum', async function () {
      const smallStake = ethers.parseEther('0.5')
      await expect(
        governance.connect(attestor1).stake({ value: smallStake })
      ).to.be.revertedWith('Amount below minimum stake')
    })
  })

  describe('requestUnstake', function () {
    beforeEach(async function () {
      await governance.connect(attestor1).stake({ value: minimumStake })
    })

    it('Should allow Attestor to request unstake', async function () {
      await governance.connect(attestor1).requestUnstake()
      expect(await governance.unstakeRequestBlocks(attestor1.address)).to.equal(
        await ethers.provider.getBlockNumber()
      )
    })

    it('Should revert if Attestor has no staked tokens', async function () {
      await expect(
        governance.connect(attestor4).requestUnstake()
      ).to.be.revertedWith('No staked tokens')
    })

    it('Should revert if Attestor already requested unstake', async function () {
      await governance.connect(attestor1).requestUnstake()
      await expect(
        governance.connect(attestor1).requestUnstake()
      ).to.be.revertedWith('Unstake already requested')
    })
  })

  describe('unstake', function () {
    beforeEach(async function () {
      await governance.connect(attestor1).stake({ value: minimumStake })
      await governance.connect(attestor1).requestUnstake()
    })

    it('Should allow Attestor to unstake after unbonding period', async function () {
      const totalStaked = await governance.totalStaked()

      for (let i = 0; i < unbondingPeriod; i++) {
        await ethers.provider.send('evm_mine')
      }

      const initialBalance = await ethers.provider.getBalance(attestor1.address)
      let tx = await governance.connect(attestor1).unstake()
      // @ts-ignore
      const fee = tx.gasPrice * tx.gasLimit
      const finalBalance = await ethers.provider.getBalance(attestor1.address)
      expect(finalBalance - initialBalance + fee).to.be.gte(minimumStake)
      expect(await governance.stakedAmounts(attestor1.address)).to.equal(0)
    })

    it('Should revert if unbonding period is not passed', async function () {
      await expect(governance.connect(attestor1).unstake()).to.be.revertedWith(
        'Unbonding period not passed'
      )
    })
  })

  describe('slash', function () {
    it('Should allow owner to slash tokens', async function () {
      await governance.connect(attestor1).stake({ value: minimumStake })
      await governance.slash(ethers.parseEther('0.5'))
      expect(await governance.totalSlashedAmount()).to.equal(
        ethers.parseEther('0.5')
      )
    })

    it('Should revert if slash amount exceeds total staked', async function () {
      await expect(
        governance.slash(ethers.parseEther('10'))
      ).to.be.revertedWith('Slash amount exceeds total staked')
    })
  })

  describe('withdraw', function () {
    it('Should allow owner to withdraw all funds', async function () {
      await governance.connect(attestor1).stake({ value: minimumStake })
      const initialOwnerBalance = await ethers.provider.getBalance(
        owner.address
      )
      const initialContractBalance = await ethers.provider.getBalance(
        governance.getAddress()
      )
      const tx = await governance.withdraw()
      // @ts-ignore
      const fee = tx.gasPrice * tx.gasLimit
      const finalOwnerBalance = await ethers.provider.getBalance(owner.address)
      const finalContractBalance = await ethers.provider.getBalance(
        governance.getAddress()
      )
      expect(finalContractBalance).to.equal(0)
      expect(finalOwnerBalance - initialOwnerBalance + fee).to.be.gte(
        initialContractBalance
      )
    })
  })

  describe('rewards', function () {
    beforeEach(async function () {
      await governance.setVerificationCost(ethers.parseEther('5'))

      await governance.addAttestor('attestor1', attestor1.address)
      await governance.addAttestor('attestor2', attestor2.address)
      await governance.addAttestor('attestor3', attestor3.address)

      await governance
        .connect(attestor1)
        .stake({ value: ethers.parseEther('1') })
      await governance
        .connect(attestor2)
        .stake({ value: ethers.parseEther('3') })
      await governance
        .connect(attestor3)
        .stake({ value: ethers.parseEther('3') })
    })

    it('should register rewards correctly for specified attestors', async function () {
      await governance
        .connect(owner)
        .registerRewards([attestor1.address, attestor2.address])

      const attestor1Rewards = await governance.pendingRewards(
        attestor1.address
      )
      const attestor2Rewards = await governance.pendingRewards(
        attestor2.address
      )
      const attestor3Rewards = await governance.pendingRewards(
        attestor3.address
      )

      expect(attestor1Rewards).to.equal(ethers.parseEther('1')) // 2 / 10 * 5 = 1
      expect(attestor2Rewards).to.equal(ethers.parseEther('2')) // 4 / 10 * 5 = 2
      expect(attestor3Rewards).to.equal(ethers.parseEther('0'))
    })

    it('should allow attestors to claim rewards', async function () {
      await governance.connect(owner).registerRewards([attestor1.address])

      const initialBalance = await ethers.provider.getBalance(attestor1.address)
      await governance.connect(attestor1).claimRewards()
      const finalBalance = await ethers.provider.getBalance(attestor1.address)

      const attestor1Rewards = await governance.pendingRewards(
        attestor1.address
      )
      expect(attestor1Rewards).to.equal(ethers.parseEther('0'))

      expect(finalBalance - initialBalance).to.be.closeTo(
        ethers.parseEther('1'),
        ethers.parseEther('0.01')
      ) // Account for gas
    })

    it('should not allow claiming rewards if there are none', async function () {
      await expect(
        governance.connect(attestor1).claimRewards()
      ).to.be.revertedWith('No rewards to claim')
    })

    it('should return if total staked is zero during reward registration', async function () {
      await governance.connect(attestor1).requestUnstake()
      for (let i = 0; i < unbondingPeriod; i++) {
        await ethers.provider.send('evm_mine')
      }
      await governance.connect(attestor1).unstake()

      await governance.connect(attestor2).requestUnstake()
      for (let i = 0; i < unbondingPeriod; i++) {
        await ethers.provider.send('evm_mine')
      }
      await governance.connect(attestor2).unstake()

      await governance.connect(attestor3).requestUnstake()
      for (let i = 0; i < unbondingPeriod; i++) {
        await ethers.provider.send('evm_mine')
      }
      await governance.connect(attestor3).unstake()

      await expect(
        governance.connect(owner).registerRewards([attestor1.address])
      ).to.be.fulfilled
    })
  })
})
