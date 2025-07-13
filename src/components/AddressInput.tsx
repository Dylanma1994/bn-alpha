import React, { useState } from "react";
import { Card, Input, Button, Form, Alert, Space } from "antd";
import { SearchOutlined, WalletOutlined } from "@ant-design/icons";

interface AddressInputProps {
  onSearch: (address: string) => void;
  loading: boolean;
}

const AddressInput: React.FC<AddressInputProps> = ({ onSearch, loading }) => {
  const [form] = Form.useForm();
  const [address, setAddress] = useState("");

  const isValidAddress = (addr: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(addr);
  };

  const handleSubmit = () => {
    if (address.trim() && isValidAddress(address) && !loading) {
      onSearch(address.trim());
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value);
  };

  return (
    <Card
      title={
        <div style={{ display: "flex", alignItems: "center" }}>
          <WalletOutlined style={{ marginRight: "8px", color: "#1890ff" }} />
          BNB 链地址查询
        </div>
      }
      style={{ marginBottom: "24px" }}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="请输入钱包地址"
          validateStatus={address && !isValidAddress(address) ? "error" : ""}
          help={
            address && !isValidAddress(address)
              ? "请输入有效的钱包地址（以 0x 开头的 42 位十六进制字符）"
              : ""
          }
        >
          <Space.Compact style={{ width: "100%" }}>
            <Input
              style={{ width: "calc(100% - 120px)" }}
              placeholder="0x..."
              value={address}
              onChange={handleInputChange}
              disabled={loading}
              size="large"
              prefix={<WalletOutlined />}
              onPressEnter={handleSubmit}
            />
            <Button
              type="primary"
              size="large"
              loading={loading}
              disabled={!address || !isValidAddress(address)}
              onClick={handleSubmit}
              icon={<SearchOutlined />}
              style={{ width: "120px" }}
            >
              {loading ? "查询中" : "查询"}
            </Button>
          </Space.Compact>
        </Form.Item>

        {address && !isValidAddress(address) && (
          <Alert
            message="地址格式错误"
            description="钱包地址应以 0x 开头，包含 42 位十六进制字符"
            type="error"
            showIcon
            style={{ marginTop: "16px" }}
          />
        )}
      </Form>
    </Card>
  );
};

export default AddressInput;
