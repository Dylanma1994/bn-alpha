import React from "react";
import { Card, Row, Col, Statistic, Tag } from "antd";
import {
  TransactionOutlined,
  DollarOutlined,
  TrophyOutlined,
  LinkOutlined,
  FallOutlined,
} from "@ant-design/icons";
import type { DailySummary } from "../types";
import { formatNumber } from "../utils/dataProcessor";
import { useBNBPrice } from "../hooks/useBNBPrice";

interface SummaryCardProps {
  summary: DailySummary;
  searchedAddress: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  summary,
  searchedAddress,
}) => {
  const { convertGasFeeToUSDT } = useBNBPrice();
  return (
    <Card
      title={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <TransactionOutlined
              style={{ marginRight: "8px", color: "#1890ff" }}
            />
            今日交易汇总
          </div>
          <Tag icon={<LinkOutlined />} color="blue">
            {`${searchedAddress.slice(0, 6)}...${searchedAddress.slice(-4)}`}
          </Tag>
        </div>
      }
      style={{ marginBottom: "24px" }}
    >
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6} lg={6} xl={6}>
          <Card
            size="small"
            style={{
              textAlign: "center",
              background: "#f0f9ff",
              height: "100%",
            }}
          >
            <Statistic
              title="总交易数"
              value={summary.totalTransactions}
              prefix={<TransactionOutlined style={{ color: "#1890ff" }} />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={6} xl={6}>
          <Card
            size="small"
            style={{
              textAlign: "center",
              background: "#fff2f0",
              height: "100%",
            }}
          >
            <Statistic
              title={
                <span style={{ color: "#ff4d4f" }}>
                  <FallOutlined style={{ marginRight: "4px" }} />
                  总损耗
                </span>
              }
              value={formatNumber(
                summary.slippageLoss + convertGasFeeToUSDT(summary.totalGasFee),
                2
              )}
              suffix={
                <span style={{ fontSize: "12px" }}>
                  u ({formatNumber(summary.slippageLoss, 2)} +{" "}
                  {formatNumber(convertGasFeeToUSDT(summary.totalGasFee), 2)})
                </span>
              }
              valueStyle={{ color: "#ff4d4f" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={6} xl={6}>
          <Card
            size="small"
            style={{
              textAlign: "center",
              background: "#f6ffed",
              height: "100%",
            }}
          >
            <Statistic
              title="总交易量"
              value={formatNumber(summary.totalBuyVolume, 2)}
              suffix="u"
              prefix={<DollarOutlined style={{ color: "#52c41a" }} />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={6} xl={6}>
          <Card
            size="small"
            style={{
              textAlign: "center",
              background: "#f9f0ff",
              height: "100%",
            }}
          >
            <Statistic
              title="BN Alpha 分数"
              value={summary.bnAlphaScore}
              prefix={<TrophyOutlined style={{ color: "#722ed1" }} />}
              valueStyle={{
                color: "#722ed1",
                fontSize: "24px",
                fontWeight: "bold",
              }}
            />
          </Card>
        </Col>
      </Row>
    </Card>
  );
};

export default SummaryCard;
