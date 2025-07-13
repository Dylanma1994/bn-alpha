import axios from "axios";
import type { Transaction } from "../types";

// Etherscan v2 API 配置
const ETHERSCAN_V2_API_BASE = "https://api.etherscan.io/v2/api";
const ETHERSCAN_API_KEY =
  import.meta.env.VITE_ETHERSCAN_API_KEY || "YourApiKeyToken";

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
    const response = await axios.get(ETHERSCAN_V2_API_BASE, {
      params: {
        chainid: chainId,
        ...params,
        apikey: ETHERSCAN_API_KEY,
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
  // 转换为 UTC+8 时区
  const utc8Offset = 8 * 60 * 60 * 1000; // 8小时的毫秒数
  const utc8Now = new Date(now.getTime() + utc8Offset);

  const startOfDay = new Date(
    utc8Now.getFullYear(),
    utc8Now.getMonth(),
    utc8Now.getDate()
  );
  const endOfDay = new Date(
    utc8Now.getFullYear(),
    utc8Now.getMonth(),
    utc8Now.getDate() + 1
  );

  return {
    startTimestamp: Math.floor((startOfDay.getTime() - utc8Offset) / 1000),
    endTimestamp: Math.floor((endOfDay.getTime() - utc8Offset) / 1000),
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

    // 并行获取普通交易和代币交易
    console.log("正在并行获取交易数据...");
    const [normalTxs, tokenTxs] = await Promise.all([
      getNormalTransactions(address, chainId),
      getTokenTransactions(address, chainId),
    ]);

    console.log(`获取到 ${normalTxs.length} 笔普通交易`);
    console.log(`获取到 ${tokenTxs.length} 笔代币交易`);

    // 合并所有交易
    const allTransactions = [...normalTxs, ...tokenTxs];

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
    if (ETHERSCAN_API_KEY === "YourApiKeyToken") {
      throw new Error("请在 .env 文件中设置有效的 VITE_ETHERSCAN_API_KEY");
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
