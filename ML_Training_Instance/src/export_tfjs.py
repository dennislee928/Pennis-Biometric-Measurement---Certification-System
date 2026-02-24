"""
將訓練好的 Keras SavedModel 轉成 TF.js GraphModel（model.json + 權重 shard），
供前端 tf.loadGraphModel(modelUrl) 使用。
"""
import argparse
import subprocess
import sys
from pathlib import Path

from data_loader import get_data_root

SAVED_MODEL_DIR = "saved_model"
TFJS_OUTPUT_DIR = "tfjs_model"


def main():
    parser = argparse.ArgumentParser(description="Export SavedModel to TF.js GraphModel")
    parser.add_argument("--input", type=Path, default=None, help="SavedModel directory (default: <root>/saved_model)")
    parser.add_argument("--output", type=Path, default=None, help="TF.js output dir (default: <root>/tfjs_model)")
    args = parser.parse_args()

    root = get_data_root()
    input_dir = args.input or (root / SAVED_MODEL_DIR)
    output_dir = args.output or (root / TFJS_OUTPUT_DIR)

    if not input_dir.is_dir():
        print(f"Error: SavedModel not found at {input_dir}. Run train.py first.", file=sys.stderr)
        sys.exit(1)

    output_dir.mkdir(parents=True, exist_ok=True)

    # 使用 tensorflowjs_converter CLI；輸出為 GraphModel 以配合前端 loadGraphModel
    cmd = [
        sys.executable,
        "-m",
        "tensorflowjs_converter",
        "--input_format=tf_saved_model",
        "--output_format=tfjs_graph_model",
        str(input_dir),
        str(output_dir),
    ]
    try:
        subprocess.run(cmd, check=True)
    except FileNotFoundError:
        print(
            "Error: tensorflowjs_converter not found. Install with: pip install tensorflowjs",
            file=sys.stderr,
        )
        sys.exit(1)
    except subprocess.CalledProcessError as e:
        sys.exit(e.returncode)

    print(f"TF.js GraphModel written to {output_dir}. Point NEXT_PUBLIC_MEASUREMENT_RECOGNITION_MODEL_URL to {output_dir}/model.json (or that URL on your server).")


if __name__ == "__main__":
    main()
