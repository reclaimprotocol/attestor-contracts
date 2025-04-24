import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { ADDRESS, ABI } from './constants'
import { transformForOnchain } from '@reclaimprotocol/js-sdk'

export default function VerifyProofs(props) {
  const [proofs, setProofs] = useState({})
  const [verified, setVerified] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [taskId, setTaskId] = useState(0)

  useEffect(() => {
    let onChainProofs = []
    setTaskId(props.proofs[0].taskId)

    for (let idx = 0; idx < props.proofs.length; idx++) {
      onChainProofs[idx] = transformForOnchain(props.proofs[idx])
    }

    console.log(onChainProofs)
    setProofs(onChainProofs)
  }, [])

  async function writeToContract() {
    setErrorMessage('')

    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' })

        const provider = new ethers.BrowserProvider(window.ethereum)

        const signer = await provider.getSigner()

        const contract = new ethers.Contract(ADDRESS, ABI, signer)

        const tx = await contract.verifyProofs(proofs, taskId, {
          value: 1000
        })

        // Wait for the transaction to be mined
        const receipt = await tx.wait()
        console.log('Transaction successful!', receipt)
        setVerified(true)
      } catch (error) {
        console.error('Error writing to contract:', error)
        setErrorMessage(
          error.message || 'An error occurred while writing to the contract.'
        )
      }
    } else {
      setErrorMessage('Please connect to MetaMask or another Web3 provider.')
    }
  }

  return (
    <div>
      <button className="button" onClick={writeToContract}>
        Verify Proofs
      </button>
      {verified && <p> Proofs verified </p>}
      <style jsx="true">{`
        .container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .button {
          border: solid 1px #ccc;
          margin: 0 0 20px;
          border-radius: 3px;
        }
      `}</style>
    </div>
  )
}
