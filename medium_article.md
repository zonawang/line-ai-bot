# 🤖 20 分鐘無痛上線！手把手帶你建置 LINE Echo Bot 並部署至 GCP Cloud Run（含 GitHub 備份指南）

![LINE Bot x GCP Cloud Run Banner](https://images.unsplash.com/photo-1618401471353-b98aedd07871?auto=format&fit=crop&w=1200&q=80)

> **「想要動手做一個聊天機器人，但想到要租伺服器、弄 HTTPS 網址就頭大嗎？」**
>
> 大家好，我是 **Zona**！身為 DevRel（開發者關係），我最喜歡探索能讓開發者「用最少阻力、最快看到成果」的實作路徑。最近剛好想快速搭建一個 LINE Bot 來玩玩，於是幫自己設定了一個小挑戰：**做一個「打什麼就回什麼」的 LINE Echo Bot，並且直接把它部署到雲端，同時完成 GitHub 備份！**
>
> 原本以為在雲端部署和權限設定上會花不少時間，但沒想到利用 **Node.js + GCP Cloud Run**，整個過程出奇地流暢與優雅。
>
> 不論你是剛接觸 API 的技術新手，還是想尋求極速部署方案的工程師，這篇文章都會手把手帶你「無痛通關」，從零建置到 24 小時雲端不間斷運作，Let's Go！🚀

---

## 📌 為什麼選擇這個技術組合？

在動手之前，我們先來聊聊這次的「黃金架構」：
1. **Node.js + Express**：極簡、輕量，搭配官方的 `@line/bot-sdk`（目前最新的 V9 版本），幾行代碼就能寫完簽章驗證與訊息回覆邏輯。
2. **GCP Cloud Run**：Google 提供的全託管無伺服器（Serverless）容器運行環境。
   - **優勢**：有呼叫時才算錢（甚至有超大額度的免費額度！），並且**自動提供 LINE Webhook 絕對需要的 HTTPS 安全網址**，完全免去設定 SSL 憑證的痛苦！
3. **Git + GitHub**：現代開發標配，但在備份的同時，我們也會教你如何使用 `.gitignore` 做好**資安防護**。

---

## 🛠️ 第一步：準備好你的 LINE 開發者鑰匙

首先，我們需要到 **[LINE Developers Console](https://developers.line.biz/)** 申請機器人的「鑰匙」：

1. **建立 Provider & Messaging API Channel**：給你的機器人取個響亮的名字，並上傳一張可愛的頭貼。
2. **拿取兩大金鑰**：
   - **Channel Secret**（在 **Basic settings** 分頁）：這用來確認進來的 Webhook 請求真的來自 LINE 官方。
   - **Channel Access Token**（在 **Messaging API** 分頁最下方）：點擊 **Issue** 產生，這用來授權你的程式幫機器人發送訊息。

---

## 💻 第二步：極簡程式碼實作

程式碼的邏輯非常單純，我們使用官方 SDK 提供的 `line.middleware` 來幫我們自動處理**簽章驗證**，當收到文字訊息時，就原封不動地 reply 回去。

### 1. package.json 設定
```json
{
  "name": "line-echo-bot",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "node --watch index.js"
  },
  "dependencies": {
    "@line/bot-sdk": "^9.5.1",
    "dotenv": "^16.4.5",
    "express": "^4.19.2"
  }
}
```

### 2. index.js 核心邏輯
```javascript
const express = require('express');
const line = require('@line/bot-sdk');
require('dotenv').config();

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: config.channelAccessToken
});

const app = express();

// LINE Webhook 路由
app.post('/webhook', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// 處理文字 Echo 邏輯
async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return null;
  }

  return client.replyMessage({
    replyToken: event.replyToken,
    messages: [{ type: 'text', text: event.message.text }]
  });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 LINE Echo Bot 正在埠口 ${PORT} 運作中...`);
});
```

---

## 🐳 第三步：打包容器 (Dockerfile)

為了讓 Cloud Run 讀懂我們的 Node.js 程式，我們需要撰寫一個簡單的 `Dockerfile`：

```dockerfile
FROM node:18-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install --only=production
COPY . .
EXPOSE 8080
CMD [ "node", "index.js" ]
```

同時，別忘了建立一個 **`.dockerignore`** 檔案，把 `node_modules` 和 `.env` 排除在外，避免把本地的暫存檔帶進雲端喔！

---

## ☁️ 第四步：部署至 GCP Cloud Run (踩坑與解法！)

這是我覺得最好玩、也收穫最多的一步！我們使用 Google Cloud CLI 來進行雲端建置與部署。

### 1. 初始化與登入
在終端機輸入：
```bash
gcloud auth login
gcloud config set project line-zona
```

### 2. 執行一鍵部署
```bash
gcloud run deploy line-echo-bot \
  --source . \
  --region asia-east1 \
  --allow-unauthenticated \
  --set-env-vars="LINE_CHANNEL_SECRET=你的Secret,LINE_CHANNEL_ACCESS_TOKEN=你的Token"
```

### 💡 踩坑筆記：PERMISSION_DENIED 怎麼辦？
在全新的 GCP 專案中部署時，我遇到了 `PERMISSION_DENIED: The caller does not have permission` 的權限紅字。

**🔍 關鍵原因**：Cloud Run 在背後會使用 Cloud Build 進行雲端容器編譯，但新專案的**服務帳戶（Service Account）**預設缺少了權限。
**🛠️ 快速解法**：在 GCP IAM 控制台或透過指令，為您的帳號與 Cloud Build 服務帳戶補上以下兩個權限：
1. **Service Account User** (`roles/iam.serviceAccountUser`)
2. **Cloud Run Admin** (`roles/run.admin`)

權限補齊後，重新執行部署，只花了 60 秒就順利噴出綠色勾勾，並拿到了寶貴的 **Service URL**！

```
Service URL: https://line-echo-bot-3sv3zqjszq-de.a.run.app
```

---

## 🔗 第五步：Webhook 綁定，完美運作！

把剛剛拿到的 Service URL 加上 `/webhook`，例如：
`https://line-echo-bot-3sv3zqjszq-de.a.run.app/webhook`

貼回 LINE Developers Console 中的 **Webhook URL** 欄位，點擊 **Verify** —— 綠色的 **Success** 瞬間亮起！這代表你的機器人已經成功在雲端與 LINE 連線了！

---

## 🐙 加碼：安全地將程式備份至 GitHub

程式寫得漂亮，版控當然也要做得安全。

### 1. 建立 .gitignore 保護隱私
為了避免把包含 Token 金鑰的 `.env` 檔案誤推上 GitHub，我們建立了 `.gitignore`：
```gitignore
node_modules/
.env
*.log
```

### 2. 連結 GitHub 並推送
在本地初始化 Git 並完成 Commit 後，我們可以用 GitHub 產生的 **Personal Access Token (PAT)** 進行安全的背景推送：

```bash
git remote add origin https://github.com/zonawang/line-echo-bot.git
git branch -M main
git push -u origin main
```
*（安全小提醒：推送成功後，記得把本地 Git remote URL 還原成乾淨的 HTTPS 網址，並把臨時生成的 Token 刪除，資安防護滿分！）*

---

## ✨ 結語：DevRel 的技術分享思維

> **「快速動手、踩坑記錄、樂於分享。」**
>
> 這次的實作只花了 20 分鐘，卻是一次非常棒的 Serverless 開發體驗。遇到 `PERMISSION_DENIED` 權限問題時，耐心地去梳理 GCP 的 IAM 機制，並將其記錄下來，這就是技術寫作最迷人的地方。
>
> 如果這篇文章有幫助到想建立 LINE Bot 或學習 Cloud Run 的你，歡迎點擊拍手 👏 並分享出去！你有遇到什麼部署上的瓶頸嗎？歡迎在下方留言跟我交流喔！我們下次見！👋
