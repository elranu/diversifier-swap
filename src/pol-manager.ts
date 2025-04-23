import { SplitsClient, Swapper, UniV3FlashSwapConfig } from "@0xsplits/splits-sdk";
import { Prettify, Assign, Chain, PrivateKeyAccount, PublicClient, Transport, createPublicClient, http, toHex, createWalletClient, isHex, FormattedTransactionReceipt, FormattedTransaction, BlockTag, numberToHex, zeroAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { isPolygonSupportedToken, POL_USDC, POL_USDCE, POL_USDT } from "./constants";



export type TokenToBeneficiary = "USDC" | "USDT";

type FlashInputAsset = {
    token: string
    amountIn: bigint
    poolFee: number
    amountOutMin: bigint
}

export interface TokenTransfer {
    from: string;
    to: string;
    tokenAddress?: string;
    amount: number;
    tokenSymbol?: string;
    hash: string;
    timestamp?: number;
}

export interface IChainManager {
    splitsClient: SplitsClient;
    publicClient: any;
    chain: Prettify<Assign<Chain<undefined>, Chain>>;
    deployDiversifier(beneficiaryAddress: string, tokenToBeneficiary: TokenToBeneficiary, spread_percentage: number): Promise<any>;
    withdrawDiversifier(diversifierAddress: string): Promise<any>;
}

export class ChainManager implements IChainManager {
    private account: PrivateKeyAccount | undefined;

    splitsClient: SplitsClient;
    publicClient: PublicClient<Transport, Chain>;
    chain: Prettify<Assign<Chain<undefined>, Chain>>;

    constructor(chain: Prettify<Assign<Chain<undefined>, Chain>>, rpc_url: string, ownerManager = false) {
        this.chain = chain;
        this.publicClient = createPublicClient({
            chain,
            transport: http(rpc_url),
        });

        if (!process.env.SPLITS_API_KEY) throw new Error("invalid splits api key");
        const splitsApiKey = process.env.SPLITS_API_KEY;

        if (ownerManager) {
            if (!isHex(process.env.PRIVATE_KEY!)) throw new Error("invalid key");

            this.account = privateKeyToAccount(process.env.PRIVATE_KEY!);
            const walletClient = createWalletClient({
                account: this.account,
                chain: chain,
                transport: http(rpc_url),
            });
            console.log('Account:', this.account.address);

            this.splitsClient = new SplitsClient({
                chainId: chain.id,
                publicClient: this.publicClient,
                walletClient,
                apiConfig: {
                    apiKey: splitsApiKey,
                }
            });
        }
        else {
            this.splitsClient = new SplitsClient({
                chainId: chain.id,
                publicClient: this.publicClient,
                apiConfig: {
                    apiKey: splitsApiKey,
                }
            });
        }
    }

    /**
     * Deploys a diversifier contract
     * @param beneficiaryAddress The address of the beneficiary
     * @param tokenToBeneficiary The token to be sent to the beneficiary
     * @param spread_percentage The percentage of the spread (0-5%) 0 - 5
     * @returns The deployed diversifier contract and its string representation
     */
    async deployDiversifier(beneficiaryAddress: string, tokenToBeneficiary: TokenToBeneficiary, spread_percentage: number) {
        throw new Error("not implemented");
    }


    protected encodePath(tokens: string[], fees: number[]): string {
        if (tokens.length !== fees.length + 1) {
            throw new Error('token/fee lengths do not match');
        }

        let encoded = '0x';
        fees.map((fee, index) => {
            const feeHex = fee.toString(16).padStart(2 * 3, "0");
            encoded += tokens[index].slice(2); // Drop 0x
            encoded += feeHex; //numberToHex(fee, { size: 3 }).slice(2) //getHexFromNumber(fee, 6) TODO:swapp
        }); //https://ethereum.stackexchange.com/questions/142406/uniswap-encode-path-in-typescript
        encoded += tokens[tokens.length - 1].slice(2);

        return encoded.toLowerCase();
    }

    protected getFormattedFlashInputAssets(outputToken: string, inputAssets: FlashInputAsset[])
        : UniV3FlashSwapConfig['inputAssets'] {
        const wrappedNativeTokenAddress = zeroAddress; //TODO:swapp
        // Need to use the wrapped native token for the encoded path instead of 0x0
        const outputTokenAddressForEncodedPath =
            outputToken === zeroAddress
                ? wrappedNativeTokenAddress
                : outputToken;

        const flashInputAssets = inputAssets.map((inputAsset) => {
            // Need to use the wrapped native token for the encoded path instead of 0x0
            const inputTokenAddressForEncodedPath =
                inputAsset.token === zeroAddress
                    ? wrappedNativeTokenAddress
                    : inputAsset.token

            // SDK expects empty encodedPath if it's same token, no uniswap trade
            if (inputTokenAddressForEncodedPath === outputTokenAddressForEncodedPath)
                return {
                    encodedPath: '',
                    token: inputAsset.token,
                    amountIn: inputAsset.amountIn,
                    amountOutMin: inputAsset.amountOutMin,
                };

            return {
                encodedPath: this.encodePath(
                    [inputTokenAddressForEncodedPath, outputTokenAddressForEncodedPath],
                    [inputAsset.poolFee],
                ),
                token: inputAsset.token,
                amountIn: inputAsset.amountIn,
                amountOutMin: inputAsset.amountOutMin,
            };
        });

        return flashInputAssets;
    }


    async withdrawDiversifier(diversifierAddress: string): Promise<any> {
        try {

            const pass = await this.splitsClient.passThroughWallet.getPassThrough({
                chainId: this.chain.id,
                passThroughWalletAddress: diversifierAddress
            });
            console.log('Pass:', pass);

            const balancePass = await this.splitsClient.dataClient?.getContractEarnings({
                chainId: this.chain.id,
                contractAddress: diversifierAddress
            });
            console.log('Balance Pass:', balancePass);

            //IF Balance passThroughTokens
            if (balancePass && balancePass.activeBalances && Object.keys(balancePass.activeBalances).length > 0) {
                let tokens = Object.keys(balancePass.activeBalances);
                tokens = tokens.filter((token) => isPolygonSupportedToken(token));

                if (tokens.length > 0) {
                    const logPass = await this.splitsClient.passThroughWallet.passThroughTokens({
                        passThroughWalletAddress: diversifierAddress,
                        tokens: tokens
                    });
                    console.log('Log Pass:', logPass);
                }
            }

            const split = await this.splitsClient.dataClient?.getSplitMetadata({
                splitAddress: pass.passThrough,
                chainId: this.chain.id
            });
            console.log('Split:', split); //Se saca los recipients y sus porcentajes

            if (!split) {
                throw new Error('Split not found');
            }

            //Get balances per token distribute and withdraw
            const splitBalance = await this.splitsClient.dataClient?.getContractEarnings({
                chainId: this.chain.id,
                contractAddress: pass.passThrough
            });
            console.log('Balance:', splitBalance);

            //If balance of Split distributeToken and withdrawFunds 
            if (splitBalance && splitBalance.activeBalances && Object.keys(splitBalance.activeBalances).length > 0) {
                let tokens = Object.keys(splitBalance.activeBalances);
                tokens = tokens.filter((token) => isPolygonSupportedToken(token));
                if (tokens.length > 0) {
                    const distributedPromises = [];
                    for (const token of tokens) {
                        distributedPromises.push(
                            this.splitsClient.splitV1.distributeToken({
                                splitAddress: pass.passThrough,
                                token: token,
                                chainId: this.chain.id
                            })
                        );
                    }
                    const distributed = await Promise.all(distributedPromises);
                    console.log('Distributed:', distributed);
                    const withdrawPromises = [];
                    for (const reci of split.recipients) {
                        withdrawPromises.push(
                            this.splitsClient.splitV1.withdrawFunds({
                                address: reci.recipient.address,
                                tokens: tokens,
                                chainId: this.chain.id
                            })
                        );
                    }
                    const withdraw = await Promise.all(withdrawPromises);
                    console.log('Withdraw:', withdraw);
                }
            }

            //Once the tokens are distributed and withdrawn, we shold withdraw the swapper with uniV3FlashSwap
            for (const recipient of split.recipients) {
                console.log('Recipient:', recipient);
                const swapper = await this.splitsClient.dataClient?.getAccountMetadata({
                    chainId: this.chain.id,
                    accountAddress: recipient.recipient.address
                });
                console.log('Swapper:', swapper);
                if (swapper?.type === "Swapper") { //IF Swapper try uniV3FlashSwap
                    const outputToken = swapper.tokenToBeneficiary.address;
                    const oracle = await this.splitsClient.swapper.getOracle({
                        swapperAddress: recipient.recipient.address,
                        chainId: this.chain.id
                    });
                    console.log('Oracle:', oracle);
                    const bal = await this.splitsClient.dataClient?.getContractEarnings({
                        chainId: this.chain.id,
                        contractAddress: swapper?.address
                    });
                    console.log('Balance:', bal);
                    if (bal && bal.activeBalances) {
                        const balances = bal.activeBalances;
                        const tokens = Object.keys(balances);
                        const quoteParams = tokens.map((token) => {
                            return {
                                quotePair: {
                                    base: token,
                                    quote: outputToken,
                                },
                                baseAmount: balances[token].rawAmount,
                            }
                        });
                        const quoteAmounts = await this.splitsClient.oracle?.getQuoteAmounts({
                            oracleAddress: oracle.oracle,
                            quoteParams,
                            chainId: this.chain.id,
                        });

                        const inputAssetsPromise = tokens.map(async (token, index) => {
                            const scaledOfferFactorOverride = swapper.scaledOfferFactorOverrides.find((overrideData) => {
                                return overrideData.baseToken.address === token && overrideData.quoteToken.address === outputToken
                            })
                            const scaledOfferFactorPercent = scaledOfferFactorOverride?.scaledOfferFactorPercent ?? swapper.defaultScaledOfferFactorPercent
                            const pairDetails = await this.splitsClient.oracle?.getPairDetails({
                                oracleAddress: oracle.oracle,
                                quotePairs: [{ base: token, quote: outputToken }],
                                chainId: this.chain.id,
                            });
                            const pool = pairDetails.pairDetails?.[0].pool;
                            const fee = await this.splitsClient.oracle.getPoolFee({
                                poolAddress: pool,
                                chainId: this.chain.id,
                            });
                            const result = {
                                token,
                                poolFee: fee.fee,
                                amountIn: quoteParams[index].baseAmount,
                                amountOutMin: quoteAmounts.quoteAmounts[index] * BigInt(100 - scaledOfferFactorPercent) / BigInt(100),
                            }
                            result.amountOutMin = (result.amountIn - result.amountOutMin) <= 0 ? BigInt(result.amountIn - BigInt(100)) : result.amountOutMin;
                            return result;
                        });

                        const inputAssets = await Promise.all(inputAssetsPromise);
                        const inputEncoded = this.getFormattedFlashInputAssets(outputToken, inputAssets)
                        const result = await this.splitsClient.swapper.uniV3FlashSwap({
                            swapperAddress: swapper?.address,
                            inputAssets: inputEncoded,
                        });
                        console.log('Flash Swap:', bal?.activeBalances[tokens[0]].rawAmount);
                        console.log('Result:', result);
                    }
                }
            }
        }
        catch (e) {
            console.log('Error:', e);
        }

        return 0;
    }
}
