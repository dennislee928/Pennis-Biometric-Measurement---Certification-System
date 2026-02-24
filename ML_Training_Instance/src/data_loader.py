"""
從 data/train、data/val 讀取圖片與標籤。
輸入：224×224 RGB，像素正規化至 [0, 1]（與前端 runRecognitionModel 一致）。
類別：recognized=1（正樣本）, not_recognized=0（負樣本）；輸出 one-hot 或 index 與前端 result[1] 對應。
"""
import os
from pathlib import Path

import numpy as np
from PIL import Image
import tensorflow as tf

# 與前端 measurementVerification 一致
IMG_SIZE = 224
CLASS_NAMES = ("not_recognized", "recognized")  # index 0, 1 -> 前端取 result[1]


def get_data_root() -> Path:
    """ML_Training_Instance 根目錄（與 src/ 同層）。"""
    return Path(__file__).resolve().parent.parent


def list_images_by_class(data_dir: Path, split: str) -> tuple[list[Path], list[int]]:
    """
    列出某個 split（train/val/test）下所有圖片路徑與標籤。
    標籤：not_recognized=0, recognized=1。
    """
    paths: list[Path] = []
    labels: list[int] = []
    split_dir = data_dir / split
    for idx, class_name in enumerate(CLASS_NAMES):
        class_dir = split_dir / class_name
        if not class_dir.is_dir():
            continue
        for ext in ("*.jpg", "*.jpeg", "*.png", "*.webp"):
            for p in class_dir.glob(ext):
                paths.append(p)
                labels.append(idx)
    return paths, labels


def load_image(path: Path) -> np.ndarray:
    """讀取單張圖片：RGB、224×224、[0,1] float32。"""
    img = Image.open(path).convert("RGB")
    img = img.resize((IMG_SIZE, IMG_SIZE), Image.BILINEAR)
    arr = np.array(img, dtype=np.float32) / 255.0
    return arr


def make_dataset(
    data_dir: Path,
    split: str,
    batch_size: int = 32,
    shuffle: bool = True,
    seed: int | None = 42,
) -> tf.data.Dataset:
    """
    建立 tf.data.Dataset：從 data_dir/split 讀取圖片與標籤，
    每張圖 224×224 RGB [0,1]，標籤為 int 0 或 1（one-hot 在模型內或 loss 處理）。
    """
    paths, labels = list_images_by_class(data_dir, split)
    if not paths:
        raise FileNotFoundError(
            f"No images found under {data_dir / split}. "
            f"Expected subdirs: {CLASS_NAMES}. Run create_placeholder_data.py to generate dummy data."
        )

    def gen():
        for p, y in zip(paths, labels):
            x = load_image(p)
            yield x, y

    ds = tf.data.Dataset.from_generator(
        gen,
        output_signature=(
            tf.TensorSpec(shape=(IMG_SIZE, IMG_SIZE, 3), dtype=tf.float32),
            tf.TensorSpec(shape=(), dtype=tf.int32),
        ),
    )
    if shuffle:
        ds = ds.shuffle(len(paths), seed=seed)
    ds = ds.batch(batch_size).prefetch(tf.data.AUTOTUNE)
    return ds


def get_class_weights(data_dir: Path, split: str = "train") -> dict[int, float] | None:
    """依 train 集類別比例回傳 class_weight，供 model.fit 使用以平衡正負樣本。"""
    _, labels = list_images_by_class(data_dir, split)
    if not labels:
        return None
    total = len(labels)
    n0 = sum(1 for y in labels if y == 0)
    n1 = total - n0
    if n0 == 0 or n1 == 0:
        return None
    return {0: total / (2 * n0), 1: total / (2 * n1)}
