import React from "react";
import { Table, Card, Tag, Avatar, Typography, Empty } from "antd";
import { ContainerOutlined, FileTextOutlined } from "@ant-design/icons";
import type { TokenSummary } from "../types";
import { formatNumber, formatAddress } from "../utils/dataProcessor";

const { Text } = Typography;

interface TransactionTableProps {
  tokenSummaries: TokenSummary[];
}

const TransactionTable: React.FC<TransactionTableProps> = ({
  tokenSummaries,
}) => {
  const columns = [
    {
      title: "币种信息",
      dataIndex: "symbol",
      key: "symbol",
      render: (symbol: string, record: TokenSummary) => (
        <div style={{ display: "flex", alignItems: "center" }}>
          <Avatar
            style={{
              backgroundColor: "#1890ff",
              marginRight: "12px",
            }}
            icon={<ContainerOutlined />}
          >
            {symbol.charAt(0)}
          </Avatar>
          <div>
            <div style={{ fontWeight: "bold", fontSize: "14px" }}>{symbol}</div>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              {record.name}
            </Text>
          </div>
        </div>
      ),
    },
    {
      title: "合约地址",
      dataIndex: "contractAddress",
      key: "contractAddress",
      render: (address: string) =>
        address ? (
          <Tag color="blue" style={{ fontFamily: "monospace" }}>
            {formatAddress(address)}
          </Tag>
        ) : (
          <Tag color="gold">原生代币</Tag>
        ),
    },
    {
      title: "交易次数",
      dataIndex: "transactionCount",
      key: "transactionCount",
      align: "center" as const,
      render: (count: number) => (
        <Tag color="green" style={{ fontSize: "12px" }}>
          {count} 次
        </Tag>
      ),
    },
    {
      title: "总交易量",
      dataIndex: "totalValue",
      key: "totalValue",
      align: "right" as const,
      render: (value: number, record: TokenSummary) => (
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: "bold" }}>{formatNumber(value)}</div>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {record.symbol}
          </Text>
        </div>
      ),
    },
    {
      title: "Gas 费用 (BNB)",
      dataIndex: "totalGasFee",
      key: "totalGasFee",
      align: "right" as const,
      render: (fee: number) => (
        <Text style={{ fontWeight: "bold", color: "#52c41a" }}>
          {formatNumber(fee, 6)}
        </Text>
      ),
    },
  ];

  return (
    <Card
      title={
        <div style={{ display: "flex", alignItems: "center" }}>
          <FileTextOutlined style={{ marginRight: "8px", color: "#1890ff" }} />
          币种交易详情
        </div>
      }
    >
      <Table
        columns={columns}
        dataSource={tokenSummaries.map((item, index) => ({
          ...item,
          key: `${item.symbol}-${index}`,
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
              description="暂无交易数据"
            />
          ),
        }}
        scroll={{ x: 800 }}
        size="middle"
      />
    </Card>
  );
};

export default TransactionTable;
