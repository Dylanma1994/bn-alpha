import axios from "axios";

// Binance API 配置
const BINANCE_API_BASE = "https://api.binance.com/api/v3";

// 价格数据接口
export interface BinancePrice {
  symbol: string;
  price: string;
}

// 价格缓存
interface PriceCache {
  price: number;
  timestamp: number;
}

const priceCache = new Map<string, PriceCache>();
const CACHE_DURATION = 60 * 1000; // 1分钟缓存

// 获取BNB实时价格
export const getBNBPrice = async (): Promise<number> => {
  const symbol = "BNBUSDT";
  const now = Date.now();
  
  // 检查缓存
  const cached = priceCache.get(symbol);
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    console.log(`使用缓存的BNB价格: $${cached.price}`);
    return cached.price;
  }

  try {
    console.log("正在获取BNB实时价格...");
    const response = await axios.get<BinancePrice>(
      `${BINANCE_API_BASE}/ticker/price`,
      {
        params: {
          symbol: symbol,
        },
        timeout: 5000,
      }
    );

    const price = parseFloat(response.data.price);
    
    if (price > 0) {
      // 更新缓存
      priceCache.set(symbol, {
        price,
        timestamp: now,
      });
      
      console.log(`获取到BNB实时价格: $${price}`);
      return price;
    } else {
      console.warn("获取到的BNB价格无效");
      return getBNBFallbackPrice();
    }
  } catch (error) {
    console.error("获取BNB价格失败:", error);
    return getBNBFallbackPrice();
  }
};

// 获取多个代币的实时价格
export const getBatchPrices = async (symbols: string[]): Promise<Map<string, number>> => {
  const priceMap = new Map<string, number>();
  
  try {
    console.log(`正在获取 ${symbols.length} 个代币的实时价格...`);
    
    // 构建查询参数
    const symbolParams = symbols.map(symbol => `"${symbol}"`).join(',');
    
    const response = await axios.get<BinancePrice[]>(
      `${BINANCE_API_BASE}/ticker/price`,
      {
        params: {
          symbols: `[${symbolParams}]`,
        },
        timeout: 10000,
      }
    );

    response.data.forEach((item) => {
      const price = parseFloat(item.price);
      if (price > 0) {
        // 提取基础代币符号（如 BNBUSDT -> BNB）
        const baseSymbol = item.symbol.replace('USDT', '').replace('BUSD', '').replace('USDC', '');
        priceMap.set(baseSymbol, price);
        
        // 更新缓存
        priceCache.set(item.symbol, {
          price,
          timestamp: Date.now(),
        });
      }
    });
    
    console.log(`成功获取 ${priceMap.size} 个代币价格`);
    return priceMap;
  } catch (error) {
    console.error("批量获取价格失败:", error);
    
    // 如果批量获取失败，尝试单独获取BNB价格
    if (symbols.includes("BNBUSDT")) {
      const bnbPrice = await getBNBPrice();
      if (bnbPrice > 0) {
        priceMap.set("BNB", bnbPrice);
      }
    }
    
    return priceMap;
  }
};

// 获取BNB兜底价格（当API失败时使用）
const getBNBFallbackPrice = (): number => {
  console.warn("使用BNB兜底价格: $600");
  return 600; // 兜底价格
};

// 将BNB转换为USDT
export const convertBNBToUSDT = async (bnbAmount: number): Promise<number> => {
  const bnbPrice = await getBNBPrice();
  return bnbAmount * bnbPrice;
};

// 清除价格缓存
export const clearPriceCache = (): void => {
  priceCache.clear();
  console.log("价格缓存已清除");
};

// 获取缓存状态
export const getCacheStatus = (): { symbol: string; price: number; age: number }[] => {
  const now = Date.now();
  return Array.from(priceCache.entries()).map(([symbol, cache]) => ({
    symbol,
    price: cache.price,
    age: Math.round((now - cache.timestamp) / 1000), // 秒
  }));
};
