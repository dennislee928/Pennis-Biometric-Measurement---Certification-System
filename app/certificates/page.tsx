'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/useAuth';
import { listCertificates, getCertificate } from '@/lib/api';
import { downloadCertificateAsJson } from '@/lib/certificationProvider';

type CertItem = { id: string; inquiryId: string; issuedAt: string; lengthCm: number; signature: string };

export default function CertificatesPage() {
  const { session, accessToken } = useAuth();
  const [list, setList] = useState<CertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    listCertificates(accessToken)
      .then(setList)
      .catch((e) => setError(e instanceof Error ? e.message : '載入失敗'))
      .finally(() => setLoading(false));
  }, [accessToken]);

  const handleDownload = async (id: string) => {
    if (!accessToken) return;
    try {
      const cert = await getCertificate(accessToken, id);
      downloadCertificateAsJson(cert);
    } catch (e) {
      setError(e instanceof Error ? e.message : '下載失敗');
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 text-xl font-bold text-slate-900">我的證書</h1>
        <p className="mb-6 text-sm text-slate-600">您已簽發的證書列表（多裝置同步）。</p>
        <Link href="/" className="mb-4 inline-block text-sm text-slate-600 hover:text-slate-900">← 返回首頁</Link>
        {!session && (
          <div className="rounded-lg bg-amber-50 p-4 text-amber-800">
            請先 <Link href="/login" className="underline">登入</Link> 以查看證書。
          </div>
        )}
        {session && (
          <>
            {loading && <p className="text-slate-500">載入中…</p>}
            {error && <p className="text-red-600">{error}</p>}
            {!loading && !error && list.length === 0 && <p className="text-slate-500">尚無證書。</p>}
            {!loading && list.length > 0 && (
              <ul className="space-y-3">
                {list.map((item) => (
                  <li key={item.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4">
                    <div>
                      <p className="font-medium">{item.inquiryId}</p>
                      <p className="text-sm text-slate-500">{item.issuedAt} · {item.lengthCm.toFixed(2)} cm</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDownload(item.id)}
                      className="rounded bg-slate-800 px-3 py-1.5 text-sm text-white hover:bg-slate-700"
                    >
                      下載
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </main>
  );
}
