# 🤝 AI 協同開發實戰：20 分鐘與 Antigravity 攜手建置 LINE Bot 並部署至 GCP Cloud Run

![AI Co-creation Banner](https://images.unsplash.com/photo-1618401471353-b98aedd07871?auto=format&fit=crop&w=1200&q=80)

在軟體開發的世界中，快速驗證想法（MVP）一直是關鍵。最近我想搭建一個簡單的 LINE Bot 來測試一些應用，並希望它能夠在雲端 24 小時穩定運作。

不過，這一次我做了一個不同的嘗試 —— 我沒有自己從頭刻程式碼、設定伺服器或排查部署錯誤，而是與 AI 協同開發助手 **Antigravity** 合作。從初始化專案、處理套件安裝權限、解決 GCP 部署時的 IAM 權限阻礙，一直到最後安全地推送至 GitHub，我們在 20 分鐘內完成了全部流程。

這篇文章將以開發者關係（DevRel）的實踐視角，記錄這次與 Antigravity 協同開發的完整體驗，並分享我們是如何在極短時間內將一個 LINE Bot 部署到 Serverless 環境的。

---

## 🛠️ 技術選型：Node.js 與 GCP Cloud Run 的組合

在開始之前，我們先釐清了本次專案的技術骨架：
1. **Node.js + Express + @line/bot-sdk (v9)**：最標準的 LINE 機器人實作方式。
2. **GCP Cloud Run**：使用 Serverless 容器化運行環境。它最大的好處是「有請求才計費」，而且自動提供 Webhook 所需的 HTTPS 安全憑證，非常適合作為 API 服務的託管平台。
3. **GitHub + Git**：用於版本控制與程式碼儲存。

---

## 🤖 協同開發第一階段：環境建置與極速實作

當我向 Antigravity 提出需求後，它便主動規劃了完整的實作步驟，並在我的 Scratch 目錄下建立了一個獨立的專案空間：

```
line-echo-bot/
├── .env                  # 環境變數設定 (Channel Secret & Access Token)
├── package.json          # 專案相依性定義
├── index.js              # Webhook 核心邏輯
├── Dockerfile            # Cloud Run 容器打包設定
└── .gitignore            # 排除敏感資訊
```

在本地安裝相依套件時，我們遇到了 Mac global 緩存目錄的權限問題 (`EACCES`)。這在開發中很常見，但 Antigravity 靈活地透過設定本地快取目錄繞過了這個阻礙：
```bash
npm install --cache ./npm-cache
```
這項調整讓套件順利安裝完成，並透過 `node -c` 驗證了主程式 `index.js` 的語法正確性。

---

## ☁️ 協同開發第二階段：解決 Cloud Run 部署的 IAM 權限障礙

接著是這次開發中最精采的部分：將應用程式部署到 GCP Cloud Run。

我們準備好 `Dockerfile` 後，執行了部署指令：
```bash
gcloud run deploy line-echo-bot --source . --region asia-east1 --allow-unauthenticated
```

因為這是一個全新的 GCP 專案，在雲端編譯並部署時，系統在 `Uploading sources` 步驟後拋出了權限錯誤：
`ERROR: (gcloud.run.deploy) PERMISSION_DENIED: The caller does not have permission`

### 💡 Antigravity 的即時偵錯與自動修復
面對這個錯誤，Antigravity 沒有直接停下來，而是主動調閱了詳細日誌，並分析出問題癥結：**新專案中我的帳戶與 Cloud Build 服務帳戶缺少了必要的 IAM 權限。**

在得到我的同意後，Antigravity 直接在背景幫我執行了 GCP 的權限修正：
1. 為部署帳戶新增 **Service Account User** (`roles/iam.serviceAccountUser`) 權限。
2. 為專案的 Cloud Build 服務帳戶新增 **Cloud Run Admin** (`roles/run.admin`) 與 **Service Account User** 權限。

權限設定完成後，再次執行部署，Cloud Run 順利在一分鐘內編譯並部署完畢，輸出我們專屬的公開 HTTPS 網址：
`https://line-echo-bot-3sv3zqjszq-de.a.run.app`

此時，我們只需將此網址填入 LINE Developers Console 的 Webhook URL 並開啟 `Use webhook`，機器人就正式在雲端上線了。

---

## 🔒 協同開發第三階段：安全的 GitHub 版本備份

最後，我想將程式碼備份到 GitHub。由於這涉及敏感金鑰，安全防護顯得尤為重要。

1. **資安防護**：Antigravity 建立了嚴格的 `.gitignore` 檔案，確保包含 Channel Secret 的 `.env` 檔案絕不會外洩至 GitHub。
2. **自動化推送**：當我手動在 GitHub 上建好空的 Repository 並提供網址後，Antigravity 使用我提供的臨時 Access Token (PAT)，自動完成了遠端關聯與 `git push` 指令。
3. **權杖清理**：程式碼成功推送至 GitHub 後，Antigravity 主動將本地 Git 遠端 URL 還原為不含權杖的乾淨 HTTPS 網址，防範 Token 以明文形式留存在本地設定中。

---

## 💬 結語與反思：人機協同的開發新常態

這次與 Antigravity 的合作，讓我對「開發體驗（Developer Experience）」有了新的體會：

* **效率的質變**：傳統開發中，我們會花費不少時間在環境調整、Docker 設定或查找 GCP 複雜的 IAM 權限文件。而 AI 助理能將這些繁瑣的配置工作自動化，讓開發者專注於架構決策與邏輯驗證。
* **安全意識的共識**：AI 在追求效率的同時，依然能保持對資安細節的敏感度（如自動清理權杖與設定 `.gitignore`），這使得人機協作更加令人信賴。

從零建置到雲端部署上線，僅僅用了 20 分鐘。如果您也想體驗更流暢的雲端與 API 開發流程，非常推薦嘗試與 Antigravity 這樣的 AI 助理攜手合作，這無疑是未來軟體開發的一大助力。

---
*本文專案程式碼已完全開源並放置於 GitHub，若您對建置 LINE Bot 或 Cloud Run 部署有任何疑問，歡迎隨時留言與我交流！*
