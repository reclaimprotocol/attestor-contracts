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

Remove an attestor

```shell
npx hardhat remove-attestor --host $ATTESTOR_HOST --network $YOUR_NETWORK
```

Get an attestor

```shell
npx hardhat get-attestor --host $ATTESTOR_HOST --network $YOUR_NETWORK
```

Get all attestors

```shell
npx hardhat get-attestors --network $YOUR_NETWORK
```

Stake an amount

```shell
npx hardhat stake --amount $YOUR_AMOUNT --network $YOUR_NETWORK
```

Request unstaking

```shell
npx hardhat request-unstake --network $YOUR_NETWORK
```

Unstake

```shell
npx hardhat unstake --network $YOUR_NETWORK
```

Set minimum stake amount

```shell
npx hardhat set-minimum-stake --amount $YOUR_AMOUNT --network $YOUR_NETWORK
```

Get minimum stake amount

```shell
npx hardhat get-minimum-stake --network $YOUR_NETWORK
```

Set unboding period

```shell
npx hardhat set-unbonding-period --amount 1 --network $YOUR_NETWORK
```

Get unboding period

```shell
npx hardhat get-unbonding-period --network $YOUR_NETWORK
```

Set required attestors count

```shell
npx hardhat set-required-attestors --amount $YOUR_AMOUNT --network $YOUR_NETWORK
```

Get required attestors count

```shell
npx hardhat get-required-attestors --network $YOUR_NETWORK
```

Set verification cost

```shell
npx hardhat set-verification-cost --amount $YOUR_AMOUNT --network $YOUR_NETWORK
```

Get verification cost

```shell
npx hardhat get-verification-cost --network $YOUR_NETWORK
```

Slash

```shell
npx hardhat slash --amount $YOUR_AMOUNT --network $YOUR_NETWORK
```

Get total staked

```shell
npx hardhat get-total-staked --network $YOUR_NETWORK
```

Get total slashed

```shell
npx hardhat get-total-slashed --network $YOUR_NETWORK
```

Get stake per attestor

```shell
npx hardhat get-staked-amount --host $YOUR_HOST --network $YOUR_NETWORK
```

Get (pending) reward per attestor

```shell
npx hardhat get-reward-amount --host $YOUR_HOST --network $YOUR_NETWORK
```

Claim rewards

```shell
npx hardhat claim-rewards --network $YOUR_NETWORK
```

Withdraw funds

```shell
npx hardhat withdraw --network $YOUR_NETWORK
```

Get current task

```shell
npx hardhat get-current-task --network $YOUR_NETWORK
```

Fetch a task by id

```shell
npx hardhat fetch-task --id $YOUR_ID --network $YOUR_NETWORK
```

Fetch consensus result per task

```shell
npx hardhat get-consensus --id $YOUR_ID --network $YOUR_NETWORK
```

Create a task request

```shell
npx hardhat create-task-request --network $YOUR_NETWORK
```
