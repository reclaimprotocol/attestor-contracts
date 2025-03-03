import { HDNodeWallet, Signer, Wallet } from 'ethers'
import { ethers } from 'hardhat'

export async function createWallet(balanceEth: number = 1) {
  const wallet = Wallet.createRandom().connect(ethers.provider)
  if (balanceEth > 0) {
    // fund the wallet so it can make transactions
    let wei =
      typeof balanceEth === 'number'
        ? '0x' + Number(balanceEth * 1e18).toString(16)
        : //@ts-ignore
          balanceEth.toHexString()
    wei = wei.replace('0x0', '0x')
    if (balanceEth !== 0) {
      await ethers.provider.send('hardhat_setBalance', [wallet.address, wei])
    }
  }

  return wallet
}

export async function signClaim(claim: any, wallet: HDNodeWallet) {
  const serializedClaim = [
    claim.identifier,
    claim.owner,
    claim.timestampS,
    claim.epoch
  ].join('\n')

  return wallet.signMessage(serializedClaim)
}

export const PROOF = {
  identifier:
    '0xb467e58748ddbad155ac6e58a007688ebbaff97ef8277856f5e95b11775039ff',
  claimData: {
    provider: 'http',
    parameters:
      '{"additionalClientOptions":{},"body":"","geoLocation":"","headers":{"Referer":"https://github.com/settings/profile","Sec-Fetch-Mode":"same-origin","User-Agent":"Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.6668.69 Mobile Safari/537.36"},"method":"GET","paramValues":{"username":"hadi-saleh14"},"responseMatches":[{"invert":false,"type":"contains","value":"<span class=\\"color-fg-muted\\">({{username}})</span>"}],"responseRedactions":[{"jsonPath":"","regex":"<span class=\\"color-fg-muted\\">\\\\((.*)\\\\)</span>","xPath":""}],"url":"https://github.com/settings/profile"}',
    owner: '0x2edddad5144aa9ab7e70c7c9c03c5fe5741be5cb',
    timestampS: 1738255480,
    context:
      '{"contextAddress":"user\'s address","contextMessage":"for acmecorp.com on 1st january","extractedParameters":{"username":"hadi-saleh14"},"providerHash":"0xcb4a6b54d59f97b5891cced83e9e909c938bc06149a22f9e76309f2d20300609"}',
    identifier:
      '0xb467e58748ddbad155ac6e58a007688ebbaff97ef8277856f5e95b11775039ff',
    epoch: 1
  },
  signatures: [
    '0x10badfdfb051b1f54c476940e6004aa803e995231c839618455d5273f91c26ca4cc893337f40ea7462ba45789dde6255f51b94c873979b2739b2e8664a9748471b'
  ],
  witnesses: [
    {
      id: '0x244897572368eadf65bfbc5aec98d8e5443a9072',
      url: 'wss://attestor.reclaimprotocol.org/ws'
    }
  ],
  publicData: null
}
