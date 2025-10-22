import React, { useState, useEffect } from 'react'
import Web3 from 'web3'
import Web3ConnectButton from 'src/components/Web3Connect'
import MarketsList from 'src/components/MarketsList'
import { getWeb3Account } from 'src/utils/web3'
import styles from './style.module.css'

const App: React.FC = () => {
  const [web3, setWeb3] = useState<any>(undefined)
  const [account, setAccount] = useState<string>('')
  const [networkId, setNetworkId] = useState<number | null>(null)
  const [isWrongNetwork, setIsWrongNetwork] = useState<boolean>(false)

  const expectedNetworkId = parseInt(process.env.REACT_APP_NETWORK_ID || '84532')

  useEffect(() => {
    const checkNetwork = async () => {
      if (web3) {
        try {
          const currentNetworkId = await web3.eth.net.getId()
          setNetworkId(currentNetworkId)
          setIsWrongNetwork(currentNetworkId !== expectedNetworkId)
        } catch (err) {
          console.error('Error checking network:', err)
        }
      }
    }
    checkNetwork()
  }, [web3, expectedNetworkId])

  const setProviderData = async (provider: any) => {
    let newWeb3, newAccount
    if (provider) {
      newWeb3 = new Web3(provider)
      newAccount = await getWeb3Account(newWeb3)
    } else {
      newWeb3 = null
      newAccount = null
      setNetworkId(null)
      setIsWrongNetwork(false)
    }
    setWeb3(newWeb3)
    setAccount(newAccount)
  }

  return (
    <div className={styles.container}>
      <h1>🔮 Prediction Markets - Base Sepolia</h1>
      <p style={{ opacity: 0.7, marginTop: '-10px' }}>
        Decentralized prediction markets powered by Conditional Tokens
      </p>
      {process.env.REACT_APP_ORACLE_ADDRESS && process.env.REACT_APP_OPERATOR_ADDRESS ? (
        <>
          <Web3ConnectButton account={account} setProviderData={setProviderData} />
          {isWrongNetwork && (
            <div
              style={{
                backgroundColor: '#ff5252',
                color: 'white',
                padding: '20px',
                margin: '20px 0',
                borderRadius: '8px',
                textAlign: 'center',
              }}
            >
              <h2>⚠️ Wrong Network Detected</h2>
              <p>
                You are connected to network ID: {networkId}
                <br />
                Please switch to <strong>Base Sepolia</strong> (Chain ID: {expectedNetworkId})
              </p>
              <p style={{ fontSize: '14px', marginTop: '10px' }}>
                Open MetaMask → Click network dropdown → Select "Base Sepolia"
              </p>
            </div>
          )}
          {web3 && account && !isWrongNetwork && <MarketsList web3={web3} account={account} />}
        </>
      ) : (
        <div>Configuration error</div>
      )}
    </div>
  )
}

export default App
