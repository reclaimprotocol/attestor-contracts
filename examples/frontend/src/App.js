import { useState } from 'react'
import QRCode from 'react-qr-code'
import { ClaimCreationType, ReclaimProofRequest } from '@reclaimprotocol/js-sdk'
import MetaMaskConnector from './connect-wallet'
import VerifyProofs from './verify-proofs'

function ReclaimDemo() {
  // State to store the verification request URL
  const [requestUrl, setRequestUrl] = useState('')
  const [proofs, setProofs] = useState([])
  const [ready, setReady] = useState(false)

  const getVerificationReq = async () => {
    // Your credentials from the Reclaim Developer Portal
    // Replace these with your actual credentials
    const APP_ID = '0x4c8e08f2B5AeD9504C888A327BaaCd6Ea617e18B'
    const APP_SECRET =
      '0x65507a8cf531019090e334630e74655168a7cbed6a95cc2c285a4d5653f8f7b4'
    const PROVIDER_ID = 'c94476a0-8a75-4563-b70a-bf6124d7c59b'

    // Initialize the Reclaim SDK with your credentials
    const reclaimProofRequest = await ReclaimProofRequest.init(
      APP_ID,
      APP_SECRET,
      PROVIDER_ID
    )

    reclaimProofRequest.setClaimCreationType(ClaimCreationType.ON_ME_CHAIN)

    // Generate the verification request URL
    const requestUrl = await reclaimProofRequest.getRequestUrl()
    console.log('Request URL:', requestUrl)
    setRequestUrl(requestUrl)

    // Start listening for proof submissions
    await reclaimProofRequest.startSession({
      // Called when the user successfully completes the verification
      onSuccess: (proofs) => {
        if (proofs) {
          console.log('Verification success', proofs)
          setProofs(proofs)
          setReady(true)
        }
        // Add your success logic here, such as:
        // - Updating UI to show verification success
        // - Storing verification status
        // - Redirecting to another page
      },
      // Called if there's an error during verification
      onError: (error) => {
        console.error('Verification failed', error)

        // Add your error handling logic here, such as:
        // - Showing error message to user
        // - Resetting verification state
        // - Offering retry options
      }
    })
  }

  return (
    <div className="container">
      <MetaMaskConnector />
      <button onClick={getVerificationReq}>Get Verification Request</button>
      {/* Display QR code when URL is available */}
      {requestUrl && (
        <div style={{ margin: '20px 0' }}>
          <QRCode value={requestUrl} />
        </div>
      )}
      {ready && <VerifyProofs proofs={proofs}></VerifyProofs>}
    </div>
  )
}

export default ReclaimDemo
