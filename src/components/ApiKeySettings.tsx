import React, { useState, useEffect } from "react";
import {
  Modal,
  Input,
  Button,
  Form,
  Alert,
  Typography,
  Space,
  Tooltip,
} from "antd";
import {
  SettingOutlined,
  KeyOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import {
  getApiKey,
  saveApiKey,
  clearApiKey,
  isUsingDefaultKey,
  validateApiKey,
} from "../utils/apiKeyManager";

const { Text, Link } = Typography;

interface ApiKeySettingsProps {
  visible: boolean;
  onClose: () => void;
}

const ApiKeySettings: React.FC<ApiKeySettingsProps> = ({
  visible,
  onClose,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [currentKey, setCurrentKey] = useState("");

  useEffect(() => {
    if (visible) {
      // 只显示用户自定义的key，不显示默认key
      try {
        const savedKey = localStorage.getItem("bn_alpha_api_key") || "";
        setCurrentKey(savedKey);
        form.setFieldsValue({ apiKey: savedKey });
      } catch (error) {
        console.error("获取保存的API Key失败:", error);
        setCurrentKey("");
        form.setFieldsValue({ apiKey: "" });
      }
    }
  }, [visible, form]);

  const handleSave = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      const apiKey = values.apiKey?.trim();

      if (apiKey) {
        saveApiKey(apiKey);
        setCurrentKey(apiKey);
      } else {
        clearApiKey();
        setCurrentKey(getApiKey()); // 获取默认key
      }

      onClose();
    } catch (error) {
      console.error("保存API Key失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    clearApiKey();
    setCurrentKey("");
    form.setFieldsValue({ apiKey: "" });
  };

  return (
    <Modal
      title={
        <Space>
          <KeyOutlined />
          Etherscan API Key 设置
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="reset" onClick={handleReset}>
          重置为默认
        </Button>,
        <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
        <Button
          key="save"
          type="primary"
          loading={loading}
          onClick={handleSave}
        >
          保存
        </Button>,
      ]}
      width={600}
    >
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Alert
          message={
            <span>
              请在{" "}
              <Link href="https://etherscan.io/apis" target="_blank">
                etherscan.io/apis
              </Link>{" "}
              申请 API Key，免费限制 5qps/s
            </span>
          }
          type="info"
          showIcon
        />

        {isUsingDefaultKey() && (
          <Alert
            message="当前使用默认 API Key，建议使用个人 API Key"
            type="warning"
            showIcon
          />
        )}

        <Form form={form} layout="vertical">
          <Form.Item
            label="API Key"
            name="apiKey"
            rules={[
              {
                validator: (_, value) => {
                  if (!value || value.trim() === "") {
                    return Promise.resolve(); // 允许空值（使用默认key）
                  }
                  if (validateApiKey(value)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("API Key 格式不正确"));
                },
              },
            ]}
          >
            <Input.Password placeholder="输入您的 Etherscan API Key（留空使用默认）" />
          </Form.Item>
        </Form>

        <div style={{ fontSize: "12px", color: "#666" }}>
          <Text type="secondary">
            当前状态:{" "}
            {isUsingDefaultKey()
              ? "使用默认 API Key，有概率失败"
              : "使用自定义 API Key"}
          </Text>
        </div>
      </Space>
    </Modal>
  );
};

export default ApiKeySettings;
