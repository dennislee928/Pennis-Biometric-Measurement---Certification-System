這是一份為 **Cursor** 或其他 AI 編輯器準備的 `cursor.plan.md` 開發計畫書。這份文件針對「純前端 Next.js 實作」與「身分認證串聯」進行了模組化拆解。

---

# Project Plan: AI-Powered Male Biometric Measurement & Certification System

## 1. 專案概述 (Project Overview)

建構一個基於 Next.js 的純前端應用，利用瀏覽器端 AI 進行男性生殖器尺寸測量，並結合第三方身份驗證（如 Persona）進行「真人屬性認證」。

* **核心技術：** Next.js 14+ (App Router), TensorFlow.js / MediaPipe, Persona SDK.
* **隱私原則：** 影像不離開用戶設備（On-device Processing），僅傳輸測量結果。

---

## 2. 階段一：環境初始化與相機模組 (Environment & Camera Setup)

* [x] **初始化專案**
* 使用 `npx create-next-app@latest` 建立專案。
* 安裝必要依賴：`@tensorflow/tfjs`, `lucide-react`, `canvas-confetti` (用於成功認證動畫)。（`@mediapipe/selfie_segmentation` 可選，後續接語義分割時再加）


* [x] **開發相機引導組件 (`CameraCapture.tsx`)**
* 實作 `getUserMedia` API 調用。
* 建立 UI 遮罩（Overlay），引導用戶將「參考物」（如信用卡）與目標物放置在正確位置。
* 實作「環境光線檢測」與「模糊檢測」邏輯。



---

## 3. 階段二：瀏覽器端 AI 運算 (On-device AI Engine)

* [x] **模型加載與熱啟動**
* 配置 TensorFlow.js 的 WASM 後端以提升運算效能。
* 語義分割模型可選：目前以參考物標定 + 固定區域估算長度；可後續接 `@mediapipe/tasks-vision` 或自訂模型。


* [x] **尺寸測量邏輯實作 (`measurementEngine.ts`)**
* [x] **步驟 A：參考物標定**
* 辨識標準卡片邊緣，計算 $Pixels Per Metric (PPM)$。


* [x] **步驟 B：目標分割與特徵點提取**
* 目前以固定目標區域高度估算；可擴充為 Mask R-CNN 或自定義節點模型識別目標邊界。


* [x] **步驟 C：幾何修正**
* 實作透視變換（Perspective Transform）校正拍攝角度造成的縮短效應（Foreshortening）。


* [x] **步驟 D：物理單位轉換**
* 根據 $PPM$ 公式計算長度與周長。





---

## 4. 階段三：身份驗證與數據簽名 (Identity & Certification)

* [x] **串接 Persona 客戶端 SDK**
* 在前端嵌入 Persona CDN 腳本與 `Persona.Inquiry` 流程（`usePersonaInquiry` hook）。
* 用戶完成政府證件與人臉掃描，獲取 `inquiry_id`。


* [x] **數據加簽模組 (`certificationProvider.ts`)**
* 實作「數位簽名」邏輯：將 `inquiry_id` + `measurement_result` + `timestamp` 進行哈希運算（HMAC/SHA256）。
* 模擬生成「數位認證證書」JSON 檔案供用戶下載或展示。


* [x] **防作弊機制**
* 實作 Liveness Detection：擷取來自即時 `getUserMedia` 影格，標記 `liveCaptured: true`；確保測量過程為即時動態而非靜態照片。



---

## 5. 階段四：隱私與合規防禦 (Privacy & Compliance)

* [x] **端點脫敏處理**
* 實作 `Client-side Blur`：在 UI 展示時（`enableBlur`），對預覽畫面敏感部位套用 CSS `blur`（`.sensitive-blur`）。


* [x] **零存儲架構確認**
* 確保 `useEffect` 清除 stream、不寫入 `localStorage` 或 `IndexedDB`；影像僅在記憶體中傳遞，瀏覽器關閉後不留存。



---

## 6. 技術指標與驗證 (Technical Specs & Validation)

| 項目 | 目標規格 | 驗證方式 |
| --- | --- | --- |
| **運算延遲** | < 500ms / frame | 效能分析器 (Chrome Profiler) |
| **測量誤差** | $\pm 0.3 \text{ cm}$ | 物理對比測試 (Standard Ruler) |
| **瀏覽器相容性** | iOS Safari / Android Chrome | 行動裝置實機測試 |
| **認證可靠度** | Persona Verified Status | Webhook 回調驗證 |

---

## 7. 下一步行動 (Next Steps)

1. **實作相機取景框：** 建立一個能精確提示用戶對齊參考物與目標物的 UI。
2. **原型測試：** 使用非生物物件（如圓柱體與卡片）測試像素與公分轉換的準確性。

---

### 資料來源 (Data Sources)

> 1. **Next.js Documentation:** App Router and Server Components architecture.
> 2. **TensorFlow.js API Reference:** Real-time object detection and segmentation in the browser.
> 3. **Persona Developer Guide:** Identity verification and inquiry workflow integration.
> 4. **OpenCV.js (Geometric Transformations):** Standard algorithms for perspective correction.
