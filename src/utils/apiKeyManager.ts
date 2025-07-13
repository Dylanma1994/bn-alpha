// API Key 管理器
const API_KEY_STORAGE_KEY = "bn_alpha_api_key";

// 保存API Key
export const saveApiKey = (apiKey: string): void => {
  try {
    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey.trim());
    console.log("API Key 已保存");
  } catch (error) {
    console.error("保存 API Key 失败:", error);
  }
};

// 获取API Key
export const getApiKey = (): string => {
  try {
    const savedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    if (savedKey && savedKey.trim()) {
      return savedKey.trim();
    }
  } catch (error) {
    console.error("获取 API Key 失败:", error);
  }

  // 如果没有保存的key，使用环境变量中的默认key
  return import.meta.env.VITE_ETHERSCAN_API_KEY || "YourApiKeyToken";
};

// 清除API Key
export const clearApiKey = (): void => {
  try {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
    console.log("API Key 已清除");
  } catch (error) {
    console.error("清除 API Key 失败:", error);
  }
};

// 检查是否使用默认API Key
export const isUsingDefaultKey = (): boolean => {
  try {
    const savedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    return !savedKey || savedKey.trim() === "";
  } catch (error) {
    return true;
  }
};

// 验证API Key格式（基本验证）
export const validateApiKey = (apiKey: string): boolean => {
  if (!apiKey || apiKey.trim().length === 0) {
    return false;
  }

  // Etherscan API Key 通常是32位字符
  const trimmedKey = apiKey.trim();
  return trimmedKey.length >= 20 && /^[a-zA-Z0-9]+$/.test(trimmedKey);
};
