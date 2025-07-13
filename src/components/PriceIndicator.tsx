import React from "react";
import { Tooltip, Button } from "antd";
import { ReloadOutlined, DollarOutlined } from "@ant-design/icons";
import { useBNBPrice } from "../hooks/useBNBPrice";
import { formatNumber } from "../utils/dataProcessor";

const PriceIndicator: React.FC = () => {
  const { bnbPrice, loading, error, refreshPrice } = useBNBPrice();

  const handleRefresh = () => {
    refreshPrice();
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "4px",
        background: "rgba(255, 255, 255, 0.95)",
        padding: "6px 10px",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        fontSize: "12px",
        border: "1px solid rgba(0, 0, 0, 0.06)",
        whiteSpace: "nowrap",
        minWidth: "fit-content",
      }}
    >
      <Tooltip title="当前BNB价格（用于Gas费用转换）">
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: "3px",
            color: error ? "#ff4d4f" : "#1890ff",
            fontWeight: "500",
            minWidth: "fit-content",
          }}
        >
          <DollarOutlined style={{ fontSize: "11px" }} />
          BNB ${formatNumber(bnbPrice, 0)}
        </span>
      </Tooltip>

      <Tooltip title="刷新BNB价格">
        <Button
          type="text"
          size="small"
          icon={<ReloadOutlined />}
          loading={loading}
          onClick={handleRefresh}
          style={{
            padding: "0",
            height: "16px",
            width: "16px",
            fontSize: "10px",
            border: "none",
            color: "#999",
            minWidth: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        />
      </Tooltip>

      {error && (
        <Tooltip title={`价格获取失败: ${error}`}>
          <span
            style={{
              fontSize: "9px",
              color: "#ff4d4f",
              marginLeft: "2px",
            }}
          >
            ⚠
          </span>
        </Tooltip>
      )}
    </div>
  );
};

export default PriceIndicator;
