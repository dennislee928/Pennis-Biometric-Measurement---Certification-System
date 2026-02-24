"""
方案 B：離線標註。從待標目錄逐張看圖，鍵盤輸入 1（真實）/ 0（非真實）後將檔案移至 data/raw/recognized 或 data/raw/not_recognized。
依賴：系統預設圖片檢視器（用於開啟圖片）；在終端輸入 1/0。
"""
import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path

CLASSES = ("not_recognized", "recognized")  # 0, 1


def main():
    parser = argparse.ArgumentParser(description="Offline labeling: view image, type 1 (recognized) or 0 (not_recognized)")
    parser.add_argument("--input-dir", type=Path, required=True, help="Directory of unlabeled images")
    parser.add_argument("--raw-dir", type=Path, default=None, help="Output root for data/raw (default: <repo>/data/raw)")
    parser.add_argument("--no-open", action="store_true", help="Do not open image in system viewer (only prompt in terminal)")
    args = parser.parse_args()

    repo_root = Path(__file__).resolve().parent.parent
    raw_dir = args.raw_dir or (repo_root / "data" / "raw")
    for c in CLASSES:
        (raw_dir / c).mkdir(parents=True, exist_ok=True)

    input_dir = args.input_dir.resolve()
    if not input_dir.is_dir():
        print(f"Error: {input_dir} not found", file=sys.stderr)
        return 1

    exts = ("*.jpg", "*.jpeg", "*.png", "*.webp")
    files = []
    for ext in exts:
        files.extend(input_dir.glob(ext))
    files = sorted(files, key=lambda p: p.name)
    if not files:
        print(f"No images in {input_dir}", file=sys.stderr)
        return 1

    print(f"Found {len(files)} images. For each: type 1 (recognized) or 0 (not_recognized), then Enter. q = quit.")
    for i, f in enumerate(files):
        if not args.no_open:
            try:
                if sys.platform == "darwin":
                    subprocess.run(["open", f], check=False, capture_output=True)
                elif sys.platform == "win32":
                    os.startfile(str(f))
                else:
                    subprocess.run(["xdg-open", f], check=False, capture_output=True)
            except Exception:
                pass
        while True:
            try:
                key = input(f"[{i+1}/{len(files)}] {f.name} > ").strip().lower()
            except EOFError:
                return 0
            if key == "q":
                print("Quit.")
                return 0
            if key in ("1", "0"):
                label = CLASSES[int(key)]
                dst = raw_dir / label / f.name
                shutil.move(str(f), str(dst))
                print(f"  -> {dst.relative_to(raw_dir)}")
                break
            print("  Type 1 or 0")
    print("Done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
