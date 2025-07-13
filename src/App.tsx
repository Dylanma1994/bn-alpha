import React, { useState } from "react";
import { Layout, Typography, Space, message, Spin, Alert } from "antd";
import { LinkOutlined, LoadingOutlined } from "@ant-design/icons";
import AddressInput from "./components/AddressInput";
import SummaryCard from "./components/SummaryCard";

import DexTransactionTable from "./components/DexTransactionTable";
import {
  getAllTransactions,
  SUPPORTED_CHAINS,
  DEFAULT_CHAIN_ID,
} from "./services/api";
import {
  calculateDailySummary,
  groupTransactionsByHash,
  calculateAndUpdateSlippage,
} from "./utils/dataProcessor";
import type { DailySummary, DexTransactionSummary } from "./types";

const { Content } = Layout;
const { Title, Paragraph } = Typography;

function App() {
  const [loading, setLoading] = useState(false);
  const [dexTransactions, setDexTransactions] = useState<
    DexTransactionSummary[]
  >([]);
  const [dailySummary, setDailySummary] = useState<DailySummary | null>(null);
  const [searchedAddress, setSearchedAddress] = useState<string>("");
  const [loadingProgress, setLoadingProgress] = useState<string>("");

  const handleSearch = async (address: string) => {
    setLoading(true);
    setSearchedAddress(address);

    const chainName = "BNB Smart Chain";
    setLoadingProgress(`正在连接 ${chainName}...`);

    try {
      // 监听控制台日志来更新进度
      const originalLog = console.log;
      console.log = (...args) => {
        const message = args.join(" ");
        if (message.includes("正在获取地址")) {
          setLoadingProgress(`正在连接 Etherscan API... (${chainName})`);
        } else if (message.includes("正在获取普通交易")) {
          setLoadingProgress("正在获取普通交易数据...");
        } else if (message.includes("正在获取代币交易")) {
          setLoadingProgress("正在获取代币交易数据...");
        } else if (message.includes("正在并行获取")) {
          setLoadingProgress("正在并行获取交易数据...");
        } else if (
          message.includes("获取到") &&
          message.includes("笔普通交易")
        ) {
          setLoadingProgress("正在处理普通交易...");
        } else if (
          message.includes("获取到") &&
          message.includes("笔代币交易")
        ) {
          setLoadingProgress("正在处理代币交易...");
        } else if (message.includes("过滤后得到")) {
          setLoadingProgress("正在过滤今日交易...");
        }
        originalLog(...args);
      };

      // 获取交易数据
      const txs = await getAllTransactions(address, DEFAULT_CHAIN_ID);

      // 恢复原始的 console.log
      console.log = originalLog;

      if (txs.length > 0) {
        let dexTxs = groupTransactionsByHash(txs, address);

        // 计算并更新每笔交易的滑点损耗
        dexTxs = calculateAndUpdateSlippage(dexTxs);

        const summary = calculateDailySummary(txs, address, 0);

        setDexTransactions(dexTxs);
        setDailySummary(summary);
        message.success(
          `成功获取 ${dexTxs.length} 笔 DEX 交易记录，BN Alpha 分数: ${summary.bnAlphaScore}`
        );
      } else {
        setDexTransactions([]);
        setDailySummary({
          totalTransactions: 0,
          totalGasFee: 0,
          totalValue: 0,
          uniqueTokens: 0,
          bnAlphaScore: 0,
          walletBalance: 0,
          todayBuyAmount: 0,
          slippageLoss: 0,
        });
        message.info(`该地址在 ${chainName} 今日暂无交易记录`);
      }
    } catch (err) {
      message.error("查询失败，请稍后重试");
      console.error("Error fetching transactions:", err);
    } finally {
      setLoading(false);
      setLoadingProgress("");
    }
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Content style={{ padding: "24px", background: "#f5f5f5" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <Title level={2} style={{ marginBottom: "8px" }}>
              🚀 币安 Alpha 查询
            </Title>
            <Paragraph style={{ fontSize: "16px", color: "#666" }}>
              分析您的 BNB 链交易数据，计算 BN Alpha 分数
            </Paragraph>
            <Paragraph style={{ fontSize: "14px", color: "#999" }}>
              数据源: Etherscan v2 API | 支持实时交易分析
            </Paragraph>
          </div>

          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <AddressInput onSearch={handleSearch} loading={loading} />

            {loading && (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <Spin
                  size="large"
                  indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
                />
                <div
                  style={{ marginTop: "16px", fontSize: "16px", color: "#666" }}
                >
                  {loadingProgress || "正在查询中..."}
                </div>
                <div
                  style={{ marginTop: "8px", fontSize: "14px", color: "#999" }}
                >
                  正在通过 Etherscan v2 API 获取交易数据，请稍候...
                </div>
              </div>
            )}

            {!loading && dailySummary && searchedAddress && (
              <>
                <SummaryCard
                  summary={dailySummary}
                  searchedAddress={searchedAddress}
                />
                <DexTransactionTable dexTransactions={dexTransactions} />
              </>
            )}
          </Space>
        </div>
      </Content>
    </Layout>
  );
}

export default App;
