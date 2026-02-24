/**
 * TensorFlow.js 後端配置
 * 依序嘗試 WebGL（硬體加速）→ WASM → CPU，確保 tf.ready() 後再使用
 */
import * as tf from '@tensorflow/tfjs';

let backendInitialized = false;

export async function initTfBackend(): Promise<void> {
  if (backendInitialized) return;
  try {
    await tf.setBackend('webgl');
    await tf.ready();
    backendInitialized = true;
  } catch {
    try {
      await tf.setBackend('wasm');
      await tf.ready();
      backendInitialized = true;
    } catch {
      try {
        await tf.setBackend('cpu');
        await tf.ready();
        backendInitialized = true;
        console.warn('正在使用 CPU 運行 ML，效能可能受限');
      } catch (e) {
        console.warn('TF.js backend init fallback failed', e);
        throw e;
      }
    }
  }
}

export function isTfReady(): boolean {
  return backendInitialized && tf.getBackend() != null;
}
