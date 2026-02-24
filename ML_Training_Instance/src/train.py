"""
二元分類訓練：輸入 224×224 RGB [0,1]，輸出 2 類 softmax（index 1 = recognized）。
與前端 lib/measurementVerification.ts 規格一致，便於匯出 TF.js 後直接使用。
"""
import argparse
from pathlib import Path

import tensorflow as tf

from data_loader import get_data_root, make_dataset, get_class_weights, IMG_SIZE, CLASS_NAMES

DEFAULT_EPOCHS = 10
DEFAULT_BATCH = 32
OUTPUT_DIR_NAME = "saved_model"
KERAS_WEIGHTS_NAME = "model.keras"


def build_model() -> tf.keras.Model:
    """MobileNetV2 transfer learning + 2-class head（softmax）。"""
    base = tf.keras.applications.MobileNetV2(
        input_shape=(IMG_SIZE, IMG_SIZE, 3),
        include_top=False,
        weights="imagenet",
        pooling=None,
    )
    base.trainable = True
    # 可選：只微調後幾層以加快收斂
    for layer in base.layers[:-20]:
        layer.trainable = False

    inputs = tf.keras.Input(shape=(IMG_SIZE, IMG_SIZE, 3))
    x = base(inputs)
    x = tf.keras.layers.GlobalAveragePooling2D()(x)
    x = tf.keras.layers.Dropout(0.3)(x)
    outputs = tf.keras.layers.Dense(2, activation="softmax")(x)
    model = tf.keras.Model(inputs, outputs)
    return model


def main():
    parser = argparse.ArgumentParser(description="Train binary ROI classifier")
    parser.add_argument("--epochs", type=int, default=DEFAULT_EPOCHS)
    parser.add_argument("--batch", type=int, default=DEFAULT_BATCH)
    parser.add_argument("--save-keras", action="store_true", help="Save .keras in addition to SavedModel")
    parser.add_argument("--data-dir", type=Path, default=None, help="Override data root")
    args = parser.parse_args()

    # 支援從專案根或 ML_Training_Instance 執行：python -m src.train 或 cd src && python train.py
    root = args.data_dir or get_data_root()
    data_dir = root / "data"
    if not data_dir.is_dir():
        raise FileNotFoundError(f"Data dir not found: {data_dir}. Run create_placeholder_data.py first.")

    train_ds = make_dataset(data_dir, "train", batch_size=args.batch, shuffle=True)
    val_ds = make_dataset(data_dir, "val", batch_size=args.batch, shuffle=False)
    class_weight = get_class_weights(data_dir, "train")

    model = build_model()
    model.compile(
        optimizer=tf.keras.optimizers.Adam(1e-4),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )

    out_dir = root / OUTPUT_DIR_NAME
    out_dir.mkdir(parents=True, exist_ok=True)
    callbacks = [
        tf.keras.callbacks.ModelCheckpoint(
            str(out_dir / "best"),
            monitor="val_accuracy",
            mode="max",
            save_best_only=True,
            save_weights_only=False,
        ),
    ]

    model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=args.epochs,
        class_weight=class_weight,
        callbacks=callbacks,
    )

    # 以 best checkpoint 為最終模型（若無則用當前權重）
    best_path = out_dir / "best"
    if best_path.exists():
        model = tf.keras.models.load_model(best_path)
    model.save(out_dir)  # SavedModel for export_tfjs and HF app
    if args.save_keras:
        model.save(root / KERAS_WEIGHTS_NAME, save_format="keras")
    print(f"Saved SavedModel to {out_dir}. Run export_tfjs.py to produce TF.js GraphModel.")


if __name__ == "__main__":
    main()
