# Diversifier Swapping

## installation

```bash
npm install
```
Create a `.env.local` file in the src directory and add the following variables:

```
SPLITS_API_KEY=key
PRIVATE_KEY=key
ALCHEMY_API_KEY=key
```
## run

```bash
npm run start
```

## Explanation

Currently the Diversifier for example is in POLYGON at 0x27DbE8809657EF8e0299eDF2D4876E83e0D72c1F
it can be found in the `src/index.ts` file

# `withdrawDiversifier` Method Explanation

It tries to withdraw the diversifier and pass it through the splits contract, then it tries to swap the tokens for the recipient. In different transactions not in the same transaction, with multicall

The `withdrawDiversifier` method in the `ChainManager` class is designed to handle the full process of withdrawing funds from a diversifier contract and distributing them through the Splits protocol. Here's a breakdown of what it does:

## Overall Purpose
This method extracts funds from a diversifier contract, distributes them through a split contract, and then handles any necessary token swaps for the recipients.

## Step-by-Step Process

1. **Get PassThrough Details**
   - Retrieves information about the pass-through wallet associated with the diversifier address
   - Gets the balance of tokens in the pass-through wallet

2. **Pass Through Tokens**
   - If the diversifier has any supported token balances, it passes these tokens through to the underlying split contract
   - Only processes tokens that are on the supported list for Polygon

3. **Get Split Contract Details**
   - Retrieves metadata about the split contract, including its recipients and their allocation percentages
   - Gets the current token balances held in the split contract

4. **Distribute and Withdraw From Split**
   - If the split has token balances, it performs two operations:
     - First, distributes all supported tokens to the recipients based on their percentages
     - Then initiates withdrawals for each recipient to claim their funds

5. **Handle Swapper Contracts**
   - For each recipient address that is a Swapper contract:
     - Gets the target output token (tokenToBeneficiary)
     - Retrieves oracle information for pricing
     - For each token in the swapper's balance:
       - Gets price quotes
       - Calculates minimum output amount based on scaled offer factors
       - Determines the appropriate pool fee
     - Executes a UniswapV3 flash swap to convert tokens to the beneficiary's preferred token

## Error Handling
The method wraps all operations in a try-catch block to log any errors that might occur during the process.

## Return Value
The method returns `0` when complete, though it appears this could be enhanced to return more meaningful information about the operations performed.

## Key Components Used
- `SplitsClient` for interacting with the Splits protocol
- Oracle services for token price quotes
- UniswapV3 flash swaps for token conversions
- Token balance tracking across multiple contracts