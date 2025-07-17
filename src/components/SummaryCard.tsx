import React, { useState } from "react";
import { Card, Row, Col, Statistic, Tag, Modal, Space, Typography } from "antd";
import {
  TransactionOutlined,
  DollarOutlined,
  TrophyOutlined,
  LinkOutlined,
  FallOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import type { DailySummary } from "../types";
import { formatNumber } from "../utils/dataProcessor";
import { useBNBPrice } from "../hooks/useBNBPrice";

const { Text, Title } = Typography;

interface SummaryCardProps {
  summary: DailySummary;
  searchedAddresses: string[];
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  summary,
  searchedAddresses,
}) => {
  const { convertGasFeeToUSDT } = useBNBPrice();
  const [showVolumeDetail, setShowVolumeDetail] = useState(false);

  // 计算倍数后的总交易量和明细
  const alphaVolumeMultiplied = (summary.alphaVolume || 0) * 2;
  const normalVolume = summary.normalVolume || 0;
  const totalVolumeWithMultiplier = alphaVolumeMultiplied + normalVolume;
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
            {searchedAddresses.length === 1
              ? `${searchedAddresses[0].slice(
                  0,
                  6
                )}...${searchedAddresses[0].slice(-4)}`
              : "批量查询"}
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
              value={
                "$" +
                formatNumber(
                  summary.slippageLoss +
                    convertGasFeeToUSDT(summary.totalGasFee),
                  2
                )
              }
              // suffix={
              //   <span style={{ fontSize: "12px" }}>
              //     u ({formatNumber(summary.slippageLoss, 2)} +{" "}
              //     {formatNumber(convertGasFeeToUSDT(summary.totalGasFee), 2)})
              //   </span>
              // }
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
              title={
                <div
                  style={{ cursor: "pointer" }}
                  onClick={() => setShowVolumeDetail(true)}
                >
                  <span style={{ borderBottom: "1px dashed #52c41a" }}>
                    总交易量
                  </span>
                  <InfoCircleOutlined
                    style={{ marginLeft: "4px", fontSize: "12px" }}
                  />
                </div>
              }
              value={"$" + formatNumber(summary.totalBuyVolume, 2)}
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
              title="Alpha 分数(含倍数)"
              value={summary.bnAlphaScore}
              valueStyle={{
                color: "#722ed1",
                fontSize: "24px",
                fontWeight: "bold",
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* 交易量详情弹窗 */}
      <Modal
        title={
          <Space>
            <DollarOutlined style={{ color: "#52c41a" }} />
            交易量详情
          </Space>
        }
        open={showVolumeDetail}
        onCancel={() => setShowVolumeDetail(false)}
        footer={null}
        width={500}
      >
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <div>
            <Title level={5} style={{ margin: 0, color: "#52c41a" }}>
              原始总交易量
            </Title>
            <Text
              style={{ fontSize: "24px", fontWeight: "bold", color: "#52c41a" }}
            >
              {formatNumber(summary.totalBuyVolume, 2)} u
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: "12px" }}>
              不含Alpha代币倍数的原始交易量
            </Text>
          </div>

          <div>
            <Title level={5} style={{ margin: 0, color: "#722ed1" }}>
              Alpha倍数后总交易量
            </Title>
            <Text
              style={{ fontSize: "24px", fontWeight: "bold", color: "#722ed1" }}
            >
              {formatNumber(totalVolumeWithMultiplier, 2)} u
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: "12px" }}>
              用于BN Alpha分数计算的交易量
            </Text>
          </div>

          <div
            style={{
              background: "#f9f9f9",
              padding: "16px",
              borderRadius: "8px",
              border: "1px solid #e8e8e8",
            }}
          >
            <Title level={5} style={{ margin: "0 0 12px 0" }}>
              交易量组成明细
            </Title>
            <Space direction="vertical" size="small" style={{ width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text>Alpha代币交易量 × 2：</Text>
                <Text strong style={{ color: "#722ed1" }}>
                  {formatNumber(summary.alphaVolume || 0, 2)} × 2 ={" "}
                  {formatNumber(alphaVolumeMultiplied, 2)} u
                </Text>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text>普通代币交易量：</Text>
                <Text strong style={{ color: "#52c41a" }}>
                  {formatNumber(normalVolume, 2)} u
                </Text>
              </div>
              <div
                style={{
                  borderTop: "1px solid #d9d9d9",
                  paddingTop: "8px",
                  marginTop: "8px",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <Text strong>总计：</Text>
                <Text strong style={{ fontSize: "16px", color: "#722ed1" }}>
                  {formatNumber(totalVolumeWithMultiplier, 2)} u
                </Text>
              </div>
            </Space>
          </div>
        </Space>
      </Modal>
    </Card>
  );
};

export default SummaryCard;
