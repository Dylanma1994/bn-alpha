import { useState, useEffect } from "react";
import { 
  Modal, 
  Input, 
  Button, 
  Form, 
  Alert, 
  Typography, 
  Space, 
  Tag,
  Select,
  Divider
} from "antd";
import { 
  FireOutlined,
  PlusOutlined,
  CloseOutlined
} from "@ant-design/icons";
import { 
  getAlphaTokens, 
  saveAlphaTokens, 
  resetAlphaTokens 
} from "../utils/alphaTokens";

const { Text, Title } = Typography;
const { Option } = Select;

interface AlphaTokenSettingsProps {
  visible: boolean;
  onClose: () => void;
}

const AlphaTokenSettings: React.FC<AlphaTokenSettingsProps> = ({ visible, onClose }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [alphaTokens, setAlphaTokens] = useState<string[]>([]);
  const [newToken, setNewToken] = useState<string>("");

  // 加载Alpha代币列表
  useEffect(() => {
    if (visible) {
      const tokens = getAlphaTokens();
      setAlphaTokens(tokens);
    }
  }, [visible]);

  // 保存Alpha代币列表
  const handleSave = async () => {
    try {
      setLoading(true);
      saveAlphaTokens(alphaTokens);
      onClose();
    } catch (error) {
      console.error("保存Alpha代币列表失败:", error);
    } finally {
      setLoading(false);
    }
  };

  // 重置为默认值
  const handleReset = () => {
    resetAlphaTokens();
    const defaultTokens = getAlphaTokens();
    setAlphaTokens(defaultTokens);
  };

  // 添加新代币
  const handleAddToken = () => {
    if (newToken && !alphaTokens.includes(newToken.toUpperCase())) {
      setAlphaTokens([...alphaTokens, newToken.toUpperCase()]);
      setNewToken("");
    }
  };

  // 移除代币
  const handleRemoveToken = (token: string) => {
    setAlphaTokens(alphaTokens.filter(t => t !== token));
  };

  return (
    <Modal
      title={
        <Space>
          <FireOutlined style={{ color: "#722ed1" }} />
          Alpha代币设置
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
        <Button key="save" type="primary" loading={loading} onClick={handleSave}>
          保存
        </Button>,
      ]}
      width={600}
    >
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <Alert
          message="Alpha代币说明"
          description="Alpha代币交易在计算BN Alpha分数时金额将×2，并在交易明细中显示标识"
          type="info"
          showIcon
        />

        <div>
          <Title level={5}>当前Alpha代币列表</Title>
          <div style={{ marginBottom: "16px" }}>
            <Space size={[8, 8]} wrap>
              {alphaTokens.map(token => (
                <Tag 
                  key={token} 
                  color="purple"
                  closable
                  onClose={() => handleRemoveToken(token)}
                >
                  {token}
                </Tag>
              ))}
              {alphaTokens.length === 0 && (
                <Text type="secondary">暂无Alpha代币</Text>
              )}
            </Space>
          </div>
        </div>

        <Divider style={{ margin: "12px 0" }} />

        <div>
          <Title level={5}>添加新Alpha代币</Title>
          <Space.Compact style={{ width: '100%' }}>
            <Input
              placeholder="输入代币符号，如 BTC"
              value={newToken}
              onChange={e => setNewToken(e.target.value.trim().toUpperCase())}
              onPressEnter={handleAddToken}
              style={{ textTransform: 'uppercase' }}
            />
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={handleAddToken}
              disabled={!newToken || alphaTokens.includes(newToken.toUpperCase())}
            >
              添加
            </Button>
          </Space.Compact>
        </div>
      </Space>
    </Modal>
  );
};

export default AlphaTokenSettings;
