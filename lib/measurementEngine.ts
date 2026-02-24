/**
 * 測量引擎：參考物標定 (PPM)、幾何修正、物理單位轉換
 * 影像不離開裝置，僅在記憶體中處理
 */

export const REFERENCE_CARD_WIDTH_CM = 8.56; // 標準信用卡寬度 (cm)
/** 護照閉合時可見寬度約 88mm */
export const REFERENCE_PASSPORT_WIDTH_CM = 8.8;

export interface Point2D {
  x: number;
  y: number;
}

export interface MeasurementResult {
  lengthCm: number;
  circumferenceCm?: number;
  ppm: number;
  timestamp: number;
  /** 是否通過 liveness / 即時檢測 */
  liveCaptured: boolean;
}

/**
 * 從參考卡片四角計算 Pixels Per Metric (PPM)
 * 輸入為卡片在畫面上的四個角點 (順序: 左上、右上、右下、左下)
 */
export function computePPMFromCard(
  corners: [Point2D, Point2D, Point2D, Point2D],
  cardWidthCm: number = REFERENCE_CARD_WIDTH_CM
): number {
  const [tl, tr, br, bl] = corners;
  const topWidth = Math.hypot(tr.x - tl.x, tr.y - tl.y);
  const bottomWidth = Math.hypot(br.x - bl.x, br.y - bl.y);
  const avgWidthPx = (topWidth + bottomWidth) / 2;
  if (avgWidthPx <= 0) return 0;
  return avgWidthPx / cardWidthCm;
}

/**
 * 從護照（閉合）四角計算 PPM
 */
export function computePPMFromPassport(
  corners: [Point2D, Point2D, Point2D, Point2D]
): number {
  return computePPMFromCard(corners, REFERENCE_PASSPORT_WIDTH_CM);
}

/**
 * 透視變換：將四邊形區域映射到矩形，校正 Foreshortening
 * 使用 4-point perspective transform 的逆矩陣將「螢幕四邊形」轉為「正視矩形」
 */
export function buildPerspectiveMatrix(
  src: [Point2D, Point2D, Point2D, Point2D],
  dstWidth: number,
  dstHeight: number
): number[] {
  const [p0, p1, p2, p3] = src;
  const dst = [
    { x: 0, y: 0 },
    { x: dstWidth, y: 0 },
    { x: dstWidth, y: dstHeight },
    { x: 0, y: dstHeight },
  ];
  const A: number[][] = [];
  const b: number[] = [];
  for (let i = 0; i < 4; i++) {
    const s = src[i];
    const d = dst[i];
    A.push(
      [s.x, s.y, 1, 0, 0, 0, -d.x * s.x, -d.x * s.y],
      [0, 0, 0, s.x, s.y, 1, -d.y * s.x, -d.y * s.y]
    );
    b.push(d.x, d.y);
  }
  const coef = solve8x8(A, b);
  if (!coef) return [];
  return [
    coef[0], coef[3], coef[6],
    coef[1], coef[4], coef[7],
    coef[2], coef[5], 1,
  ];
}

function solve8x8(A: number[][], b: number[]): number[] | null {
  const n = 8;
  const a = A.map((row) => [...row]);
  const c = [...b];
  for (let k = 0; k < n; k++) {
    let max = Math.abs(a[k][k]);
    let maxRow = k;
    for (let i = k + 1; i < n; i++) {
      if (Math.abs(a[i][k]) > max) {
        max = Math.abs(a[i][k]);
        maxRow = i;
      }
    }
    if (max < 1e-10) return null;
    [a[k], a[maxRow]] = [a[maxRow], a[k]];
    [c[k], c[maxRow]] = [c[maxRow], c[k]];
    for (let i = k + 1; i < n; i++) {
      const f = a[i][k] / a[k][k];
      for (let j = k; j < n; j++) a[i][j] -= f * a[k][j];
      c[i] -= f * c[k];
    }
  }
  const x = new Array(n);
  for (let i = n - 1; i >= 0; i--) {
    let sum = c[i];
    for (let j = i + 1; j < n; j++) sum -= a[i][j] * x[j];
    x[i] = sum / a[i][i];
  }
  return x;
}

/**
 * 在已知 PPM 下，將像素長度轉為公分
 */
export function pixelsToCm(pixels: number, ppm: number): number {
  if (ppm <= 0) return 0;
  return pixels / ppm;
}

/**
 * 從目標區域的邊界框或輪廓計算長度（像素），再轉成公分
 * region 為 { top, left, width, height } 或 長度像素值
 */
export function measureLengthFromRegion(
  lengthPixels: number,
  ppm: number,
  liveCaptured: boolean
): MeasurementResult {
  const lengthCm = pixelsToCm(lengthPixels, ppm);
  return {
    lengthCm,
    ppm,
    timestamp: Date.now(),
    liveCaptured,
  };
}

/**
 * 環境光線檢測：從 ImageData 計算平均亮度
 */
export function getAverageLuminance(imageData: ImageData): number {
  const data = imageData.data;
  let sum = 0;
  let count = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    sum += 0.299 * r + 0.587 * g + 0.114 * b;
    count++;
  }
  return count > 0 ? sum / count : 0;
}

/**
 * 模糊檢測：Laplacian 變異數近似
 */
export function getBlurScore(imageData: ImageData): number {
  const { data, width, height } = imageData;
  let sum = 0;
  let count = 0;
  const step = 4;
  for (let y = 1; y < height - 1; y += step) {
    for (let x = 1; x < width - 1; x += step) {
      const i = (y * width + x) * 4;
      const g = (data[i] + data[i + 1] + data[i + 2]) / 3;
      const l = (data[((y - 1) * width + x) * 4] + data[((y - 1) * width + x) * 4 + 1] + data[((y - 1) * width + x) * 4 + 2]) / 3;
      const r = (data[((y + 1) * width + x) * 4] + data[((y + 1) * width + x) * 4 + 1] + data[((y + 1) * width + x) * 4 + 2]) / 3;
      const laplacian = Math.abs(-l + 2 * g - r);
      sum += laplacian;
      count++;
    }
  }
  return count > 0 ? sum / count : 0;
}
