import { expect } from "chai";
import { ethers } from "hardhat";
import { Governance } from "../typechain-types"; 

describe("Governance", function () {
  let governance: Governance;
  let owner: any; 
  let addr1: any;
  let addr2: any;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const GovernanceFactory = await ethers.getContractFactory("Governance");
    governance = (await GovernanceFactory.deploy(owner.address)) as Governance;
  });

  describe("Attestors", function () {
    it("Should add an attestor", async function () {
      await governance.addAttestors("attestor1", addr1.address);
      const attestorAddress = await governance.getAttestor("attestor1");
      expect(attestorAddress).to.equal(addr1.address);
    });

    it("Should revert if adding an existing attestor", async function () {
      await governance.addAttestors("attestor1", addr1.address);
      await expect(
        governance.addAttestors("attestor1", addr2.address)
      ).to.be.revertedWith("Attestor already exists");
    });

    it("Should remove an attestor", async function () {
      await governance.addAttestors("attestor1", addr1.address);
      await governance.removeAttestor("attestor1");
      const attestorAddress = await governance.getAttestor("attestor1");
      expect(attestorAddress).to.equal(ethers.ZeroAddress);
    });

    it("Should revert if removing a non-existent attestor", async function () {
      await expect(governance.removeAttestor("attestor1")).to.be.revertedWith(
        "Attestor does not exist"
      );
    });

    it("Should get all attestors", async function () {
      await governance.addAttestors("attestor1", addr1.address);
      await governance.addAttestors("attestor2", addr2.address);
      const [keys, addresses] = await governance.getAttestors();
      expect(keys).to.deep.equal(["attestor1", "attestor2"]);
      expect(addresses).to.deep.equal([addr1.address, addr2.address]);
    });
  });

  describe("Settings", function () {
    it("Should set verification cost", async function () {
      const cost = 100;
      await governance.setVerificationCost(cost);
      expect(await governance.verificationCost()).to.equal(cost);
    });

    it("Should set slashing enabled", async function () {
      await governance.setSlashingEnabled(true);
      expect(await governance.slashingEnabled()).to.equal(true);

      await governance.setSlashingEnabled(false);
      expect(await governance.slashingEnabled()).to.equal(false);
    });
  });

  describe("Ownership", function () {
    it("Should set the owner during construction", async function () {
      expect(await governance.owner()).to.equal(owner.address);
    });

    it("Should allow the owner to transfer ownership", async function () {
      await governance.transferOwnership(addr1.address);
      expect(await governance.owner()).to.equal(addr1.address);
    });

    it("Should prevent non-owners from calling owner-only functions", async function () {
      await expect(
        governance.connect(addr1).addAttestors("attestor1", addr1.address)
      ).to.be.reverted; 

      await expect(governance.connect(addr1).removeAttestor("attestor1")).to.be
        .reverted;

      await expect(governance.connect(addr1).setVerificationCost(100)).to.be
        .reverted;

      await expect(governance.connect(addr1).setSlashingEnabled(true)).to.be
        .reverted;
    });
  });
});
