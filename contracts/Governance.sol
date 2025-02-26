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
     * @dev Constructor that sets the initial owner of the contract.
     * @param initialOwner The address of the initial owner.
     */
    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @dev Adds a new Attestor to the contract.
     * @param _key The unique key for the Attestor.
     * @param _address The address of the Attestor.
     */
    function addAttestors(
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
