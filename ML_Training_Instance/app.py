"""
Gradio App：上傳圖片 → 224×224 RGB [0,1] 前處理 → Keras 推論 → 顯示類別與信心度。
部署至 Hugging Face Space 時以此檔為入口（app_file: app.py）。
"""
import os
from pathlib import Path

import gradio as gr
import numpy as np
from PIL import Image
import tensorflow as tf

IMG_SIZE = 224
CLASS_NAMES = ("not_recognized", "recognized")
THRESHOLD = 0.8

# 模型路徑：與 train.py 輸出一致；HF Space 可將 saved_model 放在 Repo 或從 Hub 下載
ROOT = Path(__file__).resolve().parent
MODEL_DIR = ROOT / "saved_model"

_model = None


def load_model():
    global _model
    if _model is not None:
        return _model
    if not MODEL_DIR.is_dir():
        raise FileNotFoundError(
            f"No SavedModel at {MODEL_DIR}. Train locally with train.py and upload saved_model/ to this Space, or add the folder to the repo."
        )
    _model = tf.keras.models.load_model(MODEL_DIR)
    return _model


def preprocess(image) -> np.ndarray | None:
    """PIL/NumPy 圖片 → 224×224 RGB，[0,1] float32，batch 維度。"""
    if image is None:
        return None
    if isinstance(image, np.ndarray):
        if image.size == 0:
            return None
        if image.ndim == 2:
            image = np.stack([image] * 3, axis=-1)
        elif image.shape[-1] == 4:
            image = image[..., :3]
        image = Image.fromarray(image.astype(np.uint8)).convert("RGB")
    else:
        image = image.convert("RGB")
    image = image.resize((IMG_SIZE, IMG_SIZE), Image.BILINEAR)
    arr = np.array(image, dtype=np.float32) / 255.0
    return arr[np.newaxis, ...]  # (1, 224, 224, 3)


def predict(image) -> tuple[str, float]:
    """單張圖片 → 預測類別與信心度（result[1] = recognized 機率）。"""
    if image is None:
        return "No image", 0.0
    x = preprocess(image)
    if x is None:
        return "Invalid image", 0.0
    model = load_model()
    logits = model.predict(x, verbose=0)
    proba = float(logits[0][1])
    label = CLASS_NAMES[1] if proba >= THRESHOLD else CLASS_NAMES[0]
    return label, proba


def build_ui():
    with gr.Blocks(title="Measurement ROI Classifier") as demo:
        gr.Markdown("## 測量區 ROI 辨識\n上傳一張圖片，模型會輸出是否為目標（recognized）及信心度。")
        with gr.Row():
            inp = gr.Image(label="Upload image", type="numpy")
            out_label = gr.Textbox(label="Prediction")
            out_conf = gr.Number(label="Confidence (recognized)")
        btn = gr.Button("Classify")
        btn.click(fn=predict, inputs=inp, outputs=[out_label, out_conf])
        gr.Markdown("輸入會先被縮放為 224×224、正規化至 [0,1]，與前端 runRecognitionModel 一致。")
    return demo


if __name__ == "__main__":
    demo = build_ui()
    # 容器內需綁定 0.0.0.0 才能從 host 連線
    demo.launch(server_name="0.0.0.0", server_port=7860)
