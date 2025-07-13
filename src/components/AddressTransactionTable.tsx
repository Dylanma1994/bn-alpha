import React, { useState } from "react";
import { Table, Space, Typography, Tag, Button } from "antd";
import {
  DownOutlined,
  RightOutlined,
  WalletOutlined,
  DollarOutlined,
  FallOutlined,
} from "@ant-design/icons";
import type { DexTransactionSummary, AddressSummary } from "../types";
import { formatNumber } from "../utils/dataProcessor";

const { Text } = Typography;

interface AddressTransactionTableProps {
  addressSummaries: AddressSummary[];
}

const AddressTransactionTable: React.FC<AddressTransactionTableProps> = ({
  addressSummaries,
}) => {
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);

  // 主表格列定义（地址维度）
  const addressColumns = [
    {
      title: "地址",
      key: "address",
      width: 200,
      render: (record: AddressSummary) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: "12px", fontWeight: "bold" }}>
            <WalletOutlined style={{ marginRight: "4px", color: "#1890ff" }} />
            {record.address.slice(0, 6)}...{record.address.slice(-4)}
          </Text>
          {record.label && <Tag color="blue">{record.label}</Tag>}
        </Space>
      ),
    },
    {
      title: "交易数",
      key: "totalTransactions",
      width: 80,
      render: (record: AddressSummary) => (
        <Text style={{ fontSize: "12px", fontWeight: "bold" }}>
          {record.summary.totalTransactions}
        </Text>
      ),
    },
    {
      title: "交易量",
      key: "totalBuyVolume",
      width: 100,
      render: (record: AddressSummary) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: "12px", color: "#52c41a" }}>
            <DollarOutlined style={{ marginRight: "2px" }} />
            {formatNumber(record.summary.totalBuyVolume, 2)} u
          </Text>
          <Text type="secondary" style={{ fontSize: "10px" }}>
            买入量
          </Text>
        </Space>
      ),
    },
    {
      title: "总损耗",
      key: "totalLoss",
      width: 120,
      render: (record: AddressSummary) => {
        const totalLoss =
          record.summary.slippageLoss + record.summary.totalGasFee * 600;
        return (
          <Space direction="vertical" size={0}>
            <Text
              style={{ fontSize: "12px", color: "#ff4d4f", fontWeight: "bold" }}
            >
              <FallOutlined style={{ marginRight: "2px" }} />
              {formatNumber(totalLoss, 2)} u
            </Text>
            <Space size={4}>
              <Text type="secondary" style={{ fontSize: "10px" }}>
                净: {formatNumber(record.summary.slippageLoss, 2)}u
              </Text>
              <Text type="secondary" style={{ fontSize: "10px" }}>
                Gas: {formatNumber(record.summary.totalGasFee * 600, 2)}u
              </Text>
            </Space>
          </Space>
        );
      },
    },
    {
      title: "BN Alpha",
      key: "bnAlphaScore",
      width: 80,
      render: (record: AddressSummary) => (
        <Text
          style={{ fontSize: "14px", fontWeight: "bold", color: "#722ed1" }}
        >
          {record.summary.bnAlphaScore}
        </Text>
      ),
    },
    {
      title: "操作",
      key: "action",
      width: 80,
      render: (record: AddressSummary) => {
        const isExpanded = expandedRowKeys.includes(record.address);
        return (
          <Button
            type="link"
            size="small"
            icon={isExpanded ? <DownOutlined /> : <RightOutlined />}
            onClick={() => handleExpand(record.address)}
          >
            {isExpanded ? "收起" : "详情"}
          </Button>
        );
      },
    },
  ];

  // 详细交易表格列定义
  const transactionColumns = [
    {
      title: "时间",
      key: "timeStamp",
      width: 120,
      render: (record: DexTransactionSummary) => (
        <Text style={{ fontSize: "11px" }}>
          {new Date(parseInt(record.timeStamp) * 1000).toLocaleTimeString()}
        </Text>
      ),
    },
    {
      title: "类型",
      key: "type",
      width: 60,
      render: (record: DexTransactionSummary) => (
        <Tag color={record.type === "buy" ? "green" : "red"}>
          {record.type === "buy" ? "买入" : "卖出"}
        </Tag>
      ),
    },
    {
      title: "交易对",
      key: "pair",
      width: 100,
      render: (record: DexTransactionSummary) => (
        <Text style={{ fontSize: "11px", fontWeight: "bold" }}>
          {record.pair}
        </Text>
      ),
    },
    {
      title: "发送",
      key: "from",
      width: 100,
      render: (record: DexTransactionSummary) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: "11px" }}>
            {formatNumber(record.fromAmount, 4)}
          </Text>
          <Text type="secondary" style={{ fontSize: "10px" }}>
            {record.fromToken}
          </Text>
        </Space>
      ),
    },
    {
      title: "接收",
      key: "to",
      width: 100,
      render: (record: DexTransactionSummary) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: "11px" }}>
            {formatNumber(record.toAmount, 4)}
          </Text>
          <Text type="secondary" style={{ fontSize: "10px" }}>
            {record.toToken}
          </Text>
        </Space>
      ),
    },
    {
      title: "Gas费用",
      key: "gasFee",
      width: 80,
      render: (gasFee: number) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: "11px" }}>{formatNumber(gasFee, 6)}</Text>
          <Text type="secondary" style={{ fontSize: "10px" }}>
            BNB
          </Text>
        </Space>
      ),
    },
    {
      title: "损耗",
      key: "slippageLoss",
      width: 80,
      render: (record: DexTransactionSummary) => {
        const loss = record.slippageLoss || 0;
        const isInflow = loss < 0;
        return (
          <Space direction="vertical" size={0}>
            <Text
              style={{
                fontSize: "11px",
                color: isInflow ? "#52c41a" : "#ff4d4f",
                fontWeight: "bold",
              }}
            >
              {isInflow ? "+" : ""}
              {formatNumber(Math.abs(loss), 2)} u
            </Text>
            <Text type="secondary" style={{ fontSize: "10px" }}>
              {record.type === "buy" ? "流出" : "流入"}
            </Text>
          </Space>
        );
      },
    },
  ];

  const handleExpand = (address: string) => {
    const newExpandedKeys = expandedRowKeys.includes(address)
      ? expandedRowKeys.filter((key) => key !== address)
      : [...expandedRowKeys, address];
    setExpandedRowKeys(newExpandedKeys);
  };

  const expandedRowRender = (record: AddressSummary) => {
    return (
      <Table
        columns={transactionColumns}
        dataSource={record.dexTransactions}
        rowKey="hash"
        pagination={false}
        size="small"
        style={{ margin: "0 24px" }}
        scroll={{ x: 800 }}
      />
    );
  };

  return (
    <Table
      columns={addressColumns}
      dataSource={addressSummaries}
      rowKey="address"
      expandable={{
        expandedRowKeys,
        onExpand: (_expanded, record) => handleExpand(record.address),
        expandedRowRender,
        showExpandColumn: false, // 隐藏默认的展开列，使用自定义按钮
      }}
      pagination={{
        pageSize: 10,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total) => `共 ${total} 个地址`,
      }}
      scroll={{ x: 800 }}
      size="small"
    />
  );
};

export default AddressTransactionTable;
