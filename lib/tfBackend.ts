/**
 * TensorFlow.js 後端配置
 * 優先使用 WASM 以提升效能、降低記憶體，符合 < 500ms/frame 目標
 */
import * as tf from '@tensorflow/tfjs';

let backendInitialized = false;

export async function initTfBackend(): Promise<void> {
  if (backendInitialized) return;
  try {
    await tf.setBackend('wasm');
    await tf.ready();
    backendInitialized = true;
  } catch {
    try {
      await tf.setBackend('cpu');
      await tf.ready();
      backendInitialized = true;
    } catch (e) {
      console.warn('TF.js backend init fallback failed', e);
      throw e;
    }
  }
}

export function isTfReady(): boolean {
  return backendInitialized && tf.getBackend() != null;
}
