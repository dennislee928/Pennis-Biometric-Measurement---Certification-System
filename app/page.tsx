'use client';

import { useCallback, useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { initTfBackend } from '@/lib/tfBackend';
import {
  computePPMFromCard,
  measureLengthFromRegion,
  REFERENCE_CARD_WIDTH_CM,
  type MeasurementResult,
  type Point2D,
} from '@/lib/measurementEngine';
import { downloadCertificateAsJson, type CertificatePayload } from '@/lib/certificationProvider';
import { issueCertificate } from '@/lib/api';
import { useAuth } from '@/lib/useAuth';
import { getSupabase } from '@/lib/supabase';
import { CameraCapture } from '@/components/CameraCapture';
import { usePersonaInquiry } from '@/components/PersonaInquiry';
import { Shield, Download, Loader2, CheckCircle } from 'lucide-react';
import Link from 'next/link';

const REFERENCE_FRAME_WIDTH_RATIO = 0.25;

function getCardCornersFromOverlay(videoWidth: number, videoHeight: number): [Point2D, Point2D, Point2D, Point2D] {
  const refW = videoWidth * REFERENCE_FRAME_WIDTH_RATIO;
  const refLeft = (videoWidth - refW) / 2;
  const refTop = videoHeight * 0.15;
  const cardAspect = 85.6 / 53.98;
  const refH = refW * cardAspect;
  return [
    { x: refLeft, y: refTop },
    { x: refLeft + refW, y: refTop },
    { x: refLeft + refW, y: refTop + refH },
    { x: refLeft, y: refTop + refH },
  ];
}

/**
 * 從擷取畫面計算 PPM，並以目標區域（下方矩形）的估計高度作為長度像素
 * 實際產品可改為分割模型輸出之長度
 */
function runMeasurement(imageData: ImageData, liveCaptured: boolean): MeasurementResult | null {
  const { width, height } = imageData;
  const corners = getCardCornersFromOverlay(width, height);
  const ppm = computePPMFromCard(corners, REFERENCE_CARD_WIDTH_CM);
  if (ppm <= 0) return null;
  const targetRegionHeightPx = height * 0.35;
  return measureLengthFromRegion(targetRegionHeightPx, ppm, liveCaptured);
}

export default function Home() {
  const [step, setStep] = useState<'camera' | 'measure' | 'verify' | 'cert'>('camera');
  const [measurement, setMeasurement] = useState<MeasurementResult | null>(null);
  const [certificate, setCertificate] = useState<CertificatePayload | null>(null);
  const [inquiryId, setInquiryId] = useState<string | null>(null);

  useEffect(() => {
    initTfBackend().catch(() => {});
  }, []);

  const handleCapture = useCallback((imageData: ImageData, live: boolean) => {
    const result = runMeasurement(imageData, live);
    if (result) {
      setMeasurement(result);
      setStep('measure');
    }
  }, []);

  const { ready: personaReady, error: personaError, open: openPersona } = usePersonaInquiry(
    process.env.NEXT_PUBLIC_PERSONA_TEMPLATE_ID || 'itmpl_placeholder',
    (process.env.NEXT_PUBLIC_PERSONA_ENV as 'sandbox' | 'production') || 'sandbox',
    {
      onComplete: ({ inquiryId: id }) => {
        setInquiryId(id);
        setStep('cert');
      },
      onError: () => {},
    }
  );

  const { session, loading: authLoading, accessToken } = useAuth();
  const [certError, setCertError] = useState<string | null>(null);

  const handleStartVerification = useCallback(() => {
    setStep('verify');
    openPersona();
  }, [openPersona]);

  const handleDownloadCert = useCallback(async () => {
    if (!inquiryId || !measurement) return;
    if (!accessToken) return;
    setCertError(null);
    try {
      const cert = await issueCertificate(accessToken, inquiryId, measurement);
      setCertificate(cert);
      downloadCertificateAsJson(cert as CertificatePayload);
      confetti({ particleCount: 80, spread: 60 });
    } catch (e) {
      setCertError(e instanceof Error ? e.message : '簽發失敗');
    }
  }, [inquiryId, measurement, accessToken]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <nav className="mx-auto mb-6 flex max-w-2xl items-center justify-end gap-4 text-sm">
        <Link href="/verify" className="text-slate-600 hover:text-slate-900">驗證證書</Link>
        <Link href="/certificates" className="text-slate-600 hover:text-slate-900">我的證書</Link>
        {session ? (
          <>
            <span className="text-slate-500">{session.user?.email}</span>
            <button type="button" onClick={() => getSupabase().auth.signOut()} className="text-slate-600 hover:text-slate-900">登出</button>
          </>
        ) : (
          <Link href="/login" className="rounded bg-slate-800 px-3 py-1.5 text-white hover:bg-slate-700">登入</Link>
        )}
      </nav>
      <div className="mx-auto max-w-2xl space-y-8">
        <header className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">
            生物測量與認證系統
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            端上測量 · 影像不離裝置 · 身分驗證後取得數位證書
          </p>
        </header>

        {step === 'camera' && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <span>步驟 1</span> 相機擷取
            </h2>
            <p className="mb-4 text-sm text-slate-600">
              請將參考卡片對齊綠色框，並確保光線充足、畫面清晰後擷取。
            </p>
            <CameraCapture
              onCapture={handleCapture}
              referenceFrameWidthRatio={REFERENCE_FRAME_WIDTH_RATIO}
              enableBlur={true}
            />
          </section>
        )}

        {step === 'measure' && measurement && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <span>步驟 2</span> 測量結果
            </h2>
            <div className="mb-4 rounded-lg bg-slate-100 p-4">
              <p className="text-sm text-slate-600">長度（公分）</p>
              <p className="text-2xl font-bold text-slate-900">
                {measurement.lengthCm.toFixed(2)} cm
              </p>
              <p className="mt-2 text-xs text-slate-500">
                即時擷取：{measurement.liveCaptured ? '是' : '否'} · PPM：{measurement.ppm.toFixed(1)}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep('camera')}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                重新拍攝
              </button>
              <button
                type="button"
                onClick={handleStartVerification}
                disabled={!personaReady}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {personaReady ? (
                  <>
                    <Shield className="h-4 w-4" />
                    進行身分驗證
                  </>
                ) : (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    載入驗證…
                  </>
                )}
              </button>
            </div>
            {personaError && (
              <p className="mt-2 text-sm text-amber-600">{personaError}</p>
            )}
          </section>
        )}

        {step === 'verify' && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <span>步驟 3</span> 身分驗證 (Persona)
            </h2>
            <p className="mb-4 text-sm text-slate-600">
              請在彈窗中完成政府證件與人臉掃描。完成後將自動進入證書步驟。
            </p>
            <button
              type="button"
              onClick={openPersona}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700"
            >
              再次開啟驗證
            </button>
          </section>
        )}

        {step === 'cert' && measurement && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <span>步驟 4</span> 數位證書
            </h2>
            {inquiryId && (
              <p className="mb-4 text-sm text-slate-600">
                身分驗證 ID：<code className="rounded bg-slate-100 px-1">{inquiryId}</code>
              </p>
            )}
            {!accessToken ? (
              <div className="rounded-lg bg-amber-50 p-4 text-amber-800">
                <p className="mb-2">請先登入後再下載證書。</p>
                <Link href="/login" className="text-sm font-medium underline">前往登入</Link>
              </div>
            ) : (
              <>
                <div className="mb-4 rounded-lg bg-emerald-50 p-4">
                  <p className="flex items-center gap-2 text-emerald-800">
                    <CheckCircle className="h-5 w-5" />
                    可下載數位認證證書（後端簽名）
                  </p>
                </div>
                {certError && <p className="mb-2 text-sm text-red-600">{certError}</p>}
                <button
                  type="button"
                  onClick={handleDownloadCert}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
                >
                  <Download className="h-4 w-4" />
                  下載證書 JSON
                </button>
              </>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
