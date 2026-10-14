# デプロイ手順書 (Render & Vercel)

本リポジトリは **Render** および **Vercel** の両環境でそのままデプロイできるように設定済みです。

---

## 1. Vercel でのデプロイ手順

Vercelは静的フロントエンド配信と `/api/*` サーバーレスプロキシ（`api/index.ts`）を同時に処理します。

### 手順（Webコンソールから）
1. [Vercel](https://vercel.com/) にログインし、**「Add New...」→「Project」** を選択します。
2. 本リポジトリのGitHubリポジトリを選択して **「Import」** をクリックします。
3. 設定確認（自動検出されます）:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **「Deploy」** ボタンを押します。
5. `vercel.json` に設定されたルーティングにより、フロントエンドとJR西日本APIプロキシ（`/api/*`）が自動稼働します。

### 手順（Vercel CLIから）
```bash
npm i -g vercel
vercel
```

---

## 2. Render でのデプロイ手順

Renderは常駐型Webサービスとして、Expressサーバー（`server.ts`）によるインメモリキャッシュ付きAPIプロキシと静的ファイル配信を行います。

### 手順A: Blueprint (`render.yaml`) を使う場合（推奨）
1. [Render Dashboard](https://dashboard.render.com/) にログインし、**「New +」→「Blueprint」** を選択します。
2. 本リポジトリを選択すると、ルートにある `render.yaml` が自動検出され、ワンクリックでデプロイされます。

### 手順B: Web Service として手動設定する場合
1. Render Dashboardで **「New +」→「Web Service」** を選択します。
2. 以下の項目を設定します:
   - **Name**: `jrwest-train-tracker`（任意）
   - **Language / Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
3. 環境変数（Environment Variables）に以下を追加（自動設定も可）:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
4. **「Create Web Service」** をクリックしてデプロイします。
