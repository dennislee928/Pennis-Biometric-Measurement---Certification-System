/**
 * 測量區 ML 辨識介面（預留）
 * 若設定 NEXT_PUBLIC_MEASUREMENT_RECOGNITION_MODEL_URL 或 window.__MEASUREMENT_RECOGNITION_MODEL__，
 * 可載入 TensorFlow 模型對 ROI 做推論；否則回傳 { recognized: true } 不阻擋流程。
 */

export interface RecognitionResult {
  recognized: boolean;
  confidence?: number;
}

/**
 * 對測量區 ROI 執行辨識（stub：無模型時一律通過）
 * 實作時可從 process.env.NEXT_PUBLIC_MEASUREMENT_RECOGNITION_MODEL_URL 或
 * (typeof window !== 'undefined' && (window as unknown as { __MEASUREMENT_RECOGNITION_MODEL__?: string }).__MEASUREMENT_RECOGNITION_MODEL__)
 * 讀取模型 URL，載入後對 roiImageData 推論並回傳是否為目標。
 */
export async function runRecognitionModel(_roiImageData: ImageData): Promise<RecognitionResult> {
  const modelUrl =
    typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_MEASUREMENT_RECOGNITION_MODEL_URL
      ? process.env.NEXT_PUBLIC_MEASUREMENT_RECOGNITION_MODEL_URL
      : typeof window !== 'undefined'
        ? (window as unknown as { __MEASUREMENT_RECOGNITION_MODEL__?: string }).__MEASUREMENT_RECOGNITION_MODEL__
        : undefined;
  if (!modelUrl) {
    return { recognized: true };
  }
  // TODO: 載入 TensorFlow 模型並對 _roiImageData 推論，回傳 { recognized, confidence }
  return { recognized: true };
}
