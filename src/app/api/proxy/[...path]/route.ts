import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.CUSTOM_API_URL || 'http://alraskun.atwebpages.com';

// تعريف نوع Params صحيح لـ Next.js
type Params = {
  params: {
    path: string[];
  };
};

// دالة مساعدة لبناء الـ URL
function buildTargetUrl(request: NextRequest, path: string[]) {
  const url = new URL(request.url);
  const queryString = url.search;
  return `${API_BASE_URL}/${path.join('/')}${queryString}`;
}

// دالة خاصة لمعالجة رفع الملفات
async function handleFileUpload(request: NextRequest, path: string[]) {
  try {
    const targetUrl = buildTargetUrl(request, path);
    
    // إنشاء FormData جديد من الطلب الوارد
    const formData = await request.formData();
    
    console.log('File upload to:', targetUrl);
    
    // إرسال FormData مباشرة إلى السيرفر الهدف
    const response = await fetch(targetUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { 
        error: 'فشل في رفع الملف',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { path } = params;
    const targetUrl = buildTargetUrl(request, path);
    
    console.log('GET Proxying to:', targetUrl);
    
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Proxy GET error:', error);
    return NextResponse.json(
      { 
        error: 'فشل في الاتصال بالسيرفر',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { path } = params;
    const contentType = request.headers.get('content-type') || '';

    // إذا كان الطلب يحتوي على ملفات، استخدم معالجة خاصة
    if (contentType.includes('multipart/form-data')) {
      return handleFileUpload(request, path);
    }

    // للطلبات العادية (JSON)
    const targetUrl = buildTargetUrl(request, path);
    const body = await request.text();
    
    console.log('POST Proxying to:', targetUrl);
    
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Proxy POST error:', error);
    return NextResponse.json(
      { error: 'فشل في الاتصال بالسيرفر' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { path } = params;
    const targetUrl = buildTargetUrl(request, path);
    const body = await request.text();
    
    console.log('PUT Proxying to:', targetUrl);
    
    const response = await fetch(targetUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: body,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Proxy PUT error:', error);
    return NextResponse.json(
      { error: 'فشل في الاتصال بالسيرفر' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { path } = params;
    const targetUrl = buildTargetUrl(request, path);
    
    console.log('DELETE Proxying to:', targetUrl);
    
    const response = await fetch(targetUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Proxy DELETE error:', error);
    return NextResponse.json(
      { error: 'فشل في الاتصال بالسيرفر' },
      { status: 500 }
    );
  }
}