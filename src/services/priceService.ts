import axios from "axios";
import { getCoinGeckoId } from "../config/tokenMapping";

// CoinGecko API 配置
const COINGECKO_API_BASE = "https://api.coingecko.com/api/v3";

// 价格数据接口
export interface TokenPrice {
  tokenSymbol: string;
  priceUSD: number;
  timestamp: number;
}

// 价格查询缓存
const priceCache = new Map<string, TokenPrice>();

// 生成缓存键
const getCacheKey = (tokenSymbol: string, timestamp: number): string => {
  // 将时间戳向下取整到小时，减少API调用
  const hourTimestamp = Math.floor(timestamp / 3600) * 3600;
  return `${tokenSymbol.toUpperCase()}_${hourTimestamp}`;
};

// 查询历史价格（CoinGecko API）
export const getHistoricalPrice = async (
  tokenSymbol: string,
  timestamp: number
): Promise<number> => {
  const cacheKey = getCacheKey(tokenSymbol, timestamp);
  
  // 检查缓存
  if (priceCache.has(cacheKey)) {
    const cached = priceCache.get(cacheKey)!;
    console.log(`使用缓存价格: ${tokenSymbol} = $${cached.priceUSD}`);
    return cached.priceUSD;
  }

  const coinGeckoId = getCoinGeckoId(tokenSymbol);
  if (!coinGeckoId) {
    console.warn(`不支持的代币: ${tokenSymbol}`);
    return 0;
  }

  try {
    // 将时间戳转换为日期格式 (DD-MM-YYYY)
    const date = new Date(timestamp * 1000);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const dateStr = `${day}-${month}-${year}`;

    console.log(`查询 ${tokenSymbol} 在 ${dateStr} 的历史价格...`);

    const response = await axios.get(
      `${COINGECKO_API_BASE}/coins/${coinGeckoId}/history`,
      {
        params: {
          date: dateStr,
          localization: false,
        },
        timeout: 10000,
      }
    );

    const priceUSD = response.data?.market_data?.current_price?.usd || 0;
    
    if (priceUSD > 0) {
      // 缓存价格数据
      const priceData: TokenPrice = {
        tokenSymbol: tokenSymbol.toUpperCase(),
        priceUSD,
        timestamp,
      };
      priceCache.set(cacheKey, priceData);
      
      console.log(`获取到 ${tokenSymbol} 价格: $${priceUSD}`);
      return priceUSD;
    } else {
      console.warn(`无法获取 ${tokenSymbol} 的价格数据`);
      return 0;
    }
  } catch (error) {
    console.error(`获取 ${tokenSymbol} 历史价格失败:`, error);
    return 0;
  }
};

// 批量查询多个代币的历史价格
export const getBatchHistoricalPrices = async (
  tokens: Array<{ symbol: string; timestamp: number }>
): Promise<Map<string, number>> => {
  const priceMap = new Map<string, number>();
  
  // 并行查询所有代币价格（限制并发数量避免API限制）
  const batchSize = 3; // 每批最多3个请求
  for (let i = 0; i < tokens.length; i += batchSize) {
    const batch = tokens.slice(i, i + batchSize);
    
    const promises = batch.map(async (token) => {
      const price = await getHistoricalPrice(token.symbol, token.timestamp);
      return { symbol: token.symbol, price };
    });
    
    const results = await Promise.all(promises);
    results.forEach(({ symbol, price }) => {
      priceMap.set(symbol.toUpperCase(), price);
    });
    
    // 添加延迟避免API限制
    if (i + batchSize < tokens.length) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒延迟
    }
  }
  
  return priceMap;
};

// 获取当前价格（用于实时查询）
export const getCurrentPrice = async (tokenSymbol: string): Promise<number> => {
  const coinGeckoId = getCoinGeckoId(tokenSymbol);
  if (!coinGeckoId) {
    console.warn(`不支持的代币: ${tokenSymbol}`);
    return 0;
  }

  try {
    const response = await axios.get(
      `${COINGECKO_API_BASE}/simple/price`,
      {
        params: {
          ids: coinGeckoId,
          vs_currencies: 'usd',
        },
        timeout: 5000,
      }
    );

    const priceUSD = response.data?.[coinGeckoId]?.usd || 0;
    console.log(`获取到 ${tokenSymbol} 当前价格: $${priceUSD}`);
    return priceUSD;
  } catch (error) {
    console.error(`获取 ${tokenSymbol} 当前价格失败:`, error);
    return 0;
  }
};
