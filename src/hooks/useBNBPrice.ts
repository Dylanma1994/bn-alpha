import { useState, useEffect } from "react";
import { priceManager } from "../utils/priceManager";

// BNB价格Hook
export const useBNBPrice = () => {
  const [bnbPrice, setBnbPrice] = useState<number>(600); // 默认价格
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchPrice = async () => {
      try {
        setLoading(true);
        setError(null);
        const price = await priceManager.getBNBPrice();
        
        if (mounted) {
          setBnbPrice(price);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "获取价格失败");
          console.error("获取BNB价格失败:", err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchPrice();

    // 设置定时更新（每5分钟）
    const interval = setInterval(fetchPrice, 5 * 60 * 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // 手动刷新价格
  const refreshPrice = async () => {
    try {
      setLoading(true);
      setError(null);
      const price = await priceManager.forceUpdateBNBPrice();
      setBnbPrice(price);
    } catch (err) {
      setError(err instanceof Error ? err.message : "刷新价格失败");
      console.error("刷新BNB价格失败:", err);
    } finally {
      setLoading(false);
    }
  };

  // 转换Gas费用为USDT
  const convertGasFeeToUSDT = (gasFeeInBNB: number): number => {
    return gasFeeInBNB * bnbPrice;
  };

  return {
    bnbPrice,
    loading,
    error,
    refreshPrice,
    convertGasFeeToUSDT,
  };
};
