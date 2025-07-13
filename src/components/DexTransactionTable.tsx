import React from "react";
import { Table, Card, Tag, Avatar, Typography, Empty, Space } from "antd";
import {
  SwapOutlined,
  FileTextOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import type { DexTransactionSummary } from "../types";
import { formatNumber, formatAddress } from "../utils/dataProcessor";

const { Text } = Typography;

interface DexTransactionTableProps {
  dexTransactions: DexTransactionSummary[];
}

const DexTransactionTable: React.FC<DexTransactionTableProps> = ({
  dexTransactions,
}) => {
  const columns = [
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
      render: (pair: string, record: DexTransactionSummary) => (
        <div style={{ display: "flex", alignItems: "center" }}>
          <Avatar
            style={{
              backgroundColor: record.type === "buy" ? "#52c41a" : "#ff4d4f",
              marginRight: "8px",
            }}
            size="small"
            icon={<SwapOutlined />}
          />
          <Text strong style={{ fontSize: "13px" }}>
            {pair}
          </Text>
        </div>
      ),
    },
    {
      title: "卖出",
      key: "fromToken",
      width: 150,
      render: (record: DexTransactionSummary) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: "12px", fontWeight: "bold" }}>
            {record.fromToken}
          </Text>
          <Text type="secondary" style={{ fontSize: "11px" }}>
            {formatNumber(record.fromAmount, 6)}
          </Text>
        </Space>
      ),
    },
    {
      title: "买入",
      key: "toToken",
      width: 150,
      render: (record: DexTransactionSummary) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: "12px", fontWeight: "bold" }}>
            {record.toToken}
          </Text>
          <Text type="secondary" style={{ fontSize: "11px" }}>
            {formatNumber(record.toAmount, 6)}
          </Text>
        </Space>
      ),
    },
    {
      title: "Gas 费用",
      dataIndex: "gasFee",
      key: "gasFee",
      width: 100,
      render: (gasFee: number) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: "12px" }}>{formatNumber(gasFee, 6)}</Text>
          <Text type="secondary" style={{ fontSize: "11px" }}>
            BNB
          </Text>
        </Space>
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
              {isInflow ? "+" : ""}
              {formatNumber(Math.abs(loss), 2)} u
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
      width: 120,
      render: (hash: string) => (
        <Text
          code
          style={{ fontSize: "11px", cursor: "pointer" }}
          onClick={() => {
            const url = `https://bscscan.com/tx/${hash}`;
            window.open(url, "_blank");
          }}
        >
          {formatAddress(hash)}
        </Text>
      ),
    },
  ];

  return (
    <Card
      title={
        <div style={{ display: "flex", alignItems: "center" }}>
          <FileTextOutlined style={{ marginRight: "8px", color: "#1890ff" }} />
          DEX 交易记录
          <Tag color="blue" style={{ marginLeft: "8px" }}>
            {dexTransactions.length} 笔交易
          </Tag>
        </div>
      }
    >
      <Table
        columns={columns}
        dataSource={dexTransactions.map((item, index) => ({
          ...item,
          key: `${item.hash}-${index}`,
        }))}
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
              description="暂无 DEX 交易数据"
            />
          ),
        }}
        scroll={{ x: 1000 }}
        size="middle"
      />
    </Card>
  );
};

export default DexTransactionTable;
