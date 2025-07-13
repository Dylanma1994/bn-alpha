import { getBNBPrice } from "../services/binancePriceService";

// 价格管理器
class PriceManager {
  private static instance: PriceManager;
  private bnbPrice: number = 600; // 默认价格
  private lastUpdate: number = 0;
  private updatePromise: Promise<void> | null = null;

  private constructor() {}

  public static getInstance(): PriceManager {
    if (!PriceManager.instance) {
      PriceManager.instance = new PriceManager();
    }
    return PriceManager.instance;
  }

  // 获取当前BNB价格
  public async getBNBPrice(): Promise<number> {
    const now = Date.now();
    const cacheAge = now - this.lastUpdate;
    
    // 如果缓存超过5分钟，更新价格
    if (cacheAge > 5 * 60 * 1000) {
      await this.updateBNBPrice();
    }
    
    return this.bnbPrice;
  }

  // 更新BNB价格
  private async updateBNBPrice(): Promise<void> {
    // 如果已经有更新在进行中，等待它完成
    if (this.updatePromise) {
      return this.updatePromise;
    }

    this.updatePromise = this.doUpdateBNBPrice();
    
    try {
      await this.updatePromise;
    } finally {
      this.updatePromise = null;
    }
  }

  private async doUpdateBNBPrice(): Promise<void> {
    try {
      const newPrice = await getBNBPrice();
      if (newPrice > 0) {
        this.bnbPrice = newPrice;
        this.lastUpdate = Date.now();
        console.log(`BNB价格已更新: $${this.bnbPrice}`);
      }
    } catch (error) {
      console.error("更新BNB价格失败:", error);
    }
  }

  // 强制更新价格
  public async forceUpdateBNBPrice(): Promise<number> {
    this.lastUpdate = 0; // 重置缓存时间
    await this.updateBNBPrice();
    return this.bnbPrice;
  }

  // 将BNB转换为USDT
  public async convertBNBToUSDT(bnbAmount: number): Promise<number> {
    const price = await this.getBNBPrice();
    return bnbAmount * price;
  }

  // 获取价格状态
  public getPriceStatus(): { price: number; lastUpdate: Date; cacheAge: number } {
    return {
      price: this.bnbPrice,
      lastUpdate: new Date(this.lastUpdate),
      cacheAge: Math.round((Date.now() - this.lastUpdate) / 1000),
    };
  }
}

// 导出单例实例
export const priceManager = PriceManager.getInstance();

// 便捷函数
export const getBNBPriceFromManager = (): Promise<number> => {
  return priceManager.getBNBPrice();
};

export const convertBNBToUSDT = (bnbAmount: number): Promise<number> => {
  return priceManager.convertBNBToUSDT(bnbAmount);
};
