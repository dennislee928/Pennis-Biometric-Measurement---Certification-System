# Biometric Measurement & Certification System

基於 Next.js 前端 + Go 後端 + Supabase：瀏覽器端測量、Persona 身分驗證、**後端持密鑰簽發證書**、證書驗證與「我的證書」查詢。**影像不離開裝置**，僅傳輸測量結果與驗證標識。

## 技術棧

- **Next.js 14+** (App Router)、**Supabase Auth**（登入／證書綁定）
- **Go (Gin + GORM)** 後端、**Supabase PostgreSQL**（inquiries、certificates、audit_logs）
- **TensorFlow.js**、**Persona**（Embedded Inquiry + Webhook）、**canvas-confetti**、**lucide-react**

## 環境需求

- Node.js 18+、Go 1.21+
- Supabase 專案（Auth + PostgreSQL）
- 支援 `getUserMedia` 的瀏覽器（建議 HTTPS 或 localhost）

## 快速開始

### 1. 資料庫（Supabase）

在 Supabase SQL Editor 執行：

```bash
# 見 database/migrations/001_create_inquiries_certificates_audit.sql
```

或直接執行 `database/migrations/001_create_inquiries_certificates_audit.sql` 內容。

### 2. 後端（Go）

```bash
cd backend
cp .env.example .env
# 編輯 .env：DATABASE_URL、CERT_HMAC_SECRET、PERSONA_WEBHOOK_SECRET、SUPABASE_JWT_SECRET
go run .
```

預設聽取 `:8080`。

### 3. 前端（Next.js）

```bash
npm install
cp .env.example .env.local
# 編輯 .env.local：NEXT_PUBLIC_API_URL、NEXT_PUBLIC_SUPABASE_*、NEXT_PUBLIC_PERSONA_*
npm run dev
```

開啟 [http://localhost:3000](http://localhost:3000)。

## 環境變數

### 前端 (.env.local)

| 變數 | 說明 |
|------|------|
| `NEXT_PUBLIC_PERSONA_TEMPLATE_ID` | Persona Inquiry Template ID |
| `NEXT_PUBLIC_PERSONA_ENV` | `sandbox` 或 `production` |
| `NEXT_PUBLIC_API_URL` | 後端 API 網址（例 `http://localhost:8080`） |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 專案 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `NEXT_PUBLIC_MEASUREMENT_RECOGNITION_MODEL_URL` | 測量區 ML 辨識模型 URL（TF.js GraphModel），不設定則跳過辨識 |

### 後端 (backend/.env)

| 變數 | 說明 |
|------|------|
| `DATABASE_URL` | Supabase PostgreSQL 連線字串 |
| `CERT_HMAC_SECRET` | 證書 HMAC 密鑰（僅後端） |
| `PERSONA_WEBHOOK_SECRET` | Persona Webhook 簽名驗證 |
| `SUPABASE_JWT_SECRET` | 驗證前端 JWT（Supabase Dashboard → API → JWT Secret） |
| `CORS_ORIGIN` | 前端 origin（例 `http://localhost:3000`） |

## 流程概覽

1. **登入**：Supabase Auth（/login：密碼或魔法連結）。
2. **相機擷取**：對齊參考卡片於綠色框，通過亮度/模糊檢測後擷取。
3. **測量結果**：PPM 轉換為公分，標記即時擷取（Liveness）。
4. **身分驗證**：Persona Embedded Inquiry → Persona 以 **Webhook** 通知後端 `inquiry.completed`，後端寫入 `inquiries`。
5. **數位證書**：前端送 `inquiryId` + `measurement` 至 **POST /api/certificates**（帶 JWT），後端驗證 inquiry 已通過、簽名並寫入 `certificates`，回傳證書 JSON 供下載。
6. **我的證書**：/certificates 呼叫 **GET /api/certificates**，多裝置同步。
7. **驗證證書**：/verify 貼上證書 JSON，**POST /api/certificates/verify** 回傳有效/無效。

## 專案結構

```
app/
  page.tsx           # 首頁流程（測量 → Persona → 證書）
  login/page.tsx     # 登入
  certificates/page.tsx  # 我的證書
  verify/page.tsx    # 驗證證書
components/
  CameraCapture.tsx, PersonaInquiry.tsx
lib/
  supabase.ts, useAuth.ts, api.ts, tfBackend.ts, measurementEngine.ts, certificationProvider.ts
backend/             # Go API
  main.go
  internal/config, db, model, middleware, handler
database/migrations/
  001_create_inquiries_certificates_audit.sql
```

## Persona Webhook

在 Persona Dashboard 設定 Webhook URL：`https://<你的後端>/webhooks/persona`，訂閱 `inquiry.completed`，並將 Webhook secret 設為後端 `PERSONA_WEBHOOK_SECRET`。

## 測量區 ML 辨識模型（可選）

若設定 `NEXT_PUBLIC_MEASUREMENT_RECOGNITION_MODEL_URL`，前端會以 TensorFlow.js 載入 **GraphModel**（JSON + 權重 shard）對測量區 ROI 做推論。

- **格式**：TF.js GraphModel（可由 Keras/PyTorch 轉換）。
- **輸入**：224×224 RGB，數值正規化至 [0, 1]。
- **輸出假設**：二元分類，`result[1]` 為「已辨識」類別機率；門檻 0.8 判定通過。若實際模型為單一 sigmoid，需在程式內改為取 `result[0]`。
- **量化**：若使用 uint8 量化模型，轉換與前處理需與上述輸入規範一致。

未設定時不載入模型，辨識步驟一律通過。

## 隱私與合規

- **端點脫敏**：預覽可啟用 `enableBlur`（CSS blur）。
- **零存儲**：影像不寫入 localStorage/IndexedDB；證書與稽核僅存於後端 DB，不存生物特徵。

## 建置與部署

```bash
# 前端
npm run build && npm start

# 後端
cd backend && go build -o cert-backend . && ./cert-backend
```
