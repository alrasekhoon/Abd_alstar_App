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
    const response = await fetch('http://alraskun.atwebpages.com/cp_login.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    // أولاً: التحقق من حالة الاستجابة
    if (!response.ok) {
      // إذا كان هناك خطأ، حاول قراءة رسالة الخطأ من JSON
      try {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل تسجيل الدخول');
      } catch (jsonError) {

        // إذا فشل تحليل JSON، استخدم رسالة الخطأ الافتراضية
        throw new Error(`خطأ في الخادم (${response.status} ${jsonError})`);
      }
    }

    // إذا كانت الاستجابة ناجحة، قم بتحليل JSON
    const data = await response.json();

    console.log('Token received:', data.token);
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('userRole', data.user.role);
    
    // تعيين الكوكيز
    document.cookie = `authToken=${data.token}; path=/; max-age=${8 * 60 * 60}`;
    document.cookie = `userRole=${data.user.role}; path=/; max-age=${8 * 60 * 60}`;
    
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            لوحة تحكم وادارة تطبيق الرسخون
          </h2>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            تسجيل الدخول إلى لوحة التحكم
          </h2>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                اسم المستخدم
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                كلمة المرور
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'جاري التأكد...' : 'تسجيل الدخول'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}