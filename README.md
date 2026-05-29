# 🤖 LINE Echo Bot (打什麼回覆什麼)

這是一個基於 **Node.js + Express** 與 **@line/bot-sdk (v9)** 實作的 LINE Echo Bot。它會接收使用者的文字訊息，並即時回覆一模一樣的文字。

---

## 🛠️ 開發準備與設定

在開始運行之前，請確保您已完成以下準備：

### 1. LINE Developers 設定
1. 登入 [LINE Developers Console](https://developers.line.biz/)。
2. 建立 **Provider**，並在下方建立一個 **Messaging API** 頻道。
3. 在 **Basic settings** 分頁中，找到 **Channel secret**。
4. 在 **Messaging API** 分頁中，拉到最下方，在 **Channel access token** 點擊 **Issue** 產生權杖。

### 2. 環境變數設定
將專案目錄下的 `.env` 檔案打開，填入您剛剛取得的 Token：

```env
PORT=3000
LINE_CHANNEL_SECRET=您的_Channel_Secret
LINE_CHANNEL_ACCESS_TOKEN=您的_Channel_Access_Token
```

---

## 🚀 啟動與部署步驟

### 1. 安裝相依套件
在專案根目錄下執行：
```bash
npm install
```

### 2. 啟動開發伺服器
```bash
npm run dev
```
伺服器將在 `http://localhost:3000` 啟動，且程式碼如有變更會自動重新載入（使用 Node.js 的 `--watch` 機制）。

### 3. 使用 ngrok 進行外部對接
因為 LINE 伺服器需要將 Webhook 訊息傳送到一個公開的 HTTPS 網址，我們在本地開發時可以使用 `ngrok`：

1. 下載並安裝 [ngrok](https://ngrok.com/)。
2. 執行以下指令，將本地的 `3000` 埠口暴露至外網：
   ```bash
   ngrok http 3000
   ```
3. 複製 ngrok 產生的 `https://xxxx-xxxx.ngrok-free.app` 網址。

### 4. 設定 LINE Webhook
1. 回到 **LINE Developers Console** 的 **Messaging API** 分頁。
2. 找到 **Webhook URL** 並點擊 **Edit**。
3. 輸入您的 ngrok 網址加上 `/webhook`。例如：
   ```
   https://xxxx-xxxx.ngrok-free.app/webhook
   ```
4. 點擊 **Update** 保存，然後點擊 **Verify** 測試連接。如果出現 **Success**，代表連接成功！
5. **重要**：請將 **Use webhook** 功能開啟 (切換為綠色啟用狀態)。

---

## 🧪 測試您的 Bot

1. 在 **Messaging API** 分頁最上方，使用手機掃描 **QR code** 加入您的 Bot 為好友。
2. 傳送任何文字訊息（例如：「哈囉，你好！」）。
3. Bot 應該會立刻回覆您一模一樣的訊息：「哈囉，你好！」。
