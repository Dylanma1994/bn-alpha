export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasUsed: string;
  gasPrice: string;
  timeStamp: string;
  tokenSymbol?: string;
  tokenName?: string;
  tokenDecimal?: string;
  contractAddress?: string;
}

export interface TokenSummary {
  symbol: string;
  name: string;
  totalValue: number;
  totalGasFee: number;
  transactionCount: number;
  contractAddress?: string;
}

// DEX 交易类型
export interface DexTransaction {
  hash: string;
  timeStamp: string;
  gasUsed: string;
  gasPrice: string;
  type: "buy" | "sell";
  fromToken: {
    symbol: string;
    name: string;
    amount: number;
    contractAddress?: string;
  };
  toToken: {
    symbol: string;
    name: string;
    amount: number;
    contractAddress?: string;
  };
  gasFee: number;
}

// DEX 交易汇总
export interface DexTransactionSummary {
  hash: string;
  timeStamp: string;
  type: "buy" | "sell";
  pair: string; // 如 "USDT/BR"
  fromToken: string;
  toToken: string;
  fromAmount: number;
  toAmount: number;
  gasFee: number;
  slippageLoss?: number; // 单笔交易的滑点损耗 (USD)
  priceImpact?: number; // 价格影响百分比
  theoreticalValueUSD?: number; // 理论价值 (USD)
  actualValueUSD?: number; // 实际价值 (USD)
  fromTokenPriceUSD?: number; // 发送代币价格
  toTokenPriceUSD?: number; // 接收代币价格
  netLoss?: number; // 总净损耗 (USD)
}

export interface DailySummary {
  totalTransactions: number;
  totalGasFee: number;
  totalValue: number;
  uniqueTokens: number;
  bnAlphaScore: number;
  walletBalance: number;
  todayBuyAmount: number;
  slippageLoss: number; // 滑点损耗
  totalBuyVolume: number; // 总买入交易量（只算买入）
}

// 地址汇总数据
export interface AddressSummary {
  address: string;
  label?: string;
  summary: DailySummary;
  dexTransactions: DexTransactionSummary[];
}
