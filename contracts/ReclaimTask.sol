// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./lib/GovernanceInterface.sol";
import "./lib/Claims.sol";
import "./lib/Random.sol";
import "./lib/StringUtils.sol";
import "./lib/ByteUtils.sol";

// import "hardhat/console.sol";

error Reclaim__GroupAlreadyExists();
error Reclaim__UserAlreadyMerkelized();

/**
 * @title Reclaim
 * @dev This contract manages tasks, attestors, and verification of claims.
 */
contract ReclaimTask is Ownable {
    /**
     * @dev Structure representing an Attestor.
     * @param addr The ETH address of the Attestor.
     * @param host The host to connect to the Attestor.
     */
    struct Attestor {
        address addr;
        string host;
    }

    /**
     * @dev Structure representing a Task.
     * @param id The task number.
     * @param timestampStart The timestamp when the task started.
     * @param timestampEnd The timestamp when the task ends.
     * @param attestors Array of Attestors for this task.
     */
    struct Task {
        uint32 id;
        uint32 timestampStart;
        uint32 timestampEnd;
        Attestor[] attestors;
    }

    /**
     * @dev Structure representing a Proof.
     * @param claimInfo Information about the claim.
     * @param signedClaim The signed claim.
     */
    struct Proof {
        Claims.ClaimInfo claimInfo;
        Claims.SignedClaim signedClaim;
    }

    /**
     * @dev Mapping from task ids to their verification results.
     */
    mapping(uint32 => bool) public consensusReached;

    /** @dev Array of all tasks. */
    Task[] public tasks;

    /** @dev Duration of each task (in seconds).  Used for caching purposes. */
    uint32 public taskDurationS; // 1 day

    /** @dev Current task number. */
    uint32 public currentTask;

    /** @dev Number of attestors required. */
    uint8 public requiredAttestors;

    /** @dev Address of the Governance contract. */
    address public governanceAddress;

    /** @dev Emitted when a new task is added. */
    event TaskAdded(Task task);
    /** @dev Emitted when a fraudulent proof is detected and an attestor is slashed. */
    event AttestorSlashed(address attestor, uint256 slashedAmount);

    address public constant ZERO_ADDRESS =
        0x0000000000000000000000000000000000000000;

    /**
     * @dev Constructor that sets the initial owner and governance address.
     * @param initialOwner The address of the initial owner.
     * @param _governanceAddress The address of the governance contract.
     */
    constructor(
        address initialOwner,
        address _governanceAddress
    ) Ownable(initialOwner) {
        taskDurationS = 1 days;
        currentTask = 0;
        requiredAttestors = 1;
        governanceAddress = _governanceAddress;

        (string[] memory keys, address[] memory addresses) = IGovernance(
            governanceAddress
        ).getAttestors();

        uint256 length = keys.length;
        Attestor[] memory governanceAttestors = new Attestor[](length);

        for (uint256 i = 0; i < length; i++) {
            governanceAttestors[i] = Attestor(addresses[i], keys[i]);
        }
        addNewTask(governanceAttestors);
    }

    /**
     * @dev Fetches a task.
     * @param task The task number to fetch; pass 0 to fetch the current task.
     * @return The requested Task struct.
     */
    function fetchTask(uint32 task) public view returns (Task memory) {
        require(task <= tasks.length, "Tasks size limit exceeded");

        if (task == 0) {
            return tasks[tasks.length - 1]; // Return the last task if task == 0
        }
        return tasks[task - 1]; // Tasks are indexed from 1
    }

    /**
     * @dev Gets the attestors for a claim.
     * @param seed Random seed used for attestor selection.
     * @param timestamp Timestamp used for attestor selection.
     * @return Array of selected Attestors.
     */
    function fetchAttestorsForClaim(
        bytes32 seed,
        uint32 timestamp
    ) public view returns (Attestor[] memory) {
        bytes memory completeInput = abi.encodePacked(
            StringUtils.bytes2str(abi.encodePacked(seed)), // Convert seed to string
            "\n",
            StringUtils.uint2str(timestamp)
        );
        bytes memory completeHash = abi.encodePacked(keccak256(completeInput));

        (string[] memory keys, address[] memory addresses) = IGovernance(
            governanceAddress
        ).getAttestors();

        uint256 length = keys.length;
        Attestor[] memory governanceAttestors = new Attestor[](length);

        for (uint256 i = 0; i < length; i++) {
            governanceAttestors[i] = Attestor(addresses[i], keys[i]);
        }

        Attestor[] memory attestorsLeftList = governanceAttestors;
        Attestor[] memory selectedAttestors = new Attestor[](requiredAttestors);
        uint attestorsLeft = attestorsLeftList.length;

        uint byteOffset = 0;
        for (uint32 i = 0; i < requiredAttestors; i++) {
            uint randomSeed = BytesUtils.bytesToUInt(completeHash, byteOffset);
            uint attestorIndex = randomSeed % attestorsLeft;
            selectedAttestors[i] = attestorsLeftList[attestorIndex];

            // Remove selected attestor from the remaining list to avoid duplicates.
            attestorsLeftList[attestorIndex] = attestorsLeftList[
                attestorsLeft - 1
            ];
            byteOffset = (byteOffset + 4) % completeHash.length;
            attestorsLeft -= 1;
        }

        return selectedAttestors;
    }

    // Verification functions ---

    /**
     * @dev Verifies a claim proof.
     * @param proofs Array of Proof struct.
     * @param taskId The ID of the task.
     * @return True if proofs are valid, false otherwise.
     */
    function verifyProofs(
        Proof[] memory proofs,
        uint32 taskId
    ) public payable returns (bool) {
        uint256 verificationCost = IGovernance(governanceAddress)
            .verificationCost();
        require(msg.value == verificationCost, "Verification underpriced");

        address[] memory signedAttestors = new address[](proofs.length);

        for (uint32 i = 0; i < proofs.length; i++) {
            Proof memory proof = proofs[i];

            bytes32 hashed = Claims.hashClaimInfo(proof.claimInfo);

            if (
                proof.signedClaim.signatures.length == 0 ||
                proof.signedClaim.claim.identifier != hashed
            ) {
                signedAttestors[i] = ZERO_ADDRESS;
                continue;
            }

            signedAttestors[i] = Claims.recoverSignerOfSignedClaim(
                proof.signedClaim
            );
        }

        Task memory taskData = fetchTask(taskId);
        Attestor[] memory expectedAttestors = taskData.attestors;

        address[] memory rewardedAttestors = new address[](
            signedAttestors.length
        );
        address[] memory slashedAttestors = new address[](
            signedAttestors.length
        );
        uint32 rewardIndex = 0;
        uint32 slashIndex = 0;
        // Check for duplicate attestor signatures
        for (uint32 i = 0; i < signedAttestors.length; i++) {
            for (uint32 j = i + 1; j < signedAttestors.length; j++) {
                // Optimize: Start inner loop from i+1
                require(
                    signedAttestors[i] != signedAttestors[j],
                    "Duplicate signatures found"
                );
            }
        }

        uint8 attestorThreshold = 0;
        bool isSlashedAttestor = false;

        // Check if 51% of signers are expected attestors
        for (uint32 i = 0; i < signedAttestors.length; i++) {
            for (uint32 j = 0; j < expectedAttestors.length; j++) {
                if (signedAttestors[i] == expectedAttestors[j].addr) {
                    rewardedAttestors[rewardIndex] = expectedAttestors[j].addr;
                    rewardIndex += 1;
                    attestorThreshold += 1;
                    isSlashedAttestor = true;
                    break;
                }
            }
            if (isSlashedAttestor) {
                slashedAttestors[slashIndex] = expectedAttestors[i].addr;
                slashIndex += 1;
                isSlashedAttestor = false;
            }
        }

        IGovernance(governanceAddress).registerRewards(rewardedAttestors);

        for (uint32 i = 0; i < slashedAttestors.length; i++) {
            address slashedAttestor = slashedAttestors[i];
            // Slashing logic for fraudulent proof submission
            uint256 attestorStake = IGovernance(governanceAddress)
                .stakedAmounts(slashedAttestor);
            if (attestorStake > 0) {
                uint256 fradulentProofPenalityFactor = IGovernance(
                    governanceAddress
                ).getFradulentProofPenalityFactor();
                uint256 slashedAmount = (attestorStake *
                    fradulentProofPenalityFactor) / 100;
                IGovernance(governanceAddress).slashAttestor(
                    slashedAttestor,
                    slashedAmount
                );
                emit AttestorSlashed(slashedAttestor, slashedAmount);
            }
        }

        if (attestorThreshold >= expectedAttestors.length / 2) {
            consensusReached[currentTask] = true;
        } else {
            consensusReached[currentTask] = false;
            revert("Consensus failed");
        }
        return true;
    }

    /**
     * @dev Creates a new task request.
     * @param seed Random seed.
     * @param timestamp Timestamp.
     */
    function createNewTaskRequest(
        bytes32 seed,
        uint32 timestamp
    ) public returns (uint32, Attestor[] memory) {
        (string[] memory keys, address[] memory addresses) = IGovernance(
            governanceAddress
        ).getAttestors();

        uint256 length = keys.length;
        Attestor[] memory governanceAttestors = new Attestor[](length);

        for (uint256 i = 0; i < length; i++) {
            governanceAttestors[i] = Attestor(addresses[i], keys[i]);
        }

        Attestor[] memory attestors = fetchAttestorsForClaim(seed, timestamp);
        addNewTask(attestors);

        return (currentTask, attestors);
    }

    /**
     * @dev Adds a new task.
     * @param attestors Array of Attestors for the task.
     */
    function addNewTask(Attestor[] memory attestors) internal {
        if (taskDurationS == 0) {
            taskDurationS = 1 days;
        }
        if (tasks.length > 0) {
            tasks[tasks.length - 1].timestampEnd = uint32(block.timestamp);
        }

        currentTask += 1;
        Task storage task = tasks.push();
        task.id = currentTask;
        task.timestampStart = uint32(block.timestamp);
        task.timestampEnd = uint32(block.timestamp + taskDurationS);

        for (uint256 i = 0; i < attestors.length; i++) {
            task.attestors.push(attestors[i]);
        }

        emit TaskAdded(tasks[tasks.length - 1]);
    }

    /**
     * @dev Sets the minimum attestors count.
     */
    function setRequiredAttestors(uint8 _requiredAttestors) external onlyOwner {
        requiredAttestors = _requiredAttestors;
    }
}
