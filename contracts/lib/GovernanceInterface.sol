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
     * @dev Returns the minimum staking requirement, in wei.
     * @return The minimum stake limit.
     */
    function minimumStake() external view returns (uint256);

    /**
     * @dev Registers rewards to specified honest attestors based on their staked amounts.
     * @param _attestorAddresses An array of addresses to reward.
     */
    function registerRewards(address[] memory _attestorAddresses) external;

    /**
     * @dev Returns the staked amount for a given attestor address.
     * @param _attestor The address of the attestor.
     * @return The staked amount of the attestor.
     */
    function stakedAmounts(address _attestor) external view returns (uint256);

    /**
     * @dev Returns the fraudulent proof penalty factor.
     * @return The fraudulent proof penalty factor (as a fraction of 100).
     */
    function getFradulentProofPenalityFactor() external view returns (uint256);

    /**
     * @dev Slashes a certain amount of tokens from an attestor's stake.
     * @param _attestor The address of the attestor to slash.
     * @param _amount The amount of tokens to slash.
     */
    function slashAttestor(address _attestor, uint256 _amount) external;
}
