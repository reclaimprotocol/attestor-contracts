// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./StringUtils.sol";

/**
 * Library to assist with requesting,
 * serialising & verifying credentials
 */
library Claims {
    /** Data required to describe a claim */
    struct CompleteClaimData {
        bytes32 identifier;
        address owner;
        uint32 timestampS;
        uint32 epoch;
    }

    struct ClaimInfo {
        string provider;
        string parameters;
        string context;
    }

    /** Claim with signatures & signer */
    struct SignedClaim {
        CompleteClaimData claim;
        bytes[] signatures;
    }

    /**
     * @dev recovers the signer of the claim
     */
    function recoverSignerOfSignedClaim(
        SignedClaim memory self
    ) internal pure returns (address) {
        bytes memory serialised = serialise(self.claim);

        address signer = verifySignature(serialised, self.signatures[0]);

        return signer;
    }

    /**
     * @dev serialises the credential into a string;
     * the string is used to verify the signature
     *
     * the serialisation is the same as done by the TS library
     */
    function serialise(
        CompleteClaimData memory self
    ) internal pure returns (bytes memory) {
        return
            abi.encodePacked(
                StringUtils.bytes2str(abi.encodePacked(self.identifier)),
                "\n",
                StringUtils.address2str(self.owner),
                "\n",
                StringUtils.uint2str(self.timestampS),
                "\n",
                StringUtils.uint2str(self.epoch)
            );
    }

    /**
     * @dev returns the address of the user that generated the signature
     */
    function verifySignature(
        bytes memory content,
        bytes memory signature
    ) internal pure returns (address signer) {
        bytes32 signedHash = keccak256(
            abi.encodePacked(
                "\x19Ethereum Signed Message:\n",
                StringUtils.uint2str(content.length),
                content
            )
        );
        return ECDSA.recover(signedHash, signature);
    }

    function hashClaimInfo(
        ClaimInfo memory claimInfo
    ) internal pure returns (bytes32) {
        bytes memory serialised = abi.encodePacked(
            claimInfo.provider,
            "\n",
            claimInfo.parameters,
            "\n",
            claimInfo.context
        );
        return keccak256(serialised);
    }
}
