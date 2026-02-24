---
name: Optional login i18n disclaimer
overview: 三項變更：1) 測量與證書 PNG/PDF 不需登入即可使用；2) layout 與 i18n 改為「男性陰莖長度與尺寸測量」服務描述；3) 歡迎頁加入警示標語與使用者須知（四語）。
todos: []
isProject: false
---

# 不需登入、服務描述與歡迎頁警示／須知

## 1. 可以不用登入

**現狀**：[app/measure/page.tsx](app/measure/page.tsx) 步驟 4 在 `!accessToken` 時只顯示「請先登入」與前往登入連結，不顯示姓名輸入與 PNG/PDF 下載。

**調整**：

- 步驟 4 的**姓名輸入、下載證書 PNG、下載證書 PDF** 改為**一律顯示**（不依賴 `accessToken`）。PNG/PDF 為前端產出，不需後端簽發。
- **僅「下載證書 JSON」** 維持需登入：當 `!accessToken` 時顯示「請先登入後再下載證書 JSON」或隱藏該按鈕；當已登入時顯示該按鈕並維持現有 `handleDownloadCert`（呼叫後端）。
- 導覽列「登入／登出、我的證書」保留，未登入時仍可進入 `/measure` 並完成測量與下載 PNG/PDF。

**檔案**：僅修改 [app/measure/page.tsx](app/measure/page.tsx) 步驟 4 區塊的條件渲染，讓姓名 + PNG + PDF 區塊在無 `accessToken` 時也顯示。

---

## 2. Layout 與 i18n：本服務為測量男性陰莖長度與大小

**2.1 [app/layout.tsx](app/layout.tsx)**

- `metadata.title`：改為明確描述服務，例如英文 "Male Penis Length & Size Measurement"（其餘語系見 i18n）。
- `metadata.description`：改為說明為男性陰莖長度與尺寸測量、端上測量、影像不離裝置等（可與 i18n 的 welcome.subtitle 對齊或簡短版）。

**2.2 [lib/i18n/messages.ts](lib/i18n/messages.ts)**

- **welcome.title**（四語）：改為「男性陰莖長度與尺寸測量」之對應譯文，例如：
  - en: "Male Penis Length & Size Measurement"
  - zh-TW: "男性陰莖長度與尺寸測量"
  - ja: "男性ペニス長・サイズ測定"
  - es: "Medición de longitud y tamaño del pene masculino"
- **welcome.subtitle**（四語）：維持端上測量、影像不離裝置、證書等說明，可補一句「本服務用於測量男性陰莖長度與尺寸」使語意一致。
- **cert.title**（四語）：證書標題改為與「男性陰莖長度／尺寸」相關（例如「男性陰莖長度測量證書」等），與 welcome 語意一致。

其餘 key（步驟、按鈕、導覽）若目前為中性用語（如「生物測量」）可視需要改為「陰莖長度測量」或維持，以產品用語為準；至少完成 title、subtitle、cert.title 三處一致。

---

## 3. 歡迎頁加入警示標語與使用者須知

**3.1 新增 i18n key**（[lib/i18n/messages.ts](lib/i18n/messages.ts)）

- **welcome.disclaimer**（四語）：警示標語，例如僅供個人參考、非醫療診斷、成人使用、敏感內容等，依合規需求撰寫。
- **welcome.noticeTitle**（四語）：例如「使用者須知」/ "User Notice" / "ご利用上の注意" / "Aviso al usuario"。
- **welcome.noticeItems**（四語）：須知條列。可採單一 key 多行字串（`\n` 分隔）或多 key（如 `welcome.notice1`、`welcome.notice2`）。內容可包含：影像僅於裝置內處理、須年滿 18 歲、僅供個人使用、本服務不取代醫療建議等。

**3.2 歡迎頁版面**（[app/page.tsx](app/page.tsx)）

- 在語言切換與標題之間或標題與 CTA 之間，新增兩區塊：
  1. **警示標語**：使用 `t('welcome.disclaimer')`，以較醒目樣式（例如 `bg-amber-50`、小字、或左側邊框）呈現。
  2. **使用者須知**：標題 `t('welcome.noticeTitle')`，內文為 `t('welcome.noticeItems')` 或以多 key 條列（可搭配 `<ul>`）。
- 「開始測量」CTA 維持在最後，使用者閱讀警示與須知後再進入 `/measure`。

---

## 4. 實作順序建議

1. 在 [lib/i18n/messages.ts](lib/i18n/messages.ts) 新增 `welcome.disclaimer`、`welcome.noticeTitle`、`welcome.noticeItems`（或 notice1/2/3），並更新 `welcome.title`、`welcome.subtitle`、`cert.title` 為「男性陰莖長度與尺寸」相關文案（四語）。
2. 更新 [app/layout.tsx](app/layout.tsx) 的 `metadata.title` 與 `metadata.description`。
3. 更新 [app/page.tsx](app/page.tsx)：加入警示區塊與使用者須知區塊，使用上述 i18n key。
4. 更新 [app/measure/page.tsx](app/measure/page.tsx) 步驟 4：姓名 + PNG + PDF 區塊不依賴 `accessToken`；僅 JSON 下載按鈕（或整塊後端證書說明）在未登入時隱藏或顯示「請先登入」。

---

## 5. 檔案對照


| 項目               | 檔案                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------- |
| 不需登入即可下載 PNG/PDF | [app/measure/page.tsx](app/measure/page.tsx)                                          |
| 服務描述（男性陰莖長度與尺寸）  | [app/layout.tsx](app/layout.tsx)、[lib/i18n/messages.ts](lib/i18n/messages.ts)         |
| 歡迎頁警示與須知         | [lib/i18n/messages.ts](lib/i18n/messages.ts)（新 key）、[app/page.tsx](app/page.tsx)（新區塊） |


