# Reclaim attestor task and governance contracts

## Compile

Compile contracts:

```shell
npm run compile
```

Generate artifacts:

```shell
npm run generate
```

## Test

Run tests:

```shell
npm run test
```

## Deploy

Run the `deploy` task:

```shell
npx hardhat deploy --network $YOUR_NETWORK
```

## Call contract

Add an attestor

```shell
npx hardhat add-attestor --host $ATTESTOR_HOST --address $ATTESTOR_ADDRESS --network $YOUR_NETWORK
```

Stake an amount

```shell
npx hardhat stake --amount $YOUR_AMOUNT --network $YOUR_NETWORK
```

Request unstaking

```shell
npx hardhat unstake --network $YOUR_NETWORK
```

Unstake

```shell
npx hardhat unstake --network $YOUR_NETWORK
```

## Deployments

| Contract Name | Deployed Address                           | Explorer Link                                                                        |
| :------------ | :----------------------------------------- | :----------------------------------------------------------------------------------- |
| Governance    | 0x0E2CF8810B11c2875246d634f030897e77491680 | https://testnet-scan.mechain.tech/address/0x0E2CF8810B11c2875246d634f030897e77491680 |
| ReclaimTask   | 0x88cEd91D4966D82912774B9fdf9ca4E065881a91 | https://testnet-scan.mechain.tech/address/0x88cEd91D4966D82912774B9fdf9ca4E065881a91 |
