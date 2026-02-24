/**
 * 測量區 ML 辨識介面
 * 若設定 NEXT_PUBLIC_MEASUREMENT_RECOGNITION_MODEL_URL 或 window.__MEASUREMENT_RECOGNITION_MODEL__，
 * 可載入 TensorFlow.js GraphModel 對 ROI 做推論；否則回傳 { recognized: true } 不阻擋流程。
 * 模型假設：輸入 224×224 RGB、數值 [0,1]；輸出為二元分類 [未辨識, 已辨識]，取 result[1] 為信心度。
 */

import * as tf from '@tensorflow/tfjs';

const MODEL_INPUT_SIZE = 224;
const RECOGNITION_CONFIDENCE_THRESHOLD = 0.8;

export interface RecognitionResult {
  recognized: boolean;
  confidence?: number;
}

function getModelUrl(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return (
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_MEASUREMENT_RECOGNITION_MODEL_URL) ||
    (window as unknown as { __MEASUREMENT_RECOGNITION_MODEL__?: string }).__MEASUREMENT_RECOGNITION_MODEL__
  );
}

let model: tf.GraphModel | null = null;

/**
 * 對測量區 ROI 執行 ML 辨識
 * @param roiImageData 裁剪後的測量區域圖像（來自 getMeasurementRoi）
 */
export async function runRecognitionModel(roiImageData: ImageData): Promise<RecognitionResult> {
  if (typeof window === 'undefined') {
    return { recognized: true };
  }

  const modelUrl = getModelUrl();
  if (!modelUrl) {
    return { recognized: true };
  }

  try {
    if (!model) {
      model = await tf.loadGraphModel(modelUrl);
    }

    const result = tf.tidy(() => {
      const tensor = tf.browser
        .fromPixels(roiImageData, 3)
        .resizeBilinear([MODEL_INPUT_SIZE, MODEL_INPUT_SIZE])
        .expandDims(0)
        .toFloat()
        .div(255.0);
      const prediction = model!.predict(tensor) as tf.Tensor;
      return prediction.dataSync();
    });

    // 二元分類：result[0] = 未辨識, result[1] = 已辨識（若為單一 sigmoid 則取 result[0]）
    const confidence = result.length > 1 ? result[1] : result[0];
    const recognized = confidence > RECOGNITION_CONFIDENCE_THRESHOLD;

    return {
      recognized,
      confidence: Number(confidence),
    };
  } catch (error) {
    console.error('ML Inference Error:', error);
    return { recognized: false };
  }
}
