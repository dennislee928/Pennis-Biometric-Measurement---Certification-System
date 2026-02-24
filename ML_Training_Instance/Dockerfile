# ML_Training_Instance: 訓練與 TF.js 匯出、Gradio 推論
# Python 3.11 與 TensorFlow 2.12+ 相容
FROM python:3.11-slim

WORKDIR /app

# 系統依賴（Pillow 等可能需要）
RUN apt-get update && apt-get install -y --no-install-recommends \
    libjpeg62-turbo-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

# 先裝依賴以利用層快取
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 專案程式
COPY create_placeholder_data.py .
COPY app.py .
COPY src/ ./src/
COPY data/ ./data/

# 預設：產生 placeholder 後訓練（無掛載資料時可跑通流程）
# 有掛載 data/ 時可改為直接執行訓練或只跑 app
CMD ["sh", "-c", "python create_placeholder_data.py && python -m src.train --epochs 10 --batch 32"]
