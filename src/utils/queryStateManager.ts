// 查询状态管理器
const QUERY_STATE_KEY = "bn_alpha_query_state";

export interface AddressWithLabel {
  address: string;
  label?: string;
}

export interface QueryState {
  type: "batch";
  addresses: string[];
  addressesWithLabels: AddressWithLabel[];
  timestamp: number;
}

// 保存查询状态
export const saveQueryState = (
  type: "batch",
  addresses: string[],
  addressesWithLabels?: AddressWithLabel[]
): void => {
  try {
    const queryState: QueryState = {
      type,
      addresses,
      addressesWithLabels:
        addressesWithLabels || addresses.map((addr) => ({ address: addr })),
      timestamp: Date.now(),
    };

    localStorage.setItem(QUERY_STATE_KEY, JSON.stringify(queryState));
    console.log(`已保存查询状态: ${type} - ${addresses.length} 个地址`);
  } catch (error) {
    console.error("保存查询状态失败:", error);
  }
};

// 获取上次查询状态
export const getLastQueryState = (): QueryState | null => {
  try {
    const saved = localStorage.getItem(QUERY_STATE_KEY);
    if (saved) {
      const queryState: QueryState = JSON.parse(saved);
      console.log(
        `找到上次查询状态: ${queryState.type} - ${queryState.addresses.length} 个地址`
      );
      return queryState;
    }
  } catch (error) {
    console.error("获取查询状态失败:", error);
  }
  return null;
};

// 清除查询状态
export const clearQueryState = (): void => {
  try {
    localStorage.removeItem(QUERY_STATE_KEY);
    console.log("已清除查询状态");
  } catch (error) {
    console.error("清除查询状态失败:", error);
  }
};

// 检查是否有有效的查询状态
export const hasValidQueryState = (): boolean => {
  return getLastQueryState() !== null;
};

// 获取查询状态摘要（用于UI显示）
export const getQueryStateSummary = (): string | null => {
  const state = getLastQueryState();
  if (!state) return null;

  const timeAgo = Math.round((Date.now() - state.timestamp) / (1000 * 60)); // 分钟
  const timeText =
    timeAgo < 60 ? `${timeAgo}分钟前` : `${Math.round(timeAgo / 60)}小时前`;

  return `上次批量查询: ${state.addresses.length} 个地址 (${timeText})`;
};
