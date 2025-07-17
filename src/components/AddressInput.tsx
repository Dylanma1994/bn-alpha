import React, { useState, useEffect } from "react";
import { Card, Input, Button, Form, message } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { addAddressToCache } from "../utils/addressCache";
import { getLastQueryState } from "../utils/queryStateManager";

interface AddressInputProps {
  onBatchSearch: (addresses: string[]) => void;
  loading: boolean;
}

const AddressInput: React.FC<AddressInputProps> = ({
  onBatchSearch,
  loading,
}) => {
  const [form] = Form.useForm();
  const [addresses, setAddresses] = useState(""); // 多行地址输入

  // 恢复上次查询状态
  useEffect(() => {
    const lastState = getLastQueryState();
    if (lastState && lastState.addresses.length > 0) {
      // 只恢复批量模式
      setAddresses(lastState.addresses.join("\n"));
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
    onBatchSearch(valid);
  };

  const handleAddressesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAddresses(e.target.value);
  };

  return (
    <Card style={{ marginBottom: "24px" }}>
      <Form form={form} layout="vertical">
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
      </Form>
    </Card>
  );
};

export default AddressInput;
