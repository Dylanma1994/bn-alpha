import type {
  Transaction,
  TokenSummary,
  DailySummary,
  DexTransaction,
  DexTransactionSummary,
} from "../types";

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
export const calculateDailySummary = (
  transactions: Transaction[],
  userAddress: string,
  walletBalance: number = 0
): DailySummary => {
  let dexTransactions = groupTransactionsByHash(transactions, userAddress);

  // 计算并更新滑点信息
  dexTransactions = calculateAndUpdateSlippage(dexTransactions);

  let totalGasFee = 0;
  let totalValue = 0;
  let todayBuyAmount = 0;
  const uniqueTokens = new Set<string>();

  dexTransactions.forEach((dexTx) => {
    totalGasFee += dexTx.gasFee;

    // 添加涉及的代币到集合中
    uniqueTokens.add(dexTx.fromToken);
    uniqueTokens.add(dexTx.toToken);

    // 计算交易价值（使用稳定币价值或代币数量）
    const stableCoins = ["USDT", "USDC", "BUSD", "DAI", "BSC-USD"];
    if (stableCoins.includes(dexTx.fromToken.toUpperCase())) {
      totalValue += dexTx.fromAmount;
    } else if (stableCoins.includes(dexTx.toToken.toUpperCase())) {
      totalValue += dexTx.toAmount;
    } else {
      // 如果都不是稳定币，使用 from 代币的数量
      totalValue += dexTx.fromAmount;
    }

    // 计算当日买入金额（只计算买入交易的稳定币金额）
    if (dexTx.type === "buy") {
      if (stableCoins.includes(dexTx.fromToken.toUpperCase())) {
        todayBuyAmount += dexTx.fromAmount;
      }
    }
  });

  // 计算 BN Alpha 分数（只基于买入金额）
  const bnAlphaScore = calculateBNAlphaScore(todayBuyAmount);

  // 计算滑点损耗
  const slippageLoss = calculateSlippageLoss(dexTransactions);

  return {
    totalTransactions: dexTransactions.length,
    totalGasFee,
    totalValue,
    uniqueTokens: uniqueTokens.size,
    bnAlphaScore,
    walletBalance,
    todayBuyAmount,
    slippageLoss,
  };
};

// 格式化数字显示
export const formatNumber = (num: number, decimals: number = 6): string => {
  if (num === 0) return "0";
  if (num < 0.000001) return "< 0.000001";
  return num.toFixed(decimals).replace(/\.?0+$/, "");
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
    // 只处理代币交易（有 tokenSymbol 的交易）
    const tokenTxs = txs.filter((tx) => tx.tokenSymbol);

    if (tokenTxs.length >= 2) {
      // 可能是 DEX 交易，需要至少 2 个代币转账
      const userIncoming = tokenTxs.filter(
        (tx) => tx.to.toLowerCase() === userAddress.toLowerCase()
      );
      const userOutgoing = tokenTxs.filter(
        (tx) => tx.from.toLowerCase() === userAddress.toLowerCase()
      );

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

        // 判断交易类型：如果卖出的是稳定币（USDT, USDC, BUSD等），则是买入操作
        const stableCoins = ["USDT", "USDC", "BUSD", "DAI", "BSC-USD"];
        const isStableCoinOut = stableCoins.includes(
          outgoingTx.tokenSymbol?.toUpperCase() || ""
        );
        const isStableCoinIn = stableCoins.includes(
          incomingTx.tokenSymbol?.toUpperCase() || ""
        );

        let transactionType: "buy" | "sell";
        let displayPair: string;

        if (isStableCoinOut && !isStableCoinIn) {
          // 用稳定币买入其他代币
          transactionType = "buy";
          displayPair = `${incomingTx.tokenSymbol}/${outgoingTx.tokenSymbol}`;
        } else if (!isStableCoinOut && isStableCoinIn) {
          // 卖出代币换稳定币
          transactionType = "sell";
          displayPair = `${outgoingTx.tokenSymbol}/${incomingTx.tokenSymbol}`;
        } else {
          // 其他情况，默认为卖出操作
          transactionType = "sell";
          displayPair = `${outgoingTx.tokenSymbol}/${incomingTx.tokenSymbol}`;
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
const calculateNetStablecoinLoss = (
  dexTransactions: DexTransactionSummary[]
): DexTransactionSummary[] => {
  // 基准货币：USDT、USDC、BNB
  const baseCurrencies = ["USDT", "USDC", "BNB", "BUSD", "DAI", "BSC-USD"];

  let totalOutflow = 0; // 总流出（买入时花费的稳定币）
  let totalInflow = 0; // 总流入（卖出时获得的稳定币）

  // 先计算总的流入流出
  dexTransactions.forEach((tx) => {
    if (
      tx.type === "buy" &&
      baseCurrencies.includes(tx.fromToken.toUpperCase())
    ) {
      totalOutflow += tx.fromAmount; // 买入时花费稳定币
    } else if (
      tx.type === "sell" &&
      baseCurrencies.includes(tx.toToken.toUpperCase())
    ) {
      totalInflow += tx.toAmount; // 卖出时获得稳定币
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

    if (
      tx.type === "buy" &&
      baseCurrencies.includes(tx.fromToken.toUpperCase())
    ) {
      // 买入：记录流出金额
      transactionFlow = -tx.fromAmount; // 负数表示流出
      slippageLoss = tx.fromAmount; // 单笔交易的潜在损耗
    } else if (
      tx.type === "sell" &&
      baseCurrencies.includes(tx.toToken.toUpperCase())
    ) {
      // 卖出：记录流入金额
      transactionFlow = tx.toAmount; // 正数表示流入
      slippageLoss = -tx.toAmount; // 负数表示收回资金
    }

    return {
      ...tx,
      slippageLoss,
      theoreticalValueUSD: Math.abs(transactionFlow),
      actualValueUSD: Math.abs(transactionFlow),
      priceImpact: 0,
      netLoss, // 添加总净损耗信息
    };
  });
};

// 计算并更新每笔交易的滑点损耗（净损耗版本）
export const calculateAndUpdateSlippage = (
  dexTransactions: DexTransactionSummary[]
): DexTransactionSummary[] => {
  console.log(`正在计算 ${dexTransactions.length} 笔交易的净损耗...`);

  // 使用净损耗计算
  const updatedTransactions = calculateNetStablecoinLoss(dexTransactions);

  console.log(`完成净损耗计算，共处理 ${updatedTransactions.length} 笔交易`);
  return updatedTransactions;
};

// 计算总净损耗
export const calculateSlippageLoss = (
  dexTransactions: DexTransactionSummary[]
): number => {
  // 如果有交易，返回第一笔交易的 netLoss（所有交易的 netLoss 都相同）
  if (dexTransactions.length > 0 && dexTransactions[0].netLoss !== undefined) {
    return dexTransactions[0].netLoss;
  }

  // 兜底：手动计算净损耗
  const baseCurrencies = ["USDT", "USDC", "BNB", "BUSD", "DAI", "BSC-USD"];
  let totalOutflow = 0;
  let totalInflow = 0;

  dexTransactions.forEach((tx) => {
    if (
      tx.type === "buy" &&
      baseCurrencies.includes(tx.fromToken.toUpperCase())
    ) {
      totalOutflow += tx.fromAmount;
    } else if (
      tx.type === "sell" &&
      baseCurrencies.includes(tx.toToken.toUpperCase())
    ) {
      totalInflow += tx.toAmount;
    }
  });

  return totalOutflow - totalInflow;
};
