// 代币符号到 CoinGecko ID 的映射配置
export const TOKEN_TO_COINGECKO_ID: Record<string, string> = {
  // 主流稳定币
  USDT: "tether",
  USDC: "usd-coin",
  BUSD: "binance-usd",
  DAI: "dai",
  "BSC-USD": "binance-usd",

  // 主流代币
  BTC: "bitcoin",
  ETH: "ethereum",
  BNB: "binancecoin",
  ADA: "cardano",
  DOT: "polkadot",
  LINK: "chainlink",
  UNI: "uniswap",
  CAKE: "pancakeswap-token",

  // BNB 链常见代币
  WBNB: "wbnb",
  BTCB: "bitcoin-bep2",
  XRP: "ripple",
  LTC: "litecoin",
  BCH: "bitcoin-cash",
  EOS: "eos",
  TRX: "tron",
  XLM: "stellar",
  ATOM: "cosmos",
  VET: "vechain",
  FIL: "filecoin",
  THETA: "theta-token",
  AAVE: "aave",
  COMP: "compound-governance-token",
  MKR: "maker",
  SNX: "havven",
  YFI: "yearn-finance",
  SUSHI: "sushi",
  CRV: "curve-dao-token",
  BAL: "balancer",
  REN: "republic-protocol",
  KNC: "kyber-network-crystal",
  ZRX: "0x",
  BAT: "basic-attention-token",
  ENJ: "enjincoin",
  MANA: "decentraland",
  SAND: "the-sandbox",
  AXS: "axie-infinity",
  GALA: "gala",
  CHZ: "chiliz",
  FLOW: "flow",
  ICP: "internet-computer",
  NEAR: "near",
  AVAX: "avalanche-2",
  MATIC: "matic-network",
  FTM: "fantom",
  ONE: "harmony",
  ALGO: "algorand",
  EGLD: "elrond-erd-2",
  HBAR: "hedera-hashgraph",
  XTZ: "tezos",
  WAVES: "waves",
  KSM: "kusama",
  ZIL: "zilliqa",
  ICX: "icon",
  ONT: "ontology",
  ZEC: "zcash",
  DASH: "dash",
  DCR: "decred",
  DGB: "digibyte",
  RVN: "ravencoin",
  QTUM: "qtum",
  BTG: "bitcoin-gold",
  ZEN: "zencash",
  DOGE: "dogecoin",
  SHIB: "shiba-inu",

  // 其他常见代币（可以根据需要添加更多）
  BR: "br-token", // 示例代币，需要根据实际情况调整
};

// 获取代币的 CoinGecko ID
export const getCoinGeckoId = (tokenSymbol: string): string | null => {
  const upperSymbol = tokenSymbol.toUpperCase();
  return TOKEN_TO_COINGECKO_ID[upperSymbol] || null;
};

// 检查代币是否支持价格查询
export const isSupportedToken = (tokenSymbol: string): boolean => {
  return getCoinGeckoId(tokenSymbol) !== null;
};
