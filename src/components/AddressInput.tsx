import React, { useState, useEffect } from "react";
import { Card, Input, Button, Form, Alert, message, Switch, Space } from "antd";
import { SearchOutlined, WalletOutlined } from "@ant-design/icons";
import { addAddressToCache } from "../utils/addressCache";
import { getLastQueryState } from "../utils/queryStateManager";

interface AddressInputProps {
  onSearch: (address: string) => void;
  onBatchSearch?: (addresses: string[]) => void;
  loading: boolean;
}

const AddressInput: React.FC<AddressInputProps> = ({
  onSearch,
  onBatchSearch,
  loading,
}) => {
  const [form] = Form.useForm();
  const [address, setAddress] = useState("");
  const [addresses, setAddresses] = useState(""); // 多行地址输入

  const [isBatchMode, setIsBatchMode] = useState(false);

  // 恢复上次查询状态
  useEffect(() => {
    const lastState = getLastQueryState();
    if (lastState && lastState.addresses.length > 0) {
      if (lastState.type === "single") {
        // 单地址模式
        setAddress(lastState.addresses[0]);
        setIsBatchMode(false);
      } else {
        // 批量模式
        setAddresses(lastState.addresses.join("\n"));
        setIsBatchMode(true);
      }
      console.log(
        `已恢复上次查询状态: ${lastState.type} - ${lastState.addresses.length} 个地址`
      );
    }
  }, []);

  const isValidAddress = (addr: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(addr);
  };

  // 解析多行地址输入
  const parseAddresses = (input: string): string[] => {
    return input
      .split("\n")
      .map((addr) => addr.trim())
      .filter((addr) => addr.length > 0);
  };

  // 验证多个地址
  const validateAddresses = (
    addrs: string[]
  ): { valid: string[]; invalid: string[] } => {
    const valid: string[] = [];
    const invalid: string[] = [];

    addrs.forEach((addr) => {
      if (isValidAddress(addr)) {
        valid.push(addr);
      } else {
        invalid.push(addr);
      }
    });

    return { valid, invalid };
  };

  const handleSubmit = () => {
    if (isBatchMode) {
      // 批量模式
      const parsedAddresses = parseAddresses(addresses);
      const { valid, invalid } = validateAddresses(parsedAddresses);

      if (invalid.length > 0) {
        message.error(`发现 ${invalid.length} 个无效地址，请检查格式`);
        return;
      }

      if (valid.length === 0) {
        message.warning("请输入至少一个有效地址");
        return;
      }

      // 添加所有有效地址到缓存
      valid.forEach((addr) => addAddressToCache(addr));

      // 执行批量搜索
      if (onBatchSearch) {
        onBatchSearch(valid);
      }
    } else {
      // 单地址模式
      if (address.trim() && isValidAddress(address) && !loading) {
        // 添加地址到缓存
        addAddressToCache(address.trim());
        // 执行搜索
        onSearch(address.trim());
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value);
  };

  const handleAddressesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAddresses(e.target.value);
  };

  return (
    <Card style={{ marginBottom: "24px" }}>
      <Form form={form} layout="vertical">
        {/* 模式切换 */}
        <Form.Item>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <span style={{ marginRight: "8px" }}>查询模式：</span>
            <Switch
              checked={isBatchMode}
              onChange={setIsBatchMode}
              checkedChildren="批量"
              unCheckedChildren="单个"
            />
            <span
              style={{ marginLeft: "8px", color: "#666", fontSize: "12px" }}
            >
              {isBatchMode ? "支持多个地址，换行分隔" : "单个地址查询"}
            </span>
          </div>
        </Form.Item>

        {!isBatchMode ? (
          // 单地址模式
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
        ) : (
          // 批量模式
          <Form.Item label="请输入多个钱包地址">
            <Input.TextArea
              rows={6}
              placeholder={`0x1234567890123456789012345678901234567890\n0xabcdefabcdefabcdefabcdefabcdefabcdefabcd\n...`}
              value={addresses}
              onChange={handleAddressesChange}
              disabled={loading}
              style={{ marginBottom: "8px" }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Button
                type="primary"
                size="large"
                loading={loading}
                disabled={!addresses.trim()}
                onClick={handleSubmit}
                icon={<SearchOutlined />}
                style={{ width: "120px" }}
              >
                {loading ? "查询中" : "批量查询"}
              </Button>
              <span style={{ fontSize: "12px", color: "#666" }}>
                每行输入一个地址
              </span>
            </div>
          </Form.Item>
        )}

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
