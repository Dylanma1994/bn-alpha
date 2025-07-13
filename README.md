# 🚀 BN Alpha - 币安链交易分析工具

一个专业的 BNB 链交易数据分析工具，帮助用户分析钱包地址的交易记录，计算 BN Alpha 分数，并提供详细的损耗分析。

## ✨ 功能特性

### 📊 核心功能
- **单地址查询**：分析单个钱包地址的交易数据
- **批量查询**：支持同时查询多个地址（无数量限制）
- **BN Alpha 分数**：基于日买入量的 2^n 评分系统
- **损耗分析**：精确计算滑点损耗和 Gas 费用
- **实时价格**：通过 Binance API 获取 BNB 实时价格

### 🎯 数据分析
- **交易统计**：交易数量、交易量、唯一代币数
- **损耗计算**：净损耗 = 买入花费 - 卖出收入
- **Gas 费用**：基于实时 BNB 价格转换为 USDT
- **级联展示**：地址汇总 + 详细交易记录

### 💾 用户体验
- **状态保存**：查询状态永久保存到本地
- **自动恢复**：页面刷新后自动恢复上次查询内容
- **自定义 API Key**：支持使用个人 Etherscan API Key
- **响应式设计**：适配各种屏幕尺寸

## 🛠️ 技术栈

- **前端框架**：React 18 + TypeScript
- **UI 组件库**：Ant Design
- **构建工具**：Vite
- **数据源**：Etherscan v2 API
- **价格数据**：Binance API

## 📦 安装部署

### 环境要求
- Node.js 16+ 
- npm 或 yarn

### 本地开发

1. **克隆项目**
```bash
git clone <repository-url>
cd bn-alpha
```

2. **安装依赖**
```bash
npm install
# 或
yarn install
```

3. **启动开发服务器**
```bash
npm run dev
# 或
yarn dev
```

4. **访问应用**
打开浏览器访问 `http://localhost:5174`

### 生产部署

#### 方式一：静态部署（推荐）

1. **构建项目**
```bash
npm run build
```

2. **部署到静态托管服务**
将 `dist` 目录部署到以下任一平台：
- **Vercel**：`vercel --prod`
- **Netlify**：拖拽 `dist` 目录到 Netlify
- **GitHub Pages**：推送到 `gh-pages` 分支
- **Cloudflare Pages**：连接 GitHub 仓库自动部署

#### 方式二：Docker 部署

1. **创建 Dockerfile**
```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

2. **构建和运行**
```bash
docker build -t bn-alpha .
docker run -p 80:80 bn-alpha
```

#### 方式三：服务器部署

1. **构建项目**
```bash
npm run build
```

2. **配置 Nginx**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/bn-alpha/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## ⚙️ 配置说明

### API Key 设置

1. **获取 Etherscan API Key**
   - 访问 [https://etherscan.io/apis](https://etherscan.io/apis)
   - 注册账户并申请免费 API Key
   - 免费版限制：5 请求/秒

2. **配置 API Key**
   - 点击应用中的 "API Key" 按钮
   - 输入您的 API Key
   - 留空将使用默认 API Key（共享限制）

### 环境变量（可选）
创建 `.env` 文件：
```env
# Etherscan API Key（可选，也可在应用中设置）
VITE_ETHERSCAN_API_KEY=your_api_key_here
```

## 📖 使用指南

### 单地址查询
1. 选择"单个"模式
2. 输入钱包地址（0x开头的42位十六进制）
3. 点击"查询"按钮

### 批量查询
1. 选择"批量"模式  
2. 每行输入一个地址
3. 点击"批量查询"按钮

### 数据解读

#### BN Alpha 分数
- 基于日买入量计算：2^n 分数
- n = 买入金额对应的分数点
- 分数越高表示交易活跃度越高

#### 损耗分析
- **净损耗**：买入花费 - 卖出收入
- **Gas 费用**：基于实时 BNB 价格计算
- **总损耗**：净损耗 + Gas 费用

## 🔧 开发指南

### 项目结构
```
src/
├── components/          # React 组件
├── services/           # API 服务
├── utils/              # 工具函数
├── hooks/              # 自定义 Hooks
├── types.ts            # TypeScript 类型定义
└── App.tsx             # 主应用组件
```

### 主要组件
- `AddressInput`：地址输入组件
- `SummaryCard`：数据汇总卡片
- `DexTransactionTable`：交易记录表格
- `BatchResultTable`：批量查询结果表格
- `PriceIndicator`：价格指示器
- `ApiKeySettings`：API Key 设置

### 核心服务
- `api.ts`：Etherscan API 调用
- `binancePriceService.ts`：Binance 价格服务
- `dataProcessor.ts`：数据处理逻辑

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支：`git checkout -b feature/new-feature`
3. 提交更改：`git commit -am 'Add new feature'`
4. 推送分支：`git push origin feature/new-feature`
5. 提交 Pull Request

## 📄 许可证

MIT License

## 🆘 常见问题

**Q: API 调用失败怎么办？**
A: 检查 API Key 是否正确，确保网络连接正常，免费 API Key 有频率限制。

**Q: 为什么查询结果为空？**
A: 可能该地址在今日没有交易记录，或地址格式不正确。

**Q: 如何提高查询速度？**
A: 使用个人 Etherscan API Key，避免共享限制。

**Q: 数据不准确怎么办？**
A: 数据来源于 Etherscan，如有疑问请对比官方数据。

## 📞 联系方式

如有问题或建议，请提交 Issue 或联系开发者。
