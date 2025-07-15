/**
 * Alpha代币配置
 * 当交易的代币是Alpha代币时，交易金额要x2
 * 在交易明细中，如果代币是Alpha代币，也增加一个tag标识出来
 */

// 默认Alpha代币列表
const DEFAULT_ALPHA_TOKENS = [
  "ZKJ",
  "KOGE",
  "CHEEMS",
  "APX",
  "AIXBT",
  "AI16Z",
  "KOMA",
  "B2",
  "SKYAI",
  "KMNO",
  "MERL",
  "TAIKO",
  "BR",
];

// localStorage存储key
const ALPHA_TOKENS_STORAGE_KEY = "bn_alpha_tokens";

/**
 * 获取Alpha代币列表
 * @returns Alpha代币列表
 */
export const getAlphaTokens = (): string[] => {
  try {
    const savedTokens = localStorage.getItem(ALPHA_TOKENS_STORAGE_KEY);
    if (savedTokens) {
      return JSON.parse(savedTokens);
    }
  } catch (error) {
    console.error("获取Alpha代币列表失败:", error);
  }
  return DEFAULT_ALPHA_TOKENS;
};

/**
 * 保存Alpha代币列表
 * @param tokens Alpha代币列表
 */
export const saveAlphaTokens = (tokens: string[]): void => {
  try {
    localStorage.setItem(ALPHA_TOKENS_STORAGE_KEY, JSON.stringify(tokens));
    console.log("Alpha代币列表已保存:", tokens);
  } catch (error) {
    console.error("保存Alpha代币列表失败:", error);
  }
};

/**
 * 重置Alpha代币列表为默认值
 */
export const resetAlphaTokens = (): void => {
  try {
    localStorage.removeItem(ALPHA_TOKENS_STORAGE_KEY);
    console.log("Alpha代币列表已重置为默认值");
  } catch (error) {
    console.error("重置Alpha代币列表失败:", error);
  }
};

/**
 * 检查代币是否是Alpha代币
 * @param tokenSymbol 代币符号
 * @returns 是否是Alpha代币
 */
export const isAlphaToken = (tokenSymbol: string): boolean => {
  if (!tokenSymbol) return false;
  const alphaTokens = getAlphaTokens();
  return alphaTokens.includes(tokenSymbol.toUpperCase());
};

/**
 * 获取Alpha代币的交易金额倍数（仅用于BN Alpha分数计算）
 * @param tokenSymbol 代币符号
 * @returns 交易金额倍数
 */
export const getAlphaMultiplier = (tokenSymbol: string): number => {
  return isAlphaToken(tokenSymbol) ? 2 : 1;
};
