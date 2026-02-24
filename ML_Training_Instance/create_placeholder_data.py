"""
產生少量假資料以驗證訓練 pipeline 可跑。
僅供開發/CI 使用，不可用於真實訓練。
"""
import os
from pathlib import Path

import numpy as np
from PIL import Image

# 與 data_loader 一致
IMG_SIZE = 224
CLASSES = ("recognized", "not_recognized")
SPLITS = ("train", "val", "test")
# 每個 split 每類最少幾張（避免 DataLoader 報錯）
MIN_PER_CLASS = 2


def get_data_dir() -> Path:
    return Path(__file__).resolve().parent / "data"


def main():
    data_dir = get_data_dir()
    rng = np.random.default_rng(42)
    for split in SPLITS:
        for class_name in CLASSES:
            out_dir = data_dir / split / class_name
            out_dir.mkdir(parents=True, exist_ok=True)
            for i in range(MIN_PER_CLASS):
                # 假圖：隨機噪聲或單色，僅為佔位
                arr = (rng.uniform(0, 1, (IMG_SIZE, IMG_SIZE, 3)) * 255).astype(np.uint8)
                img = Image.fromarray(arr)
                img.save(out_dir / f"placeholder_{class_name}_{split}_{i}.png")
    print(f"Placeholder data written under {data_dir}. Run train.py to verify pipeline.")


if __name__ == "__main__":
    main()
