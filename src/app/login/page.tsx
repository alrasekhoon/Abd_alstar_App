'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/proxy/cp_login.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || 'فشل تسجيل الدخول');
        } catch (jsonError) {
          throw new Error(`خطأ في الخادم (${response.status})`);
        }
      }

      const data = await response.json();

      console.log('Token received:', data.token);
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userRole', data.user.role);
      localStorage.setItem('userPermissions', JSON.stringify(data.user.permissions || []));
      
      document.cookie = `authToken=${data.token}; path=/; max-age=${8 * 60 * 60}`;
      document.cookie = `userRole=${data.user.role}; path=/; max-age=${8 * 60 * 60}`;
      document.cookie = `userPermissions=${encodeURIComponent(JSON.stringify(data.user.permissions || []))}; path=/; max-age=${8 * 60 * 60}`;
      
      router.push('/dashboard');
      router.refresh();

    } catch (err) {
      let errorMsg = 'حدث خطأ في الاتصال بالخادم';
      
      if (err instanceof TypeError) {
        errorMsg = 'تعذر الاتصال بالخادم، يرجى التحقق من اتصال الإنترنت';
      } else if (err instanceof SyntaxError) {
        errorMsg = 'استجابة غير صالحة من الخادم (توقعنا JSON)';
      } else if (err instanceof Error) {
        errorMsg = err.message;
      }
      
      console.error('تفاصيل الخطأ:', err);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black p-4">
      <div className="max-w-md w-full p-8 bg-slate-800/60 backdrop-blur-lg rounded-2xl border border-amber-500/20 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
        
        {/* الشعار والعنوان */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 mb-4 bg-slate-900 border-2 border-amber-500/50 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <span className="text-4xl">⚖️</span>
          </div>
          <h2 className="text-center text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">
            الراسخون في القانون
          </h2>
          <p className="mt-2 text-center text-sm text-slate-400 font-medium">
            تسجيل الدخول إلى لوحة التحكم
          </p>
        </div>
        
        {/* رسالة الخطأ */}
        {error && (
          <div className="mb-6 bg-red-900/50 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg flex items-center gap-3 animate-pulse" role="alert">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <span className="block sm:inline text-sm">{error}</span>
          </div>
        )}
        
        {/* نموذج الدخول */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-amber-500/90 mb-2">
                اسم المستخدم
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                placeholder="أدخل اسم المستخدم..."
                className="block w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all duration-300"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-amber-500/90 mb-2">
                كلمة المرور
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="block w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all duration-300 text-left"
                dir="ltr"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center items-center gap-2 py-3.5 px-4 rounded-lg shadow-lg text-sm font-bold text-slate-900 bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-amber-500 transition-all duration-300 transform hover:-translate-y-0.5 ${loading ? 'opacity-70 cursor-not-allowed transform-none' : ''}`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  جاري الدخول...
                </>
              ) : (
                'تسجيل الدخول'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
