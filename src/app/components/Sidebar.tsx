'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 💡 التعديل الأول: ضع الرابط الكامل والفعلي لملف PHP الخاص بتسجيل الدخول
      // تأكد من أن هذا هو الرابط الصحيح للسيرفر الخاص بك
      const response = await fetch('https://alrasekhooninlaw.com/cp_login.php', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('فشل تسجيل الدخول، تحقق من اسم المستخدم أو كلمة المرور');
      }

      const data = await response.json();
      
      // 💡 التعديل الثاني: حفظ الصلاحيات لكي تسمح لك القائمة الجانبية بالدخول
      localStorage.setItem('authToken', data.token || 'dummy-token'); // حفظ التوكن
      localStorage.setItem('userRole', data.role || 'admin'); // إعطاء صلاحية واسعة (أدمن) افتراضياً للوحة
      if (data.permissions) {
        localStorage.setItem('userPermissions', JSON.stringify(data.permissions));
      }

      // توجيهك للصفحة الرئيسية بعد نجاح الدخول
      router.push('/'); 
      
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في الاتصال بالسيرفر');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black p-4">
      <div className="max-w-md w-full p-8 bg-slate-800/40 backdrop-blur-xl rounded-3xl border border-amber-500/20 shadow-2xl">
        
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 mb-4 bg-slate-900 border-2 border-amber-500/40 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-4xl">⚖️</span>
          </div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-600">
            الراسخون في القانون
          </h1>
          <p className="text-amber-500/60 text-sm mt-2 flex items-center gap-1">
            نظام الإدارة القانونية
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm text-center font-bold">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="relative group">
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="اسم المستخدم"
                className="w-full px-4 py-3.5 bg-slate-900/60 border border-slate-700 rounded-xl text-slate-200 focus:border-amber-500/50 outline-none transition-all"
                required
              />
            </div>

            <div className="relative group">
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="كلمة المرور"
                dir="ltr"
                className="w-full px-4 py-3.5 bg-slate-900/60 border border-slate-700 rounded-xl text-slate-200 focus:border-amber-500/50 outline-none transition-all"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-amber-400 to-amber-600 rounded-2xl text-slate-950 font-black text-lg shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {loading ? 'جاري التحقق...' : 'دخول المنصة'}
          </button>
        </form>
      </div>
    </div>
  );
}
