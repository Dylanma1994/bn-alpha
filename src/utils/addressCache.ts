// 地址缓存工具
const ADDRESS_CACHE_KEY = "bn_alpha_addresses";
const MAX_CACHED_ADDRESSES = 10; // 最多缓存10个地址

export interface CachedAddress {
  address: string;
  label?: string; // 可选的地址标签
  lastUsed: number; // 最后使用时间戳
  searchCount: number; // 搜索次数
}

// 获取缓存的地址列表
export const getCachedAddresses = (): CachedAddress[] => {
  try {
    const cached = localStorage.getItem(ADDRESS_CACHE_KEY);
    if (cached) {
      const addresses: CachedAddress[] = JSON.parse(cached);
      // 按最后使用时间排序
      return addresses.sort((a, b) => b.lastUsed - a.lastUsed);
    }
  } catch (error) {
    console.error("获取缓存地址失败:", error);
  }
  return [];
};

// 添加地址到缓存
export const addAddressToCache = (address: string, label?: string): void => {
  try {
    const addresses = getCachedAddresses();
    const now = Date.now();
    
    // 检查地址是否已存在
    const existingIndex = addresses.findIndex(
      (item) => item.address.toLowerCase() === address.toLowerCase()
    );
    
    if (existingIndex >= 0) {
      // 更新现有地址
      addresses[existingIndex] = {
        ...addresses[existingIndex],
        lastUsed: now,
        searchCount: addresses[existingIndex].searchCount + 1,
        label: label || addresses[existingIndex].label,
      };
    } else {
      // 添加新地址
      const newAddress: CachedAddress = {
        address,
        label,
        lastUsed: now,
        searchCount: 1,
      };
      addresses.unshift(newAddress);
    }
    
    // 限制缓存数量
    const limitedAddresses = addresses.slice(0, MAX_CACHED_ADDRESSES);
    
    localStorage.setItem(ADDRESS_CACHE_KEY, JSON.stringify(limitedAddresses));
  } catch (error) {
    console.error("添加地址到缓存失败:", error);
  }
};

// 从缓存中移除地址
export const removeAddressFromCache = (address: string): void => {
  try {
    const addresses = getCachedAddresses();
    const filteredAddresses = addresses.filter(
      (item) => item.address.toLowerCase() !== address.toLowerCase()
    );
    localStorage.setItem(ADDRESS_CACHE_KEY, JSON.stringify(filteredAddresses));
  } catch (error) {
    console.error("从缓存移除地址失败:", error);
  }
};

// 更新地址标签
export const updateAddressLabel = (address: string, label: string): void => {
  try {
    const addresses = getCachedAddresses();
    const targetIndex = addresses.findIndex(
      (item) => item.address.toLowerCase() === address.toLowerCase()
    );
    
    if (targetIndex >= 0) {
      addresses[targetIndex].label = label;
      localStorage.setItem(ADDRESS_CACHE_KEY, JSON.stringify(addresses));
    }
  } catch (error) {
    console.error("更新地址标签失败:", error);
  }
};

// 清空地址缓存
export const clearAddressCache = (): void => {
  try {
    localStorage.removeItem(ADDRESS_CACHE_KEY);
  } catch (error) {
    console.error("清空地址缓存失败:", error);
  }
};

// 格式化地址显示
export const formatAddressDisplay = (address: string, label?: string): string => {
  if (label) {
    return `${label} (${address.slice(0, 6)}...${address.slice(-4)})`;
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};
