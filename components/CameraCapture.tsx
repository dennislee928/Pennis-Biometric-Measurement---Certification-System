'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getAverageLuminance,
  getBlurScore,
  type MeasurementResult,
} from '@/lib/measurementEngine';
import { useI18n } from '@/lib/i18n/context';
import { Camera, AlertCircle, Loader2 } from 'lucide-react';

export type CaptureState = 'idle' | 'live' | 'captured' | 'error';

export interface CameraCaptureProps {
  onCapture?: (imageData: ImageData, live: boolean) => void;
  onMeasurementReady?: (result: MeasurementResult) => void;
  /** 參考卡片框佔畫面寬度比例 (0.2 = 20%) */
  referenceFrameWidthRatio?: number;
  /** 護照閉合比例 高/寬 (125/88)，不傳則用卡片比例 */
  passportAspect?: number;
  /** 是否啟用敏感區域模糊 */
  enableBlur?: boolean;
  /** 最低亮度閾值 */
  minLuminance?: number;
  /** 最低模糊分數閾值（低於此視為太模糊） */
  minBlurScore?: number;
}

const DEFAULT_MIN_LUMINANCE = 40;
const DEFAULT_MIN_BLUR_SCORE = 2;

export function CameraCapture({
  onCapture,
  onMeasurementReady,
  referenceFrameWidthRatio = 0.25,
  passportAspect,
  enableBlur = true,
  minLuminance = DEFAULT_MIN_LUMINANCE,
  minBlurScore = DEFAULT_MIN_BLUR_SCORE,
}: CameraCaptureProps) {
  const { t } = useI18n();
  const frameAspect = passportAspect ?? 85.6 / 53.98;
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [state, setState] = useState<CaptureState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [envOk, setEnvOk] = useState<{ light: boolean; sharp: boolean }>({
    light: true,
    sharp: true,
  });
  const lastCheckRef = useRef<number>(0);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    setState('idle');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 1280, height: 720 },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setState('live');
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('camera.error');
      setError(msg);
      setState('error');
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      stopStream();
    };
  }, [startCamera, stopStream]);

  const checkEnvironment = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const luminance = getAverageLuminance(imageData);
    const blur = getBlurScore(imageData);
    setEnvOk({
      light: luminance >= minLuminance,
      sharp: blur >= minBlurScore,
    });
  }, [minLuminance, minBlurScore]);

  useEffect(() => {
    if (state !== 'live') return;
    const interval = setInterval(() => {
      if (Date.now() - lastCheckRef.current < 500) return;
      lastCheckRef.current = Date.now();
      checkEnvironment();
    }, 800);
    return () => clearInterval(interval);
  }, [state, checkEnvironment]);

  const capture = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const live = true;
    onCapture?.(imageData, live);
    setState('captured');
    // 零存儲：不寫入 localStorage / IndexedDB，影像僅在記憶體中傳遞，unmount 時 stream 與 canvas 清除
  }, [onCapture]);

  const reset = useCallback(() => {
    setState('live');
  }, []);

  const w = 640;
  const h = 480;
  const refW = w * referenceFrameWidthRatio;
  const refLeft = (w - refW) / 2;
  const refTop = h * 0.15;
  const refBottom = refTop + refW * frameAspect;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative overflow-hidden rounded-xl bg-black" style={{ width: w, height: h }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`h-full w-full object-cover ${enableBlur ? 'sensitive-blur' : ''}`}
          style={{ transform: 'scaleX(-1)' }}
        />
        <canvas ref={canvasRef} className="hidden" />
        {state === 'live' && (
          <div className="camera-overlay">
            <div
              className="camera-overlay__frame"
              style={{
                left: refLeft,
                top: refTop,
                width: refW,
                height: refBottom - refTop,
              }}
            />
            <div
              className="camera-overlay__hint"
              style={{ left: 0, right: 0, top: refTop - 28 }}
            >
              {t('reference.passportHint')}
            </div>
            <div
              className="camera-overlay__hint"
              style={{ left: 0, right: 0, bottom: 24 }}
            >
              {t('reference.captureHint')}
            </div>
          </div>
        )}
      </div>

      {state === 'live' && (
        <div className="flex items-center gap-4 text-sm">
          <span className={envOk.light ? 'text-green-600' : 'text-amber-600'}>
            {envOk.light ? t('camera.bright') : t('camera.dark')}
          </span>
          <span className={envOk.sharp ? 'text-green-600' : 'text-amber-600'}>
            {envOk.sharp ? t('camera.sharp') : t('camera.blur')}
          </span>
        </div>
      )}

      {state === 'live' && (
        <button
          type="button"
          onClick={capture}
          disabled={!envOk.light || !envOk.sharp}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-white transition hover:bg-emerald-700 disabled:opacity-50"
        >
          <Camera className="h-5 w-5" />
          {t('camera.capture')}
        </button>
      )}

      {state === 'captured' && (
        <button
          type="button"
          onClick={reset}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-slate-700 hover:bg-slate-50"
        >
          {t('camera.retake')}
        </button>
      )}

      {state === 'error' && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 text-red-800">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
          <button
            type="button"
            onClick={startCamera}
            className="ml-2 rounded bg-red-100 px-3 py-1 text-sm hover:bg-red-200"
          >
            {t('camera.retry')}
          </button>
        </div>
      )}

      {state === 'idle' && (
        <div className="flex items-center gap-2 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          {t('camera.starting')}
        </div>
      )}
    </div>
  );
}
