import axios from "axios";
import type { Transaction } from "../types";
import { getApiKey } from "../utils/apiKeyManager";

// Etherscan v2 API 配置
const ETHERSCAN_V2_API_BASE = "https://api.etherscan.io/v2/api";

// 支持的链配置
export const SUPPORTED_CHAINS = {
  1: { name: "Ethereum Mainnet", symbol: "ETH" },
  56: { name: "BNB Smart Chain Mainnet", symbol: "BNB" },
  137: { name: "Polygon Mainnet", symbol: "MATIC" },
  42161: { name: "Arbitrum One Mainnet", symbol: "ETH" },
  10: { name: "OP Mainnet", symbol: "ETH" },
  8453: { name: "Base Mainnet", symbol: "ETH" },
  43114: { name: "Avalanche C-Chain", symbol: "AVAX" },
  250: { name: "Fantom Opera", symbol: "FTM" },
} as const;

// 默认链 ID (BNB Smart Chain)
export const DEFAULT_CHAIN_ID = 56;

// API 调用封装
const callEtherscanV2API = async (
  params: Record<string, any>,
  chainId: number = DEFAULT_CHAIN_ID
) => {
  try {
    const apiKey = getApiKey();
    const response = await axios.get(ETHERSCAN_V2_API_BASE, {
      params: {
        chainid: chainId,
        ...params,
        apikey: apiKey,
      },
      timeout: 30000, // 30 second timeout
    });

    if (response.data.status === "1") {
      return response.data.result;
    } else if (
      response.data.status === "0" &&
      response.data.message === "No transactions found"
    ) {
      return [];
    } else {
      throw new Error(response.data.message || "API request failed");
    }
  } catch (error) {
    const chainName =
      SUPPORTED_CHAINS[chainId as keyof typeof SUPPORTED_CHAINS]?.name ||
      `Chain ${chainId}`;
    console.error(`Etherscan v2 API call failed for ${chainName}:`, error);
    throw error;
  }
};

// 获取今天的开始和结束时间戳 (UTC+8)
const getTodayTimestamps = () => {
  const now = new Date();

  // 获取当前 UTC+8 时间
  const utc8Now = new Date(now.getTime() + 8 * 60 * 60 * 1000);

  // 今天早上 8:00 (UTC+8) 对应的 UTC 时间是 00:00
  const startOfDay = new Date(
    Date.UTC(
      utc8Now.getUTCFullYear(),
      utc8Now.getUTCMonth(),
      utc8Now.getUTCDate(),
      0, // UTC 时间 00:00 对应北京时间 08:00
      0,
      0,
      0
    )
  );

  // 当前时间作为结束时间
  const endTime = now;

  // 直接使用时间戳
  const startTimestamp = Math.floor(startOfDay.getTime() / 1000);
  const endTimestamp = Math.floor(endTime.getTime() / 1000);

  // 调试日志
  console.log("调试时间计算:");
  console.log(
    "当前时间:",
    now.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })
  );
  console.log("UTC+8 时间:", utc8Now.toUTCString());
  console.log(
    "开始时间戳:",
    startTimestamp,
    "对应时间:",
    new Date(startTimestamp * 1000).toLocaleString("zh-CN", {
      timeZone: "Asia/Shanghai",
    })
  );
  console.log(
    "结束时间戳:",
    endTimestamp,
    "对应时间:",
    new Date(endTimestamp * 1000).toLocaleString("zh-CN", {
      timeZone: "Asia/Shanghai",
    })
  );

  return {
    startTimestamp,
    endTimestamp,
  };
};

// 获取普通交易
const getNormalTransactions = async (
  address: string,
  chainId: number = DEFAULT_CHAIN_ID
): Promise<Transaction[]> => {
  const chainName =
    SUPPORTED_CHAINS[chainId as keyof typeof SUPPORTED_CHAINS]?.name ||
    `Chain ${chainId}`;
  console.log(`正在获取普通交易... (${chainName})`);
  return await callEtherscanV2API(
    {
      module: "account",
      action: "txlist",
      address: address,
      startblock: 0,
      endblock: 99999999,
      page: 1,
      offset: 1000,
      sort: "desc",
    },
    chainId
  );
};

// 获取代币交易
const getTokenTransactions = async (
  address: string,
  chainId: number = DEFAULT_CHAIN_ID
): Promise<Transaction[]> => {
  const chainName =
    SUPPORTED_CHAINS[chainId as keyof typeof SUPPORTED_CHAINS]?.name ||
    `Chain ${chainId}`;
  console.log(`正在获取代币交易... (${chainName})`);
  return await callEtherscanV2API(
    {
      module: "account",
      action: "tokentx",
      address: address,
      startblock: 0,
      endblock: 99999999,
      page: 1,
      offset: 1000,
      sort: "desc",
    },
    chainId
  );
};

// 获取内部交易 (Internal Transactions)
const getInternalTransactions = async (
  address: string,
  chainId: number = DEFAULT_CHAIN_ID
): Promise<Transaction[]> => {
  const chainName =
    SUPPORTED_CHAINS[chainId as keyof typeof SUPPORTED_CHAINS]?.name ||
    `Chain ${chainId}`;
  console.log(`正在获取内部交易... (${chainName})`);
  return await callEtherscanV2API(
    {
      module: "account",
      action: "txlistinternal",
      address: address,
      startblock: 0,
      endblock: 99999999,
      page: 1,
      offset: 1000,
      sort: "desc",
    },
    chainId
  );
};

// 获取今天的交易数据（使用 Etherscan v2 API）
export const getTodayTransactions = async (
  address: string,
  chainId: number = DEFAULT_CHAIN_ID
): Promise<Transaction[]> => {
  const { startTimestamp, endTimestamp } = getTodayTimestamps();
  const chainName =
    SUPPORTED_CHAINS[chainId as keyof typeof SUPPORTED_CHAINS]?.name ||
    `Chain ${chainId}`;

  try {
    console.log(`正在获取地址 ${address} 的今日交易数据... (${chainName})`);
    console.log(
      `时间范围: ${new Date(startTimestamp * 1000).toLocaleString("zh-CN", {
        timeZone: "Asia/Shanghai",
      })} - ${new Date(endTimestamp * 1000).toLocaleString("zh-CN", {
        timeZone: "Asia/Shanghai",
      })}`
    );

    // 并行获取普通交易、代币交易和内部交易
    console.log("正在并行获取交易数据...");
    const [normalTxs, tokenTxs, internalTxs] = await Promise.all([
      getNormalTransactions(address, chainId),
      getTokenTransactions(address, chainId),
      getInternalTransactions(address, chainId),
    ]);

    console.log(`获取到 ${normalTxs.length} 笔普通交易`);
    console.log(`获取到 ${tokenTxs.length} 笔代币交易`);
    console.log(`获取到 ${internalTxs.length} 笔内部交易`);

    // 合并所有交易
    const allTransactions = [...normalTxs, ...tokenTxs, ...internalTxs];

    // 过滤今天的交易
    const todayTransactions = allTransactions.filter((tx) => {
      const txTimestamp = parseInt(tx.timeStamp);
      return txTimestamp >= startTimestamp && txTimestamp < endTimestamp;
    });

    console.log(`过滤后得到 ${todayTransactions.length} 笔今日交易`);

    // 按时间戳降序排序
    return todayTransactions.sort(
      (a, b) => parseInt(b.timeStamp) - parseInt(a.timeStamp)
    );
  } catch (error) {
    console.error("获取交易数据失败:", error);

    // 检查是否是 API Key 问题
    const currentApiKey = getApiKey();
    if (!currentApiKey || currentApiKey === "YourApiKeyToken") {
      throw new Error("请设置有效的 Etherscan API Key");
    }

    throw new Error(
      `获取 ${chainName} 交易数据失败，请检查 API Key 或稍后重试`
    );
  }
};

// 获取钱包余额
export const getWalletBalance = async (
  address: string,
  chainId: number = DEFAULT_CHAIN_ID
): Promise<number> => {
  const chainName =
    SUPPORTED_CHAINS[chainId as keyof typeof SUPPORTED_CHAINS]?.name ||
    `Chain ${chainId}`;
  console.log(`正在获取钱包余额... (${chainName})`);

  try {
    const balanceWei = await callEtherscanV2API(
      {
        module: "account",
        action: "balance",
        address: address,
        tag: "latest",
      },
      chainId
    );

    // 将 Wei 转换为 BNB
    const balanceBNB = parseFloat(balanceWei) / Math.pow(10, 18);
    console.log(`钱包余额: ${balanceBNB} BNB`);

    return balanceBNB;
  } catch (error) {
    console.error("获取钱包余额失败:", error);
    return 0;
  }
};

// 获取所有交易（使用 Etherscan v2 API）
export const getAllTransactions = async (
  address: string,
  chainId: number = DEFAULT_CHAIN_ID
): Promise<Transaction[]> => {
  return await getTodayTransactions(address, chainId);
};
