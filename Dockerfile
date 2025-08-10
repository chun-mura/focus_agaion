FROM node:20-alpine

WORKDIR /app

# パッケージファイルをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm ci

# ソースコードをコピー
COPY . .

# ビルド
RUN npm run build

# 開発用のコマンド
CMD ["npm", "run", "watch"]
