"""
方案 C：將 data/raw/recognized 與 data/raw/not_recognized 依比例切為 train / val。
預設 80% train、20% val，隨機打亂後寫入 data/train、data/val，兩類比例維持。
"""
import argparse
import random
import shutil
from pathlib import Path

CLASSES = ("recognized", "not_recognized")
SPLITS = ("train", "val")
DEFAULT_VAL_RATIO = 0.2


def main():
    parser = argparse.ArgumentParser(description="Split raw labeled data into train/val")
    parser.add_argument("--raw-dir", type=Path, default=None, help="Raw data root (default: <repo>/data/raw)")
    parser.add_argument("--data-dir", type=Path, default=None, help="Output data root (default: <repo>/data)")
    parser.add_argument("--val-ratio", type=float, default=DEFAULT_VAL_RATIO, help="Fraction for val (default 0.2)")
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parent.parent
    raw_dir = args.raw_dir or (repo_root / "data" / "raw")
    data_dir = args.data_dir or (repo_root / "data")

    if not raw_dir.is_dir():
        print(f"Error: {raw_dir} not found. Create data/raw/recognized and data/raw/not_recognized with images.")
        return 1

    random.seed(args.seed)
    for class_name in CLASSES:
        src = raw_dir / class_name
        if not src.is_dir():
            continue
        images = list(src.glob("*.jpg")) + list(src.glob("*.jpeg")) + list(src.glob("*.png")) + list(src.glob("*.webp"))
        random.shuffle(images)
        n_val = max(1, int(len(images) * args.val_ratio))
        n_train = len(images) - n_val
        train_list = images[:n_train]
        val_list = images[n_train:]

        for split, file_list in (("train", train_list), ("val", val_list)):
            out_dir = data_dir / split / class_name
            out_dir.mkdir(parents=True, exist_ok=True)
            for f in file_list:
                shutil.copy2(f, out_dir / f.name)
        print(f"{class_name}: {n_train} train, {n_val} val")
    print(f"Done. Output under {data_dir}/train and {data_dir}/val")
    return 0


if __name__ == "__main__":
    exit(main())
