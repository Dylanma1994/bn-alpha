import React from "react";
import {
  Table,
  Card,
  Tag,
  Avatar,
  Typography,
  Empty,
  Space,
  Tooltip,
} from "antd";
import {
  SwapOutlined,
  FileTextOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import type { AddressSummary, DexTransactionSummary } from "../types";
import {
  formatNumber,
  formatAddress,
  calculateNextLevelVolume,
} from "../utils/dataProcessor";
import { useBNBPrice } from "../hooks/useBNBPrice";
import { isAlphaToken } from "../utils/alphaTokens";

const { Text } = Typography;

interface BatchResultTableProps {
  batchResults: AddressSummary[];
}

const BatchResultTable: React.FC<BatchResultTableProps> = ({
  batchResults,
}) => {
  const { convertGasFeeToUSDT } = useBNBPrice();
  // 详细交易记录的列定义（与单地址查询表格保持一致）
  const detailColumns = [
    {
      title: "交易时间",
      dataIndex: "timeStamp",
      key: "timeStamp",
      width: 160,
      render: (timeStamp: string) => {
        const date = new Date(parseInt(timeStamp) * 1000);
        return (
          <Space direction="vertical" size={0}>
            <Text style={{ fontSize: "12px" }}>
              {date.toLocaleDateString("zh-CN")}
            </Text>
            <Text type="secondary" style={{ fontSize: "11px" }}>
              {date.toLocaleTimeString("zh-CN")}
            </Text>
          </Space>
        );
      },
    },
    {
      title: "交易类型",
      dataIndex: "type",
      key: "type",
      width: 100,
      render: (type: "buy" | "sell") => (
        <Tag
          color={type === "buy" ? "green" : "red"}
          icon={type === "buy" ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
        >
          {type === "buy" ? "买入" : "卖出"}
        </Tag>
      ),
    },
    {
      title: "交易对",
      dataIndex: "pair",
      key: "pair",
      width: 120,
      render: (pair: string) => (
        <Tag color="blue" icon={<SwapOutlined />}>
          {pair}
        </Tag>
      ),
    },
    {
      title: "发送代币",
      key: "fromToken",
      width: 150,
      render: (record: DexTransactionSummary) => {
        const isAlpha = isAlphaToken(record.fromToken);
        return (
          <Space direction="vertical" size={0}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Text strong style={{ fontSize: "12px" }}>
                {record.fromToken}
              </Text>
              {isAlpha && (
                <Tag
                  color="purple"
                  style={{
                    fontSize: "8px",
                    padding: "0 4px",
                    lineHeight: "14px",
                    margin: 0,
                  }}
                >
                  Alpha
                </Tag>
              )}
            </div>
            <Text type="secondary" style={{ fontSize: "11px" }}>
              {formatNumber(record.fromAmount, 6)}
            </Text>
          </Space>
        );
      },
    },
    {
      title: "接收代币",
      key: "toToken",
      width: 150,
      render: (record: DexTransactionSummary) => {
        const isAlpha = isAlphaToken(record.toToken);
        return (
          <Space direction="vertical" size={0}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <Text strong style={{ fontSize: "12px" }}>
                {record.toToken}
              </Text>
              {isAlpha && (
                <Tag
                  color="purple"
                  style={{
                    fontSize: "8px",
                    padding: "0 4px",
                    lineHeight: "14px",
                    margin: 0,
                  }}
                >
                  Alpha
                </Tag>
              )}
            </div>
            <Text type="secondary" style={{ fontSize: "11px" }}>
              {formatNumber(record.toAmount, 6)}
            </Text>
          </Space>
        );
      },
    },
    {
      title: "Gas 费用",
      dataIndex: "gasFee",
      key: "gasFee",
      width: 100,
      render: (gasFee: number) => (
        <Text style={{ fontSize: "12px", fontWeight: "bold" }}>
          {formatNumber(convertGasFeeToUSDT(gasFee), 2)} u
        </Text>
      ),
    },
    {
      title: "损耗",
      key: "slippageLoss",
      width: 100,
      render: (record: DexTransactionSummary) => {
        const loss = record.slippageLoss || 0;
        const isInflow = loss < 0; // 负数表示资金流入
        return (
          <Space direction="vertical" size={0}>
            <Text
              style={{
                fontSize: "12px",
                color: isInflow ? "#52c41a" : "#ff4d4f",
                fontWeight: "bold",
              }}
            >
              {isInflow ? "+" : "-"}
              {"$" + formatNumber(Math.abs(loss), 2)}
            </Text>
            <Text type="secondary" style={{ fontSize: "11px" }}>
              {record.type === "buy" ? "流出" : "流入"}
            </Text>
          </Space>
        );
      },
    },
    {
      title: "交易哈希",
      dataIndex: "hash",
      key: "hash",
      width: 150,
      render: (hash: string) => (
        <Text code style={{ fontSize: "11px" }}>
          {formatAddress(hash)}
        </Text>
      ),
    },
  ];

  // 主表格列定义（地址汇总）
  const mainColumns = [
    {
      title: "钱包地址",
      dataIndex: "address",
      key: "address",
      width: 200,
      render: (address: string) => (
        <Space>
          <Avatar size="small" icon={<WalletOutlined />} />
          <Tooltip title={address}>
            <Text code style={{ fontSize: "12px" }}>
              {formatAddress(address)}
            </Text>
          </Tooltip>
        </Space>
      ),
    },
    {
      title: "交易数量",
      key: "transactionCount",
      width: 100,
      render: (record: AddressSummary) => (
        <Text style={{ fontSize: "14px", fontWeight: "500", color: "#1890ff" }}>
          {record.summary.totalTransactions} 笔
        </Text>
      ),
    },
    {
      title: "总损耗",
      key: "totalLoss",
      width: 120,
      render: (record: AddressSummary) => {
        const gasFeeInUSDT = convertGasFeeToUSDT(record.summary.totalGasFee);
        const totalLoss = record.summary.slippageLoss + gasFeeInUSDT;
        return (
          <Space direction="vertical" size={0} style={{ textAlign: "center" }}>
            <Text
              style={{ fontSize: "14px", fontWeight: "500", color: "#ff4d4f" }}
            >
              {"$" + formatNumber(totalLoss, 2)}
            </Text>
            {/* <Text type="secondary" style={{ fontSize: "10px" }}>
              ({formatNumber(record.summary.slippageLoss, 2)} +{" "}
              {formatNumber(gasFeeInUSDT, 2)})u
            </Text> */}
          </Space>
        );
      },
    },
    {
      title: "交易量",
      key: "volume",
      width: 120,
      render: (record: AddressSummary) => (
        <Text style={{ fontSize: "14px", fontWeight: "500", color: "#52c41a" }}>
          {"$" + formatNumber(record.summary.totalBuyVolume, 2)}
        </Text>
      ),
    },
    {
      title: "下一级交易量",
      key: "nextLevelVolume",
      width: 160,
      render: (record: AddressSummary) => {
        // 使用不含倍数的原始交易量计算下一级
        const nextLevelInfo = calculateNextLevelVolume(
          record.summary.totalBuyVolume
        );
        return (
          <Text
            style={{ fontSize: "14px", fontWeight: "500", color: "#1890ff" }}
          >
            {"$" + formatNumber(nextLevelInfo.nextLevelVolume, 2)}{" "}
            <Text type="secondary" style={{ fontSize: "12px" }}>
              (还需 {"$" + formatNumber(nextLevelInfo.volumeDifference, 2)})
            </Text>
          </Text>
        );
      },
    },
    {
      title: "Alpha分数",
      key: "alphaScore",
      width: 100,
      render: (record: AddressSummary) => (
        <Text style={{ fontSize: "14px", fontWeight: "500", color: "#722ed1" }}>
          {record.summary.bnAlphaScore} 分
        </Text>
      ),
    },
  ];

  return (
    <Card
      title={
        <div style={{ display: "flex", alignItems: "center" }}>
          <FileTextOutlined style={{ marginRight: "8px", color: "#1890ff" }} />
          批量查询结果
          <Tag color="blue" style={{ marginLeft: "8px" }}>
            {batchResults.length} 个地址
          </Tag>
        </div>
      }
    >
      <Table
        columns={mainColumns}
        dataSource={batchResults.map((item, index) => ({
          ...item,
          key: `${item.address}-${index}`,
        }))}
        expandable={{
          expandedRowRender: (record: AddressSummary) => (
            <div style={{ margin: 0 }}>
              <Table
                columns={detailColumns}
                dataSource={record.dexTransactions.map((tx, index) => ({
                  ...tx,
                  key: `${tx.hash}-${index}`,
                }))}
                pagination={false}
                size="small"
                locale={{
                  emptyText: (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description="该地址暂无交易记录"
                    />
                  ),
                }}
              />
            </div>
          ),
          rowExpandable: (record: AddressSummary) =>
            record.dexTransactions.length > 0,
        }}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
        }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="暂无批量查询数据"
            />
          ),
        }}
        scroll={{ x: 960 }}
        size="middle"
      />
    </Card>
  );
};

export default BatchResultTable;
