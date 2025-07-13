import type {
  Transaction,
  TokenSummary,
  DailySummary,
  DexTransactionSummary,
  AddressSummary,
} from "../types";
import { getBNBPriceFromManager } from "./priceManager";

// 稳定币列表
const STABLE_COINS = [
  "USDT",
  "USDC",
  "BUSD",
  "DAI",
  "TUSD",
  "FDUSD",
  "BSC-USD",
];

// 将 Wei 转换为 Ether
export const weiToEther = (wei: string): number => {
  return parseFloat(wei) / Math.pow(10, 18);
};

// 将代币数量转换为可读格式
export const formatTokenAmount = (amount: string, decimals: string): number => {
  const decimal = parseInt(decimals) || 18;
  return parseFloat(amount) / Math.pow(10, decimal);
};

// 计算 Gas 费用（以 BNB 为单位）
export const calculateGasFee = (gasUsed: string, gasPrice: string): number => {
  const gasFeeWei = (parseFloat(gasUsed) * parseFloat(gasPrice)).toString();
  return weiToEther(gasFeeWei);
};

// 将BNB Gas费用转换为USDT（使用实时价格）
export const convertGasFeeToUSDT = async (
  gasFeeInBNB: number
): Promise<number> => {
  const bnbPrice = await getBNBPriceFromManager();
  return gasFeeInBNB * bnbPrice;
};

// 处理交易数据，按币种分组
export const processTransactionsByToken = (
  transactions: Transaction[]
): TokenSummary[] => {
  const tokenMap = new Map<string, TokenSummary>();

  transactions.forEach((tx) => {
    let symbol = "BNB";
    let name = "Binance Coin";
    let value = 0;
    let contractAddress = "";

    // 如果是代币交易
    if (tx.tokenSymbol) {
      symbol = tx.tokenSymbol;
      name = tx.tokenName || tx.tokenSymbol;
      value = formatTokenAmount(tx.value, tx.tokenDecimal || "18");
      contractAddress = tx.contractAddress || "";
    } else {
      // 普通 BNB 交易
      value = weiToEther(tx.value);
    }

    const gasFee = calculateGasFee(tx.gasUsed, tx.gasPrice);

    if (tokenMap.has(symbol)) {
      const existing = tokenMap.get(symbol)!;
      existing.totalValue += value;
      existing.totalGasFee += gasFee;
      existing.transactionCount += 1;
    } else {
      tokenMap.set(symbol, {
        symbol,
        name,
        totalValue: value,
        totalGasFee: gasFee,
        transactionCount: 1,
        contractAddress,
      });
    }
  });

  return Array.from(tokenMap.values()).sort(
    (a, b) => b.totalValue - a.totalValue
  );
};

// 计算每日汇总数据（基于 DEX 交易）
export const calculateDailySummary = async (
  transactions: Transaction[],
  userAddress: string,
  walletBalance: number = 0
): Promise<DailySummary> => {
  let dexTransactions = groupTransactionsByHash(transactions, userAddress);

  // 计算并更新滑点信息
  dexTransactions = await calculateAndUpdateSlippage(dexTransactions);

  let totalGasFee = 0;
  let totalValue = 0;
  let todayBuyAmount = 0;
  let totalBuyVolume = 0; // 总买入交易量
  const uniqueTokens = new Set<string>();

  dexTransactions.forEach((dexTx) => {
    totalGasFee += dexTx.gasFee;

    // 添加涉及的代币到集合中
    uniqueTokens.add(dexTx.fromToken);
    uniqueTokens.add(dexTx.toToken);

    // 计算交易价值（使用稳定币价值或代币数量）
    if (STABLE_COINS.includes(dexTx.fromToken.toUpperCase())) {
      totalValue += dexTx.fromAmount;
    } else if (STABLE_COINS.includes(dexTx.toToken.toUpperCase())) {
      totalValue += dexTx.toAmount;
    } else {
      // 如果都不是稳定币，使用 from 代币的数量
      totalValue += dexTx.fromAmount;
    }

    // 计算当日买入金额（只计算买入交易的稳定币金额）
    if (dexTx.type === "buy") {
      if (STABLE_COINS.includes(dexTx.fromToken.toUpperCase())) {
        todayBuyAmount += dexTx.fromAmount;
        totalBuyVolume += dexTx.fromAmount; // 累计总买入交易量
      }
    }
  });

  // 计算 BN Alpha 分数（只基于买入金额）
  const bnAlphaScore = calculateBNAlphaScore(todayBuyAmount);

  // 计算滑点损耗
  const slippageLoss = await calculateSlippageLoss(dexTransactions);

  return {
    totalTransactions: dexTransactions.length,
    totalGasFee,
    totalValue,
    uniqueTokens: uniqueTokens.size,
    bnAlphaScore,
    walletBalance,
    todayBuyAmount,
    slippageLoss,
    totalBuyVolume,
  };
};

// 格式化数字显示
export const formatNumber = (num: number, decimals: number = 6): string => {
  if (num === 0) return "0";
  if (num < 0.000001) return "< 0.000001";
  return num.toFixed(decimals);
};

// 格式化地址显示
export const formatAddress = (address: string): string => {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// 将交易按哈希分组，识别 DEX 交易
export const groupTransactionsByHash = (
  transactions: Transaction[],
  userAddress: string
): DexTransactionSummary[] => {
  // 按交易哈希分组
  const txGroups = new Map<string, Transaction[]>();

  transactions.forEach((tx) => {
    if (!txGroups.has(tx.hash)) {
      txGroups.set(tx.hash, []);
    }
    txGroups.get(tx.hash)!.push(tx);
  });

  const dexTransactions: DexTransactionSummary[] = [];

  txGroups.forEach((txs, hash) => {
    // 特殊调试：查找特定交易哈希
    if (
      hash ===
      "0x47c19537d66207504672cfd7d13d13e718ec4c7c82ef9fa1f6aa1390fed88b05"
    ) {
      console.log(`🎯 找到目标交易哈希: ${hash}`);
      console.log(`包含 ${txs.length} 个交易:`);
      txs.forEach((tx, index) => {
        console.log(
          `  ${index + 1}. ${tx.tokenSymbol || "NO_SYMBOL"}: ${tx.from} → ${
            tx.to
          }, 金额: ${tx.value}, 代币: ${tx.tokenName || "N/A"}`
        );
      });
    }

    // 处理代币交易和原生BNB交易
    // 为原生BNB交易添加tokenSymbol
    const processedTxs = txs.map((tx) => {
      if (!tx.tokenSymbol) {
        // 检查是否是原生BNB交易（包括内部交易）
        const hasValue = parseFloat(tx.value) > 0;

        // 如果有金额，这是一个BNB交易（普通交易或内部交易）
        if (hasValue) {
          console.log(
            `🔍 检测到BNB交易 ${hash}: ${tx.from} → ${tx.to}, 金额: ${tx.value} BNB`
          );
          return {
            ...tx,
            tokenSymbol: "BNB",
            tokenName: "Binance Coin",
            tokenDecimal: "18",
          };
        }
      }
      return tx;
    });

    // 调试：显示每个交易哈希的详细信息
    if (processedTxs.length >= 2) {
      console.log(`📦 交易哈希 ${hash} 包含 ${processedTxs.length} 个交易:`);
      processedTxs.forEach((tx, index) => {
        console.log(
          `  ${index + 1}. ${tx.tokenSymbol || "NO_SYMBOL"}: ${tx.from.slice(
            0,
            6
          )}...${tx.from.slice(-4)} → ${tx.to.slice(0, 6)}...${tx.to.slice(
            -4
          )}, 金额: ${tx.value}`
        );
      });
    }

    // 过滤出有效的代币交易（现在包括BNB）
    const tokenTxs = processedTxs.filter((tx) => tx.tokenSymbol);

    if (tokenTxs.length >= 1) {
      // 可能是 DEX 交易，需要至少 1 个代币转账
      const userIncoming = tokenTxs.filter(
        (tx) => tx.to.toLowerCase() === userAddress.toLowerCase()
      );
      const userOutgoing = tokenTxs.filter(
        (tx) => tx.from.toLowerCase() === userAddress.toLowerCase()
      );

      // 处理正常的双向交易
      if (userIncoming.length > 0 && userOutgoing.length > 0) {
        // 这是一个 DEX 交易：用户既发送了代币又接收了代币
        const outgoingTx = userOutgoing[0]; // 用户发送的代币
        const incomingTx = userIncoming[0]; // 用户接收的代币

        const fromAmount = formatTokenAmount(
          outgoingTx.value,
          outgoingTx.tokenDecimal || "18"
        );
        const toAmount = formatTokenAmount(
          incomingTx.value,
          incomingTx.tokenDecimal || "18"
        );

        // 计算 gas 费用（使用第一个交易的 gas 信息）
        const gasFee = calculateGasFee(txs[0].gasUsed, txs[0].gasPrice);

        // 判断交易类型：如果卖出的是稳定币，则是买入操作
        const outTokenSymbol = outgoingTx.tokenSymbol?.toUpperCase() || "";
        const inTokenSymbol = incomingTx.tokenSymbol?.toUpperCase() || "";

        const isStableCoinOut = STABLE_COINS.includes(outTokenSymbol);
        const isStableCoinIn = STABLE_COINS.includes(inTokenSymbol);
        const isBNBOut = outTokenSymbol === "BNB";
        const isBNBIn = inTokenSymbol === "BNB";

        // 调试：显示交易对信息
        console.log(`🔄 分析交易对: ${outTokenSymbol} → ${inTokenSymbol}`);

        // 过滤稳定币之间的交易
        if (isStableCoinOut && isStableCoinIn) {
          console.log(
            `❌ 跳过稳定币之间的交易: ${outTokenSymbol} → ${inTokenSymbol}`
          );
          return; // 跳过稳定币之间的交易
        }

        // 过滤BNB和稳定币之间的交易
        if ((isBNBOut && isStableCoinIn) || (isStableCoinOut && isBNBIn)) {
          console.log(
            `❌ 跳过BNB和稳定币之间的交易: ${outTokenSymbol} → ${inTokenSymbol}`
          );
          return; // 跳过BNB和稳定币之间的交易
        }

        console.log(`✅ 保留交易: ${outTokenSymbol} → ${inTokenSymbol}`);

        let transactionType: "buy" | "sell";

        // 重新设计交易类型判断逻辑
        if (isStableCoinOut && !isStableCoinIn && !isBNBIn) {
          // 用稳定币买入其他代币（非BNB）
          transactionType = "buy";
        } else if (!isStableCoinOut && !isBNBOut && isStableCoinIn) {
          // 卖出代币（非BNB）换稳定币
          transactionType = "sell";
        } else if (isBNBOut && !isStableCoinIn && !isBNBIn) {
          // 用BNB买入其他代币（非稳定币）
          transactionType = "buy";
        } else if (!isStableCoinOut && !isBNBOut && isBNBIn) {
          // 卖出代币换BNB
          transactionType = "sell";
        } else {
          // 其他情况，默认为卖出操作
          transactionType = "sell";
        }

        // 标准化代币符号
        const normalizeTokenSymbol = (symbol: string): string => {
          const normalized = symbol.toUpperCase();
          // 将 BSC-USD 标准化为 USDT
          if (normalized === "BSC-USD") return "USDT";
          return normalized;
        };

        const normalizedFromToken = normalizeTokenSymbol(
          outgoingTx.tokenSymbol || ""
        );
        const normalizedToToken = normalizeTokenSymbol(
          incomingTx.tokenSymbol || ""
        );

        // 重新生成交易对显示
        const normalizedDisplayPair =
          transactionType === "buy"
            ? `${normalizedToToken}/${normalizedFromToken}`
            : `${normalizedFromToken}/${normalizedToToken}`;

        dexTransactions.push({
          hash,
          timeStamp: txs[0].timeStamp,
          type: transactionType,
          pair: normalizedDisplayPair,
          fromToken: normalizedFromToken,
          toToken: normalizedToToken,
          fromAmount,
          toAmount,
          gasFee,
          slippageLoss: 0, // 将在后续计算中更新
          priceImpact: 0, // 将在后续计算中更新
        });
      }
    }
  });

  return dexTransactions.sort(
    (a, b) => parseInt(b.timeStamp) - parseInt(a.timeStamp)
  );
};

// 计算 BN Alpha 分数（简化版本，只基于买入金额）
export const calculateBNAlphaScore = (todayBuyAmountUSD: number): number => {
  let score = 0;

  // 当日买入金额分数 (按照 2^n 计算)
  if (todayBuyAmountUSD > 0) {
    // 计算 log2(买入金额)，向下取整作为分数
    const buyScore = Math.floor(Math.log2(todayBuyAmountUSD));
    score += Math.max(0, buyScore); // 确保分数不为负
  }

  return score;
};

// 计算净损耗（稳定币流入流出差额）
const calculateNetStablecoinLoss = async (
  dexTransactions: DexTransactionSummary[]
): Promise<DexTransactionSummary[]> => {
  // 获取实时BNB价格
  const bnbPrice = await getBNBPriceFromManager();

  let totalOutflow = 0; // 总流出（买入时花费的稳定币）
  let totalInflow = 0; // 总流入（卖出时获得的稳定币）

  // 先计算总的流入流出
  dexTransactions.forEach((tx) => {
    const fromTokenUpper = tx.fromToken.toUpperCase();
    const toTokenUpper = tx.toToken.toUpperCase();

    if (tx.type === "buy") {
      // 买入交易：计算花费的基准货币
      if (STABLE_COINS.includes(fromTokenUpper)) {
        totalOutflow += tx.fromAmount; // 花费稳定币
      } else if (fromTokenUpper === "BNB") {
        // 用BNB买入其他代币，转换为USDT等值
        totalOutflow += tx.fromAmount * bnbPrice;
      }
    } else if (tx.type === "sell") {
      // 卖出交易：计算获得的基准货币
      if (STABLE_COINS.includes(toTokenUpper)) {
        totalInflow += tx.toAmount; // 获得稳定币
      } else if (toTokenUpper === "BNB") {
        // 卖出代币换BNB，转换为USDT等值
        totalInflow += tx.toAmount * bnbPrice;
      }
    }
  });

  // 计算净损耗
  const netLoss = totalOutflow - totalInflow;

  console.log(`稳定币总流出（买入花费）: ${totalOutflow} USDT`);
  console.log(`稳定币总流入（卖出收入）: ${totalInflow} USDT`);
  console.log(`净损耗: ${netLoss} USDT`);

  // 为每笔交易分配损耗信息
  return dexTransactions.map((tx) => {
    let slippageLoss = 0;
    let transactionFlow = 0;

    const fromTokenUpper = tx.fromToken.toUpperCase();
    const toTokenUpper = tx.toToken.toUpperCase();

    if (tx.type === "buy") {
      // 买入交易：计算花费
      if (STABLE_COINS.includes(fromTokenUpper)) {
        transactionFlow = -tx.fromAmount; // 负数表示流出
        slippageLoss = tx.fromAmount; // 买入时的损耗（正数）
      } else if (fromTokenUpper === "BNB") {
        // 用BNB买入，转换为USDT等值
        const usdtValue = tx.fromAmount * bnbPrice;
        transactionFlow = -usdtValue; // 负数表示流出
        slippageLoss = usdtValue; // 买入时的损耗（正数）
      }
    } else if (tx.type === "sell") {
      // 卖出交易：计算收入
      if (STABLE_COINS.includes(toTokenUpper)) {
        transactionFlow = tx.toAmount; // 正数表示流入
        slippageLoss = -tx.toAmount; // 卖出时收回的金额（负数）
      } else if (toTokenUpper === "BNB") {
        // 卖出换BNB，转换为USDT等值
        const usdtValue = tx.toAmount * bnbPrice;
        transactionFlow = usdtValue; // 正数表示流入
        slippageLoss = -usdtValue; // 卖出时收回的金额（负数）
      }
    }

    return {
      ...tx,
      slippageLoss, // 单笔交易的损耗/收回
      theoreticalValueUSD: Math.abs(transactionFlow),
      actualValueUSD: Math.abs(transactionFlow),
      priceImpact: 0,
      netLoss, // 总净损耗（所有交易的净损耗）
    };
  });
};

// 计算并更新每笔交易的滑点损耗（净损耗版本）
export const calculateAndUpdateSlippage = async (
  dexTransactions: DexTransactionSummary[]
): Promise<DexTransactionSummary[]> => {
  console.log(`正在计算 ${dexTransactions.length} 笔交易的净损耗...`);

  // 使用净损耗计算
  const updatedTransactions = await calculateNetStablecoinLoss(dexTransactions);

  console.log(`完成净损耗计算，共处理 ${updatedTransactions.length} 笔交易`);
  return updatedTransactions;
};

// 计算总净损耗
export const calculateSlippageLoss = async (
  dexTransactions: DexTransactionSummary[]
): Promise<number> => {
  // 如果有交易，返回第一笔交易的 netLoss（所有交易的 netLoss 都相同）
  if (dexTransactions.length > 0 && dexTransactions[0].netLoss !== undefined) {
    return dexTransactions[0].netLoss;
  }

  // 兜底：手动计算净损耗
  const bnbPrice = await getBNBPriceFromManager();
  let totalOutflow = 0;
  let totalInflow = 0;

  dexTransactions.forEach((tx) => {
    const fromTokenUpper = tx.fromToken.toUpperCase();
    const toTokenUpper = tx.toToken.toUpperCase();

    if (tx.type === "buy") {
      if (STABLE_COINS.includes(fromTokenUpper)) {
        totalOutflow += tx.fromAmount;
      } else if (fromTokenUpper === "BNB") {
        totalOutflow += tx.fromAmount * bnbPrice; // 转换为USDT等值
      }
    } else if (tx.type === "sell") {
      if (STABLE_COINS.includes(toTokenUpper)) {
        totalInflow += tx.toAmount;
      } else if (toTokenUpper === "BNB") {
        totalInflow += tx.toAmount * bnbPrice; // 转换为USDT等值
      }
    }
  });

  return totalOutflow - totalInflow;
};

// 延迟函数
const delay = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// 创建空的地址汇总数据
const createEmptyAddressSummary = (address: string): AddressSummary => ({
  address,
  summary: {
    totalTransactions: 0,
    totalGasFee: 0,
    totalValue: 0,
    uniqueTokens: 0,
    bnAlphaScore: 0,
    walletBalance: 0,
    todayBuyAmount: 0,
    slippageLoss: 0,
    totalBuyVolume: 0,
  },
  dexTransactions: [],
});

// 带重试的单地址查询
const queryAddressWithRetry = async (
  address: string,
  getAllTransactions: (
    address: string,
    chainId: number
  ) => Promise<Transaction[]>,
  chainId: number,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<AddressSummary> => {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`查询地址 ${address} (第 ${attempt}/${maxRetries} 次尝试)`);

      // 获取交易数据
      const txs = await getAllTransactions(address, chainId);

      if (txs.length > 0) {
        // 处理DEX交易
        let dexTxs = groupTransactionsByHash(txs, address);
        dexTxs = await calculateAndUpdateSlippage(dexTxs);

        // 计算汇总数据
        const summary = await calculateDailySummary(txs, address, 0);

        console.log(`✅ 地址 ${address} 查询成功，找到 ${txs.length} 笔交易`);
        return {
          address,
          summary,
          dexTransactions: dexTxs,
        };
      } else {
        console.log(`ℹ️ 地址 ${address} 无交易记录`);
        return createEmptyAddressSummary(address);
      }
    } catch (error) {
      lastError = error as Error;
      console.warn(`❌ 地址 ${address} 第 ${attempt} 次查询失败:`, error);

      if (attempt < maxRetries) {
        // 指数退避延迟
        const delayTime = baseDelay * Math.pow(2, attempt - 1);
        console.log(`⏳ 等待 ${delayTime}ms 后重试...`);
        await delay(delayTime);
      }
    }
  }

  // 所有重试都失败了
  console.error(
    `🚫 地址 ${address} 查询失败，已重试 ${maxRetries} 次，最后错误:`,
    lastError
  );
  return createEmptyAddressSummary(address);
};

// 批量处理多个地址的数据（顺序查询，带重试机制）
export const processBatchAddresses = async (
  addresses: string[],
  getAllTransactions: (
    address: string,
    chainId: number
  ) => Promise<Transaction[]>,
  chainId: number,
  onProgress?: (current: number, total: number, address: string) => void
): Promise<AddressSummary[]> => {
  const results: AddressSummary[] = [];
  const total = addresses.length;

  console.log(`🚀 开始批量查询 ${total} 个地址`);

  for (let i = 0; i < addresses.length; i++) {
    const address = addresses[i];

    // 更新进度
    if (onProgress) {
      onProgress(i + 1, total, address);
    }

    // 查询单个地址（带重试）
    const result = await queryAddressWithRetry(
      address,
      getAllTransactions,
      chainId
    );
    results.push(result);

    // 在查询之间添加延迟，避免API限流
    if (i < addresses.length - 1) {
      await delay(200); // 200ms延迟，确保不超过5qps
    }
  }

  const successCount = results.filter(
    (r) => r.summary.totalTransactions > 0
  ).length;
  console.log(`✅ 批量查询完成: ${successCount}/${total} 个地址有交易数据`);

  return results;
};

// 计算批量地址的总汇总
export const calculateBatchSummary = (
  addressSummaries: AddressSummary[]
): DailySummary => {
  const totalSummary: DailySummary = {
    totalTransactions: 0,
    totalGasFee: 0,
    totalValue: 0,
    uniqueTokens: 0,
    bnAlphaScore: 0,
    walletBalance: 0,
    todayBuyAmount: 0,
    slippageLoss: 0,
    totalBuyVolume: 0,
  };

  addressSummaries.forEach(({ summary }) => {
    totalSummary.totalTransactions += summary.totalTransactions;
    totalSummary.totalGasFee += summary.totalGasFee;
    totalSummary.totalValue += summary.totalValue;
    totalSummary.bnAlphaScore += summary.bnAlphaScore;
    totalSummary.walletBalance += summary.walletBalance;
    totalSummary.todayBuyAmount += summary.todayBuyAmount;
    totalSummary.slippageLoss += summary.slippageLoss;
    totalSummary.totalBuyVolume += summary.totalBuyVolume;
  });

  // 计算唯一代币数量（需要去重）
  const allTokens = new Set<string>();
  addressSummaries.forEach(({ dexTransactions }) => {
    dexTransactions.forEach((tx) => {
      allTokens.add(tx.fromToken);
      allTokens.add(tx.toToken);
    });
  });
  totalSummary.uniqueTokens = allTokens.size;

  return totalSummary;
};
