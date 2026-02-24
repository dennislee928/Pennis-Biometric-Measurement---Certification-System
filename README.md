# Biometric Measurement & Certification System

基於 Next.js 的純前端應用：瀏覽器端 AI 輔助測量 + 第三方身分驗證（Persona），取得數位認證證書。**影像不離開裝置**（On-device Processing），僅傳輸測量結果與驗證標識。

## 技術棧

- **Next.js 14+** (App Router)
- **TensorFlow.js**（WASM/CPU 後端）
- **Persona**（Embedded Inquiry 身分驗證）
- **canvas-confetti**、**lucide-react**

## 環境需求

- Node.js 18+
- 支援 `getUserMedia` 的瀏覽器（建議 HTTPS 或 localhost）

## 快速開始

```bash
# 安裝依賴
npm install

# 複製環境變數（可選，用於 Persona 與證書簽名）
cp .env.example .env.local

# 開發
npm run dev
```

開啟 [http://localhost:3000](http://localhost:3000)。

## 環境變數

| 變數 | 說明 |
|------|------|
| `NEXT_PUBLIC_PERSONA_TEMPLATE_ID` | Persona Inquiry Template ID（Dashboard 建立後取得） |
| `NEXT_PUBLIC_PERSONA_ENV` | `sandbox` 或 `production` |
| `NEXT_PUBLIC_CERT_SECRET_KEY` | 證書 HMAC 簽名用密鑰（正式環境應由後端簽名） |

未設定時，Persona 使用 placeholder template ID，證書使用預設 demo 密鑰。

## 隱私與合規

- **端點脫敏**：預覽畫面可啟用 `enableBlur`，對敏感區域套用 CSS `blur`。
- **零存儲**：影像與影格不寫入 `localStorage`、`IndexedDB` 或任何持久化儲存；僅在記憶體中處理，unmount 時相機 stream 與 canvas 會清除。

## 專案結構

```
app/
  layout.tsx, page.tsx, globals.css   # 首頁與流程
components/
  CameraCapture.tsx                   # 相機引導、光線/模糊檢測、擷取
  PersonaInquiry.tsx                 # Persona 身分驗證 hook
lib/
  tfBackend.ts                        # TensorFlow.js 後端初始化（WASM/CPU）
  measurementEngine.ts                # PPM 標定、透視變換、物理單位轉換
  certificationProvider.ts            # 證書生成與 HMAC-SHA256 簽名
```

## 流程概覽

1. **相機擷取**：對齊參考卡片（如信用卡）於綠色框，通過亮度/模糊檢測後擷取。
2. **測量結果**：依參考物寬度計算 PPM，轉換為公分；標記為即時擷取（Liveness）。
3. **身分驗證**：透過 Persona Embedded Inquiry 完成證件與人臉掃描，取得 `inquiry_id`。
4. **數位證書**：以 `inquiry_id` + 測量結果 + timestamp 簽名，產生可下載的 JSON 證書。

## 建置與部署

```bash
npm run build
npm start
```

## 計畫對照

實作對應 `.cursor/plans/cursor.plan.md`：

- [x] 階段一：環境初始化、相機模組、光線/模糊檢測
- [x] 階段二：TF.js 後端、measurementEngine（PPM、透視變換、物理單位）
- [x] 階段三：Persona 串接、certificationProvider 加簽、Liveness 標記
- [x] 階段四：Client-side Blur、零存儲架構

語義分割模型（區分背景/參考物/目標）可後續接上 `@mediapipe/tasks-vision` 或自訂模型以提升測量精度。
