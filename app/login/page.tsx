'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [magicSent, setMagicSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: err } = await getSupabase().auth.signInWithPassword({ email, password });
      if (err) throw err;
      window.location.href = '/';
    } catch (e) {
      setError(e instanceof Error ? e.message : '登入失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { error: err } = await getSupabase().auth.signInWithOtp({ email });
      if (err) throw err;
      setMagicSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : '發送失敗');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-sm">
        <h1 className="mb-6 text-xl font-bold text-slate-900">登入</h1>
        <Link href="/" className="mb-4 inline-block text-sm text-slate-600 hover:text-slate-900">← 返回首頁</Link>
        {magicSent ? (
          <div className="rounded-lg bg-emerald-50 p-4 text-emerald-800">
            已發送魔法連結至 {email}，請至信箱點擊連結登入。
          </div>
        ) : (
          <>
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-1 block text-sm text-slate-700">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded border border-slate-300 px-3 py-2"
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="mb-1 block text-sm text-slate-700">密碼</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded border border-slate-300 px-3 py-2"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button type="submit" disabled={loading} className="w-full rounded bg-slate-800 py-2 text-white hover:bg-slate-700 disabled:opacity-50">
                {loading ? '登入中…' : '登入'}
              </button>
            </form>
            <p className="mt-4 text-center text-sm text-slate-500">或</p>
            <button
              type="button"
              onClick={handleMagicLink}
              disabled={loading || !email}
              className="mt-2 w-full rounded border border-slate-300 py-2 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              寄送魔法連結
            </button>
          </>
        )}
      </div>
    </main>
  );
}
