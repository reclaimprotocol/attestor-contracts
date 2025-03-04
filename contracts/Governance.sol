// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Governance
 * @dev This contract manages a list of Attestors, allowing the owner to add and remove them.
 * It uses a mapping to store Attestor addresses associated with unique keys, and an array to maintain the order of Attestors.
 */
contract Governance is Ownable {
    /**
     * @dev Mapping from Attestor key to their address.
     */
    mapping(string => address) public Attestors;

    /**
     * @dev Array of Attestor keys, maintaining the order of addition.
     */
    string[] private _attestorKeys;

    /**
     * @dev The cost of verification, in wei.
     */
    uint256 public verificationCost;

    /**
     * @dev Indicates whether slashing is enabled.
     */
    bool public slashingEnabled;

    /**
     * @dev The minimum stake required for Attestors.
     */
    uint256 public minimumStake;

    /**
     * @dev The unbonding period for unstaking.
     */
    uint256 public unbondingPeriod;

    /**
     * @dev Mapping from Attestor address to their staked amount.
     */
    mapping(address => uint256) public stakedAmounts;

    /**
     * @dev Mapping from Attestor address to their unstake request block.
     */
    mapping(address => uint256) public unstakeRequestBlocks;

    /**
     * @dev Mapping from Attestor address to their pending rewards.
     */
    mapping(address => uint256) public pendingRewards;

    /**
     * @dev Total staked amount.
     */
    uint256 public totalStaked;

    /**
     * @dev Total amount slashed.
     */
    uint256 public totalSlashedAmount;

    /**
     * @dev The address of the contract allowed to call registerReward.
     */
    address public reclaimContractAddress;

    /**
     * @dev Constructor that sets the initial owner of the contract.
     * @param initialOwner The address of the initial owner.
     * @param _minimumStake The minimum stake amount.
     * @param _unbondingPeriod The unbonding period.
     */
    constructor(
        address initialOwner,
        uint256 _minimumStake,
        uint256 _unbondingPeriod
    ) Ownable(initialOwner) {
        minimumStake = _minimumStake;
        unbondingPeriod = _unbondingPeriod;
    }

    /**
     * @dev Modifier to ensure only the reclaim contract can call the function.
     */
    modifier OnlyAuthorized() {
        require(
            msg.sender == reclaimContractAddress || msg.sender == owner(),
            "Unauthorized caller"
        );
        _;
    }

    /**
     * @dev Sets the address of the reclaim contract.
     * @param _reclaimContractAddress The address of the reclaim contract.
     */
    function setReclaimContractAddress(
        address _reclaimContractAddress
    ) external onlyOwner {
        reclaimContractAddress = _reclaimContractAddress;
    }

    /**
     * @dev Adds a new Attestor to the contract.
     * @param _key The unique key for the Attestor.
     * @param _address The address of the Attestor.
     */
    function addAttestor(
        string memory _key,
        address _address
    ) external onlyOwner {
        require(Attestors[_key] == address(0), "Attestor already exists");
        Attestors[_key] = _address;
        _attestorKeys.push(_key);
    }

    /**
     * @dev Removes an Attestor from the contract.
     * @param _key The key of the Attestor to remove.
     */
    function removeAttestor(string memory _key) external onlyOwner {
        require(Attestors[_key] != address(0), "Attestor does not exist");
        delete Attestors[_key];

        // Remove key from array while maintaining order
        for (uint256 i = 0; i < _attestorKeys.length; i++) {
            if (keccak256(bytes(_attestorKeys[i])) == keccak256(bytes(_key))) {
                // Shift the last element to the current position and then pop the last element.
                // This avoids gaps in the array and maintains order.
                if (i < _attestorKeys.length - 1) {
                    _attestorKeys[i] = _attestorKeys[_attestorKeys.length - 1];
                }
                _attestorKeys.pop();
                break;
            }
        }
    }

    /**
     * @dev Sets the verification cost.
     * @param _verificationCost The new verification cost, in wei.
     */
    function setVerificationCost(uint256 _verificationCost) external onlyOwner {
        verificationCost = _verificationCost;
    }

    /**
     * @dev Sets the slashing enabled status.
     * @param _slashingEnabled The new slashing enabled status.
     */
    function setSlashingEnabled(bool _slashingEnabled) external onlyOwner {
        slashingEnabled = _slashingEnabled;
    }

    /**
     * @dev Sets the minimum stake.
     * @param _minimumStake The new minimum stake.
     */
    function setMinimumStake(uint256 _minimumStake) external onlyOwner {
        minimumStake = _minimumStake;
    }

    /**
     * @dev Sets the unbonding period.
     * @param _unbondingPeriod The new unbonding period.
     */
    function setUnbondingPeriod(uint256 _unbondingPeriod) external onlyOwner {
        unbondingPeriod = _unbondingPeriod;
    }

    /**
     * @dev Stakes native currency.
     */
    function stake() public payable {
        require(msg.value >= minimumStake, "Amount below minimum stake");

        stakedAmounts[msg.sender] += msg.value;
        totalStaked += msg.value;
    }

    /**
     * @dev Requests unstaking of native currency.
     */
    function requestUnstake() public {
        require(stakedAmounts[msg.sender] > 0, "No staked tokens");
        require(
            unstakeRequestBlocks[msg.sender] == 0,
            "Unstake already requested"
        );

        unstakeRequestBlocks[msg.sender] = block.number;
    }

    /**
     * @dev Unstakes native currency after the unbonding period.
     */
    function unstake() public {
        require(stakedAmounts[msg.sender] > 0, "No staked tokens");
        require(unstakeRequestBlocks[msg.sender] > 0, "Unstake not requested");
        require(
            block.number >= unstakeRequestBlocks[msg.sender] + unbondingPeriod,
            "Unbonding period not passed"
        );

        uint256 staked = stakedAmounts[msg.sender];
        uint256 remaining = calculateRemainingTokens(staked);

        stakedAmounts[msg.sender] = 0;
        unstakeRequestBlocks[msg.sender] = 0;
        totalStaked -= staked;

        payable(msg.sender).transfer(remaining);
    }

    /**
     * @dev Calculates the remaining tokens after slashing.
     * @param _stakedAmount The amount of tokens staked.
     * @return The remaining tokens.
     */
    function calculateRemainingTokens(
        uint256 _stakedAmount
    ) internal view returns (uint256) {
        if (totalStaked == 0) {
            return 0;
        }
        uint256 remainingTotal = totalStaked - totalSlashedAmount;
        return (remainingTotal * _stakedAmount) / totalStaked;
    }

    /**
     * @dev Slashes a certain amount of tokens.
     * @param _amount The amount of tokens to slash.
     */
    function slash(uint256 _amount) public onlyOwner {
        require(_amount <= totalStaked, "Slash amount exceeds total staked");
        totalSlashedAmount += _amount;
    }

    /**
     * @dev Registers rewards to specified honest attestors based on their staked amounts.
     * @param _attestorAddresses An array of addresses to reward.
     */
    function registerRewards(
        address[] memory _attestorAddresses
    ) public OnlyAuthorized {
        if (totalStaked == 0) {
            return;
        }

        for (uint256 i = 0; i < _attestorAddresses.length; i++) {
            address attestorAddress = _attestorAddresses[i];
            uint256 attestorStake = stakedAmounts[attestorAddress];

            if (attestorStake > 0) {
                uint256 attestorReward = (verificationCost * attestorStake) /
                    totalStaked;
                pendingRewards[attestorAddress] += attestorReward;
            }
        }
    }

    /**
     * @dev Allows an attestor to claim their pending rewards.
     */
    function claimRewards() external {
        uint256 reward = pendingRewards[msg.sender];
        require(reward > 0, "No rewards to claim");

        pendingRewards[msg.sender] = 0;
        payable(msg.sender).transfer(reward);
    }

    /**
     * @dev Withdraws any contract balance to the owner.
     */
    function withdraw() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    /**
     * @dev Returns the address of an Attestor given their key.
     * @param _key The key of the Attestor.
     * @return The address of the Attestor.
     */
    function getAttestor(string memory _key) public view returns (address) {
        return Attestors[_key];
    }

    /**
     * @dev Returns an array of all Attestor keys and addresses.
     * @return keys An array of Attestor keys.
     * @return addresses An array of Attestor addresses.
     */
    function getAttestors()
        public
        view
        returns (string[] memory keys, address[] memory addresses)
    {
        uint256 length = _attestorKeys.length;
        addresses = new address[](length);
        keys = new string[](length);

        for (uint256 i = 0; i < length; i++) {
            keys[i] = _attestorKeys[i];
            addresses[i] = Attestors[_attestorKeys[i]];
        }

        return (keys, addresses);
    }
}
