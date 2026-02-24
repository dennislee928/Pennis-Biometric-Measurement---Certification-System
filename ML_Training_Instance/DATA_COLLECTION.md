# 資料收集流程與標註規範

本文件說明如何取得與標註「測量區 ROI 是否為真實男性生殖器官」的二元分類資料，以及合規與隱私注意事項。

---

## 一、資料收集流程

### 方案 A：在現有 App 裡邊用邊收（推薦）

1. **後端**：設定環境變數 `COLLECTION_STORAGE_PATH`（例如 `./data/collection`），重啟後端後會啟用 `POST /api/collection`。
2. **前端**：使用者在完成測量擷取後，在「測量結果」步驟會看到「協助改進辨識（選填）」區塊。
3. 使用者勾選同意後，可選擇「此張為真實」或「此張為非真實」；前端會將當前擷取的 **ROI 圖**（由 `getMeasurementRoi` 裁切）以 PNG 上傳至後端。
4. 後端依標籤存檔至 `COLLECTION_STORAGE_PATH/recognized/` 或 `COLLECTION_STORAGE_PATH/not_recognized/`（檔名為時間戳 + UUID，避免重複）。
5. **匯出至訓練目錄**：將 `COLLECTION_STORAGE_PATH` 下的 `recognized`、`not_recognized` 視為 `data/raw/` 的來源，複製到 `ML_Training_Instance/data/raw/recognized` 與 `data/raw/not_recognized`，再執行方案 C 的 `split_train_val.py` 切分 train/val。

### 方案 B：離線標註

1. 先將一批 ROI 圖（例如從後端 collection 目錄複製，或從其他管道匯出）放到一個目錄，例如 `data/to_label/`。
2. 執行腳本：
   ```bash
   cd ML_Training_Instance
   python scripts/label_offline.py --input-dir ./data/to_label
   ```
3. 腳本會依序開啟每張圖（系統預設檢視器），在終端輸入 `1`（真實）或 `0`（非真實）後，該檔案會被移動到 `data/raw/recognized` 或 `data/raw/not_recognized`。
4. 輸入 `q` 可中途結束。

### 方案 C：切分 train / val

在 `data/raw/recognized` 與 `data/raw/not_recognized` 已有一批標註好的圖片後：

```bash
cd ML_Training_Instance
python scripts/split_train_val.py
```

預設會以 80% train、20% val、隨機打亂後複製到 `data/train/` 與 `data/val/`，兩類比例維持。之後即可執行 `python -m src.train`。

---

## 二、標註規範

- **recognized（真實）**：測量區 ROI 內可辨識為**真實男性生殖器官**的影像。
- **not_recognized（非真實）**：其餘皆屬此類，包含但不限於：
  - 空白、手、其他物品、未對準；
  - 假道具、合成或非真實影像；
  - 模糊、過曝、嚴重遮蔽導致無法判斷為真實器官。

標註時請以「是否為真實男性生殖器官」為唯一準則，避免模稜兩可的樣本影響訓練。

---

## 三、注意事項（合規與隱私）

- **同意與告知**：若有真人影像，必須在收集前取得明確同意，並告知用途（例如：改進辨識模型）、儲存位置與保留期限。
- **最小化**：僅儲存測量區 ROI 裁切圖，不儲存可辨識臉部或身份之資訊，並限制可存取人員。
- **法規**：依營運地區遵守個資法、醫療資料法規（若涉醫療用途）及成人內容相關規定。
- **儲存與訓練環境**：收集資料與訓練產出之模型建議放在受控環境，勿將原始收集資料或模型放入公開 repo；在 README 或內部文件中說明資料處理原則即可。

---

## 四、目錄對照

| 用途           | 路徑 |
|----------------|------|
| 後端收集儲存   | `COLLECTION_STORAGE_PATH/recognized`、`.../not_recognized` |
| 原始標註彙總   | `data/raw/recognized`、`data/raw/not_recognized` |
| 訓練 / 驗證集  | `data/train/...`、`data/val/...`（由 `split_train_val.py` 產生） |
