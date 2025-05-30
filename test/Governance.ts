import { expect } from 'chai'
import { ethers } from 'hardhat'
import { loadFixture, mine } from '@nomicfoundation/hardhat-network-helpers'
import { Governance } from '../typechain-types'
import { SignerWithAddress } from '@nomicfoundation/hardhat-ethers/signers'

describe('Governance', function () {
  let governance: Governance
  let owner: SignerWithAddress
  let attestor1: SignerWithAddress
  let attestor2: SignerWithAddress
  let attestor3: SignerWithAddress
  let attestor4: SignerWithAddress
  const minimumStake = ethers.parseEther('1')
  const unbondingPeriod = 10 // 10 blocks for testing

  async function deployGovernanceFixture() {
    const [owner, attestor1, attestor2, attestor3, attestor4] =
      await ethers.getSigners()
    const GovernanceFactory = await ethers.getContractFactory('Governance')
    const governance = (await GovernanceFactory.deploy(
      owner.address,
      minimumStake,
      unbondingPeriod
    )) as Governance

    // Delegate stake using owner
    await governance.delegateStake(attestor1.address, { value: minimumStake })
    await governance.delegateStake(attestor2.address, { value: minimumStake })
    await governance.delegateStake(attestor3.address, { value: minimumStake })

    return { governance, owner, attestor1, attestor2, attestor3, attestor4 }
  }

  beforeEach(async function () {
    ;({ governance, owner, attestor1, attestor2, attestor3, attestor4 } =
      await loadFixture(deployGovernanceFixture))
  })

  describe('Attestors', function () {
    it('Should add an attestor', async function () {
      await governance.addAttestor('attestor1', attestor1.address)
      expect(await governance.getAttestor('attestor1')).to.equal(
        attestor1.address
      )
    })

    it('Should revert if adding an existing attestor', async function () {
      await governance.addAttestor('attestor1', attestor1.address)
      await expect(
        governance.addAttestor('attestor1', attestor2.address)
      ).to.be.revertedWith('Attestor already exists')
    })

    it('Should revert if adding an attestor with not enough stake', async function () {
      await expect(
        governance.addAttestor('attestor4', attestor4.address)
      ).to.be.revertedWith('Not enough staked tokens')
    })

    it('Should remove an attestor', async function () {
      await governance.addAttestor('attestor1', attestor1.address)
      await governance.removeAttestor('attestor1')
      expect(await governance.getAttestor('attestor1')).to.equal(
        ethers.ZeroAddress
      )
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
      await governance.addAttestor('attestor3', attestor3.address)

      await governance.removeAttestor('attestor1')
      const [keys, addresses] = await governance.getAttestors()

      expect(keys).to.deep.equal(['attestor2', 'attestor3'])
      expect(addresses).to.deep.equal([attestor2.address, attestor3.address])
    })
  })

  describe('Settings', function () {
    it('Should set verification cost', async function () {
      const cost = 100
      await governance.setVerificationCost(cost)
      expect(await governance.verificationCost()).to.equal(cost)
    })

    it('Should revert when non-owner sets verification cost', async function () {
      await expect(
        governance.connect(attestor1).setVerificationCost(100)
      ).to.be.revertedWithCustomError(governance, 'OwnableUnauthorizedAccount')
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
      ).to.be.revertedWithCustomError(governance, 'OwnableUnauthorizedAccount')

      await expect(
        governance.connect(attestor1).removeAttestor('attestor1')
      ).to.be.revertedWithCustomError(governance, 'OwnableUnauthorizedAccount')
    })
  })

  describe('Staking', function () {
    it('Should allow Attestor to stake native currency', async function () {
      const initialStake = await governance.stakedAmounts(attestor1.address)
      const tx = await governance
        .connect(attestor1)
        .stake({ value: minimumStake })

      await expect(tx).to.changeEtherBalances(
        [attestor1, governance],
        [minimumStake * -1n, minimumStake]
      )

      expect(await governance.stakedAmounts(attestor1.address)).to.equal(
        initialStake + minimumStake
      )
    })

    it('Should revert if stake amount is below minimum', async function () {
      const smallStake = ethers.parseEther('0.5')
      await expect(
        governance.connect(attestor1).stake({ value: smallStake })
      ).to.be.revertedWith('Amount below minimum stake')
    })

    it('Should correctly update total staked', async function () {
      const initialTotal = await governance.totalStaked()
      await governance.connect(attestor1).stake({ value: minimumStake })
      expect(await governance.totalStaked()).to.equal(
        initialTotal + minimumStake
      )
    })
  })

  describe('Unstaking', function () {
    const stakeAmount = ethers.parseEther('1.5')

    beforeEach(async function () {
      await governance.connect(attestor1).stake({ value: stakeAmount })
      await governance.connect(attestor1).requestUnstake()
    })

    it('Should allow requesting unstake', async function () {
      expect(await governance.unstakeRequestBlocks(attestor1.address)).to.equal(
        await ethers.provider.getBlockNumber()
      )
    })

    it('Should revert if no staked tokens', async function () {
      await expect(
        governance.connect(attestor4).requestUnstake()
      ).to.be.revertedWith('No staked tokens')
    })

    it('Should revert if unstake already requested', async function () {
      await expect(
        governance.connect(attestor1).requestUnstake()
      ).to.be.revertedWith('Unstake already requested')
    })

    it('Should allow unstaking after unbonding period', async function () {
      await mine(unbondingPeriod)

      const tx = await governance.connect(attestor1).unstake()
      const compoundStake = stakeAmount + minimumStake

      await expect(tx).to.changeEtherBalances(
        [governance, attestor1],
        [compoundStake * -1n, compoundStake]
      )

      expect(await governance.stakedAmounts(attestor1.address)).to.equal(0)
    })

    it('Should revert if unbonding period is not passed', async function () {
      await expect(governance.connect(attestor1).unstake()).to.be.revertedWith(
        'Unbonding period not passed'
      )
    })
  })

  describe('Slashing', function () {
    const slashAmount = ethers.parseEther('1')

    it('Should allow owner to slash tokens', async function () {
      await governance.slash(slashAmount)
      expect(await governance.totalSlashedAmount()).to.equal(slashAmount)
    })

    it('Should allow owner to slash attestor tokens', async function () {
      await governance.slashAttestor(attestor1.address, slashAmount)
      expect(await governance.totalSlashedAmount()).to.equal(slashAmount)
    })

    it('Should revert if slash amount exceeds total staked', async function () {
      await expect(
        governance.slash(ethers.parseEther('10'))
      ).to.be.revertedWith('Slash amount exceeds total staked')
    })

    it('Should revert if slash amount exceeds attestor tokens', async function () {
      await expect(
        governance.slashAttestor(attestor1.address, ethers.parseEther('10'))
      ).to.be.revertedWith('Slash amount exceeds attestor stake')
    })

    it('Should prevent non-owners from slashing', async function () {
      await expect(
        governance.connect(attestor1).slash(slashAmount)
      ).to.be.revertedWithCustomError(governance, 'OwnableUnauthorizedAccount')
    })
  })

  describe('Withdrawals', function () {
    it('Should allow owner to withdraw funds', async function () {
      const sendAmount = ethers.parseEther('2')
      await owner.sendTransaction({ to: governance, value: sendAmount })
      const totalStaked = await governance.totalStaked()

      const withdrawAmount = sendAmount + totalStaked

      const tx = await governance.withdraw()
      await expect(tx).to.changeEtherBalances(
        [governance, owner],
        [withdrawAmount * -1n, withdrawAmount]
      )
    })

    it('Should prevent non-owners from withdrawing', async function () {
      await expect(
        governance.connect(attestor1).withdraw()
      ).to.be.revertedWithCustomError(governance, 'OwnableUnauthorizedAccount')
    })
  })

  describe('Rewards', function () {
    const verificationCost = ethers.parseEther('5')

    beforeEach(async function () {
      await governance.setVerificationCost(verificationCost)
      await governance.addAttestor('attestor1', attestor1.address)
      await governance.addAttestor('attestor2', attestor2.address)
      await governance.addAttestor('attestor3', attestor3.address)

      // Stakes: 1 + 3 + 3 = 7
      // Total Stake (After, minimumStake = 1) = 3 * minimumStake + Stakes = 10
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

      // Reward_i = ( stake_i / totalStake ) * verificationCost
      expect(attestor1Rewards).to.equal(ethers.parseEther('1')) // 2 / 10 * 5 = 1
      expect(attestor2Rewards).to.equal(ethers.parseEther('2')) // 4 / 10 * 5 = 2
      expect(attestor3Rewards).to.equal(ethers.parseEther('0'))
    })

    it('should allow claiming rewards', async function () {
      await governance.registerRewards([attestor1.address])
      const reward = ethers.parseEther('1')

      const tx = governance.connect(attestor1).claimRewards()
      await expect(tx).to.changeEtherBalances(
        [governance, attestor1],
        [reward * -1n, reward]
      )

      expect(await governance.pendingRewards(attestor1.address)).to.equal(0)
    })

    it('should revert when claiming zero rewards', async function () {
      await expect(
        governance.connect(attestor1).claimRewards()
      ).to.be.revertedWith('No rewards to claim')
    })

    it('should handle zero total stake during rewards', async function () {
      // Unstake all tokens
      await governance.connect(attestor1).requestUnstake()
      await governance.connect(attestor2).requestUnstake()
      await governance.connect(attestor3).requestUnstake()
      await mine(unbondingPeriod)
      await governance.connect(attestor1).unstake()
      await governance.connect(attestor2).unstake()
      await governance.connect(attestor3).unstake()

      await expect(governance.registerRewards([attestor1.address])).to.not.be
        .reverted

      // Should have no rewards distributed
      expect(await governance.pendingRewards(attestor1.address)).to.equal(0)
    })
  })
})
