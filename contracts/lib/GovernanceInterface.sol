// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IGovernance {
    /**
     * @dev Returns the address of an Attestor given their key.
     * @param _key The key of the Attestor.
     * @return The address of the Attestor.
     */
    function getAttestor(string memory _key) external view returns (address);

    /**
     * @dev Returns an array of all Attestor keys and addresses.
     * @return keys An array of Attestor keys.
     * @return addresses An array of Attestor addresses.
     */
    function getAttestors()
        external
        view
        returns (string[] memory keys, address[] memory addresses);

    /**
     * @dev Returns the cost of verification, in wei.
     * @return The cost of verification.
     */
    function verificationCost() external view returns (uint256);

    /**
     * @dev Registers rewards to specified honest attestors based on their staked amounts.
     * @param _attestorAddresses An array of addresses to reward.
     */
    function registerRewards(address[] memory _attestorAddresses) external;
}
