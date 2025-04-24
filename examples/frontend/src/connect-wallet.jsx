import React, { useState, useEffect } from 'react'

function MetaMaskConnector() {
  const [isConnected, setIsConnected] = useState(false)
  const [account, setAccount] = useState(null)
  const defaultChainId = '5151'
  const defaultChainName = 'mechain-testnet'

  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_accounts'
          })
          if (accounts.length > 0) {
            setIsConnected(true)
            setAccount(accounts[0])
            checkNetwork()
          } else {
            setIsConnected(false)
            setAccount(null)
          }
        } catch (error) {
          console.error('Error checking accounts:', error)
          setIsConnected(false)
          setAccount(null)
        }

        window.ethereum.on('accountsChanged', (newAccounts) => {
          if (newAccounts.length > 0) {
            setIsConnected(true)
            setAccount(newAccounts[0])
            checkNetwork()
          } else {
            setIsConnected(false)
            setAccount(null)
          }
        })

        window.ethereum.on('chainChanged', (chainId) => {
          if (chainId !== defaultChainId) {
            console.log(
              'Network changed. Please connect to the default network.'
            )
          }
        })
      } else {
        console.log('MetaMask is not installed.')
      }
    }

    checkConnection()
  }, [defaultChainId])

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        })
        setIsConnected(true)
        setAccount(accounts[0])
        checkNetwork()
      } catch (error) {
        console.error('Error connecting to MetaMask:', error)
      }
    } else {
      console.log('MetaMask is not installed.')
    }
  }

  const checkNetwork = async () => {
    if (window.ethereum && isConnected) {
      try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' })
        if (chainId !== defaultChainId) {
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: defaultChainId }]
            })
          } catch (switchError) {
            if (switchError.code === 4902) {
              try {
                await window.ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [
                    {
                      chainId: defaultChainId,
                      chainName: defaultChainName,
                      rpcUrls: ['https://testnet-rpc.mechain.tech'],
                      nativeCurrency: {
                        name: 'MOCA',
                        symbol: 'MOCA',
                        decimals: 18
                      },
                      blockExplorerUrls: ['https://testnet-scan.mechain.tech/']
                    }
                  ]
                })
              } catch (addError) {
                console.error('Error adding network:', addError)
              }
            } else {
              console.error('Error switching network:', switchError)
            }
          }
        } else {
          console.log('Connected to the default network.')
        }
      } catch (error) {
        console.error('Error checking network:', error)
      }
    }
  }

  return (
    <div>
      {isConnected ? (
        <p>Connected with account: {account}</p>
      ) : (
        <button onClick={connectWallet}>Connect to MetaMask</button>
      )}
    </div>
  )
}

export default MetaMaskConnector
