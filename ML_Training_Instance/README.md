---
sdk: gradio
app_file: app.py
---

# 測量區 ROI 辨識模型（ML Training Instance）

二元影像分類：輸入為測量區 ROI 圖片，輸出是否為目標（recognized / not_recognized）。與前端 `runRecognitionModel` 規格一致：**224×224 RGB、像素 [0,1]、輸出 2 類 softmax，result[1] 為「已辨識」機率**。

## 環境需求

- Python 3.9+
- 安裝依賴：`pip install -r requirements.txt`

## 資料結構

請將標註好的圖片放入以下資料夾（每類一個子資料夾）：

```
data/
  train/
    recognized/     # 正樣本
    not_recognized/ # 負樣本
  val/
    recognized/
    not_recognized/
  test/
    recognized/
    not_recognized/
```

支援副檔名：`.jpg`, `.jpeg`, `.png`, `.webp`。若尚無真實資料，可先執行 placeholder 腳本驗證流程：

```bash
python create_placeholder_data.py
```

## 訓練

從專案根目錄（即 `ML_Training_Instance/` 上一層）或從 `ML_Training_Instance` 內執行：

```bash
cd ML_Training_Instance
python -m src.train --epochs 10 --batch 32
```

或進入 `src` 後執行（需在 `ML_Training_Instance` 下）：

```bash
cd ML_Training_Instance/src
python train.py --epochs 10 --batch 32
```

訓練完成後，模型會寫入 `saved_model/`（SavedModel 格式）。

## 匯出 TF.js GraphModel

供前端 Next.js 使用（`tf.loadGraphModel(modelUrl)`）：

```bash
cd ML_Training_Instance
python -m src.export_tfjs
```

或指定路徑：

```bash
python -m src.export_tfjs --input saved_model --output tfjs_model
```

產出在 `tfjs_model/`（含 `model.json` 與權重 shard）。將此目錄部署到靜態伺服器或 CDN，並設定前端環境變數：

```env
NEXT_PUBLIC_MEASUREMENT_RECOGNITION_MODEL_URL=https://your-server/tfjs_model/model.json
```

若將 `tfjs_model/` 放到 Next 專案的 `public/measurement-model/`，可設為 `/measurement-model/model.json`。

## 本地執行 Gradio App

```bash
cd ML_Training_Instance
pip install -r requirements.txt
# 需先訓練並保留 saved_model/
python app.py
```

瀏覽器開啟 Gradio 提供的網址即可上傳圖片試用。

## 部署至 Hugging Face Space

### 方式一：網頁建立 Space

1. 前往 [Hugging Face Spaces](https://huggingface.co/spaces)，建立新 Space。
2. 選擇 **Gradio** 作為 SDK。
3. 將本目錄（`ML_Training_Instance/`）內容上傳或透過 Git 連動：
   - 至少需包含：`app.py`、`requirements.txt`、`README.md`（本檔含 YAML front matter）。
   - 若要在 Space 上直接推論，請一併上傳訓練好的 **saved_model/** 目錄（或透過 Git LFS 推送大檔）。

### 方式二：Gradio CLI

```bash
cd ML_Training_Instance
pip install gradio
gradio deploy
```

依提示登入 Hugging Face 並選擇或建立 Space。

### 注意

- Space 內執行的是 **Python Keras 模型**（從 `saved_model/` 載入），不是 TF.js。
- 若 Repo 中沒有 `saved_model/`，App 啟動時會報錯並提示需先訓練並上傳該目錄，或從 Hugging Face Hub 下載模型到該路徑。

## 與前端的對應

| 項目 | 本訓練 / Gradio | 前端 (measurementVerification.ts) |
|------|------------------|-----------------------------------|
| 輸入尺寸 | 224×224 | 224×224 |
| 輸入正規化 | [0, 1] | [0, 1] |
| 輸出 | 2 類 softmax | result[1] = 已辨識機率 |
| 門檻 | 0.8（Gradio 展示用） | RECOGNITION_CONFIDENCE_THRESHOLD = 0.8 |

前端未設定 `NEXT_PUBLIC_MEASUREMENT_RECOGNITION_MODEL_URL` 時不會載入模型，辨識步驟一律通過。
