'use client';

import { useState } from 'react';
import Link from 'next/link';
import { verifyCertificate } from '@/lib/api';

export default function VerifyPage() {
  const [jsonInput, setJsonInput] = useState('');
  const [result, setResult] = useState<{ valid: boolean; inquiryId?: string; issuedAt?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    setError(null);
    setResult(null);
    try {
      const cert = JSON.parse(jsonInput) as {
        inquiryId: string;
        measurement: { lengthCm: number; ppm: number; timestamp: number; liveCaptured: boolean };
        issuedAt: string;
        nonce: string;
        signature: string;
      };
      const res = await verifyCertificate(cert);
      setResult(res as { valid: boolean; inquiryId?: string; issuedAt?: string });
    } catch (e) {
      setError(e instanceof Error ? e.message : '驗證失敗');
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-xl font-bold text-slate-900">驗證證書</h1>
        <p className="mb-6 text-sm text-slate-600">貼上證書 JSON 以驗證簽名是否有效。</p>
        <Link href="/" className="mb-4 inline-block text-sm text-slate-600 hover:text-slate-900">← 返回首頁</Link>
        <textarea
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          placeholder='{"inquiryId":"...","measurement":{...},"issuedAt":"...","nonce":"...","signature":"..."}'
          className="mb-4 h-48 w-full rounded border border-slate-300 p-3 font-mono text-sm"
          rows={10}
        />
        <button
          type="button"
          onClick={handleVerify}
          className="rounded bg-slate-800 px-4 py-2 text-white hover:bg-slate-700"
        >
          驗證
        </button>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        {result && (
          <div className={`mt-4 rounded-lg p-4 ${result.valid ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'}`}>
            {result.valid ? (
              <>
                <p className="font-medium">證書有效</p>
                {result.inquiryId && <p className="text-sm">Inquiry ID: {result.inquiryId}</p>}
                {result.issuedAt && <p className="text-sm">發證時間: {result.issuedAt}</p>}
              </>
            ) : (
              <p className="font-medium">證書無效（簽名不符或遭竄改）</p>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
