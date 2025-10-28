import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.CUSTOM_API_URL ;//|| 'http://alraskun.atwebpages.com';

// رؤوس افتراضية لمنع التخزين المؤقت للردود JSON
const NO_CACHE_JSON_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
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
    
    const formData = await request.formData();
    
    console.log('File upload to:', targetUrl);
    
    const response = await fetch(targetUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

  const data = await response.json();
  return NextResponse.json(data, { headers: NO_CACHE_JSON_HEADERS });
    
  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { 
        error: 'فشل في رفع الملف',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500, headers: NO_CACHE_JSON_HEADERS }
    );
  }
}

// دالة للتعامل مع الملفات (صور، ملفات، إلخ)
async function handleFileRequest(request: NextRequest, path: string[]) {
  try {
    const targetUrl = buildTargetUrl(request, path);
    
    console.log('File request to:', targetUrl);
    
    const response = await fetch(targetUrl, {
      method: 'GET',
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // الحصول على نوع المحتوى من الاستجابة
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    // إنشاء الاستجابة مع البيانات الثنائية
    const arrayBuffer = await response.arrayBuffer();
    
    // إذا كانت الملفات من مجلد uploads (صور المستخدم/بطاقات) نمنع الكاش لكي تعكس التغييرات فوراً
    const cacheHeader = path[0] === 'uploads' ? 'no-store' : 'public, max-age=3600';

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': cacheHeader,
      },
    });
    
  } catch (error) {
    console.error('File request error:', error);
    return NextResponse.json(
      { 
        error: 'فشل في جلب الملف',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500, headers: NO_CACHE_JSON_HEADERS }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    
    // إذا كان الطلب لملف (صور، إلخ)
    const isFileRequest = path[0] === 'uploads' || 
                         path[path.length - 1].includes('.') || 
                         request.headers.get('accept')?.includes('image');
    
    if (isFileRequest) {
      return handleFileRequest(request, path);
    }

    // للطلبات العادية (JSON)
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
  return NextResponse.json(data, { headers: NO_CACHE_JSON_HEADERS });
    
  } catch (error) {
    console.error('Proxy GET error:', error);
    return NextResponse.json(
      { 
        error: 'فشل في الاتصال بالسيرفر',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500, headers: NO_CACHE_JSON_HEADERS }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      return handleFileUpload(request, path);
    }

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
  return NextResponse.json(data, { headers: NO_CACHE_JSON_HEADERS });
    
  } catch (error) {
    console.error('Proxy POST error:', error);
    return NextResponse.json(
      { error: 'فشل في الاتصال بالسيرفر' },
      { status: 500, headers: NO_CACHE_JSON_HEADERS }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
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
  return NextResponse.json(data, { headers: NO_CACHE_JSON_HEADERS });
    
  } catch (error) {
    console.error('Proxy PUT error:', error);
    return NextResponse.json(
      { error: 'فشل في الاتصال بالسيرفر' },
      { status: 500, headers: NO_CACHE_JSON_HEADERS }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
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