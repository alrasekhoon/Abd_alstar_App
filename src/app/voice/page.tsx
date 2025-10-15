'use client';

import { useState, useEffect, useRef } from 'react';

type Material = {
  id: number;
  material_name: string;
  year1: number;
};

type Tunit = {
  material_id: number;
  unit_name: string;
  unit_num: number;
  pages: string;
};

type Tvoice = {
  id?: number;
  material_id: number;
  unit_num: number;
  page_num: number;
  voice_name: string;
  voice_path: string;
  note: string;
  order_show: number;
};

export default function MaterialManagement() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [tunits, setTunits] = useState<Tunit[]>([]);
  const [tvoices, setTvoices] = useState<Tvoice[]>([]);
  const [filteredTvoices, setFilteredTvoices] = useState<Tvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingVoice, setEditingVoice] = useState<Tvoice | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);
  const [pendingOrderUpdates, setPendingOrderUpdates] = useState<{id: number, order_show: number}[]>([]);
  const [showSaveOrderButton, setShowSaveOrderButton] = useState(false);

  // فلتر الحالة
  const [filters, setFilters] = useState({
    year: '',
    materialId: '',
    unitNum: '',
    pageNum: ''
  });

  const API_URL = 'http://alraskun.atwebpages.com/cp_voice.php';

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, tvoices]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('فشل في جلب البيانات');
      const data = await response.json();
      
      setMaterials(data.materials || []);
      setTunits(data.tunits || []);
      setTvoices(data.tvoices || []);
      setPendingOrderUpdates([]);
      setShowSaveOrderButton(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...tvoices];

    if (filters.year) {
      const materialIds = materials
        .filter(m => m.year1.toString() === filters.year)
        .map(m => m.id);
      filtered = filtered.filter(v => materialIds.includes(v.material_id));
    }

    if (filters.materialId) {
      filtered = filtered.filter(v => v.material_id.toString() === filters.materialId);
    }

    if (filters.unitNum) {
      filtered = filtered.filter(v => v.unit_num.toString() === filters.unitNum);
    }

    if (filters.pageNum) {
      filtered = filtered.filter(v => v.page_num.toString() === filters.pageNum);
    }

    // ترتيب حسب order_show
    filtered.sort((a, b) => a.order_show - b.order_show);
    setFilteredTvoices(filtered);
  };

  // تحديث الترتيب محلياً فقط
  const updateOrderLocally = (voiceId: number, newOrder: number) => {
    if (!voiceId) return;

    // تحديث الحالة المحلية
    setTvoices(prev => prev.map(voice => 
      voice.id === voiceId ? { ...voice, order_show: newOrder } : voice
    ));

    // إضافة للتحديثات المعلقة
    setPendingOrderUpdates(prev => {
      const existingIndex = prev.findIndex(update => update.id === voiceId);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { id: voiceId, order_show: newOrder };
        return updated;
      } else {
        return [...prev, { id: voiceId, order_show: newOrder }];
      }
    });

    setShowSaveOrderButton(true);
  };

  // حفظ جميع التحديثات للخادم
  const saveAllOrderUpdates = async () => {
    if (pendingOrderUpdates.length === 0) return;

    try {
      setIsUpdatingOrder(true);
      
      // تحديث كل العناصر المعلقة
      const updatePromises = pendingOrderUpdates.map(update =>
        updateOrderOnServer(update.id, update.order_show)
      );

      await Promise.all(updatePromises);
      
      // إعادة جلب البيانات للتأكد من المزامنة
      await fetchData();
      
      setShowSaveOrderButton(false);
      alert('تم حفظ الترتيب بنجاح!');
      
    } catch (err) {
      console.error('Error saving order updates:', err);
      setError('فشل في حفظ الترتيب. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsUpdatingOrder(false);
    }
  };

  // تحديث ترتيب واحد على الخادم
  const updateOrderOnServer = async (voiceId: number, newOrder: number) => {
    const response = await fetch(`${API_URL}?id=${voiceId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order_show: newOrder
      }),
    });

    if (!response.ok) {
      throw new Error(`خطأ في الخادم: ${response.status}`);
    }

    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      throw new Error('استجابة غير صالحة من الخادم');
    }

    if (!responseData.success) {
      throw new Error(responseData.error || 'فشل في تحديث الترتيب');
    }

    return responseData;
  };

  // نقل لأعلى (محلي فقط)
  const moveUp = (voice: Tvoice) => {
    if (!voice.id || isUpdatingOrder) return;
    
    const currentIndex = filteredTvoices.findIndex(v => v.id === voice.id);
    if (currentIndex <= 0) return;

    const targetVoice = filteredTvoices[currentIndex - 1];
    if (!targetVoice.id) return;

    // تبادل الترتيب محلياً
    updateOrderLocally(voice.id, targetVoice.order_show);
    updateOrderLocally(targetVoice.id, voice.order_show);
  };

  // نقل لأسفل (محلي فقط)
  const moveDown = (voice: Tvoice) => {
    if (!voice.id || isUpdatingOrder) return;
    
    const currentIndex = filteredTvoices.findIndex(v => v.id === voice.id);
    if (currentIndex >= filteredTvoices.length - 1) return;

    const targetVoice = filteredTvoices[currentIndex + 1];
    if (!targetVoice.id) return;

    // تبادل الترتيب محلياً
    updateOrderLocally(voice.id, targetVoice.order_show);
    updateOrderLocally(targetVoice.id, voice.order_show);
  };

  // سحب وإفلات لإعادة الترتيب
  const handleDragStart = (e: React.DragEvent, voice: Tvoice) => {
    e.dataTransfer.setData('text/plain', voice.id?.toString() || '');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetVoice: Tvoice) => {
    e.preventDefault();
    const draggedVoiceId = parseInt(e.dataTransfer.getData('text/plain'));
    
    if (!draggedVoiceId || draggedVoiceId === targetVoice.id) return;

    // تبادل الترتيب محلياً
    updateOrderLocally(draggedVoiceId, targetVoice.order_show);
    updateOrderLocally(targetVoice.id!, tvoices.find(v => v.id === draggedVoiceId)?.order_show || 0);
  };

  // إلغاء جميع التحديثات المعلقة
  const cancelOrderUpdates = () => {
    setPendingOrderUpdates([]);
    setShowSaveOrderButton(false);
    fetchData(); // إعادة تحميل البيانات الأصلية
  };

  // باقي الدوال تبقى كما هي (startRecording, stopRecording, etc...)
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetFilters = () => {
    setFilters({
      year: '',
      materialId: '',
      unitNum: '',
      pageNum: ''
    });
  };

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('المتصفح لا يدعم الوصول إلى الميكروفون');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = { 
        mimeType: 'audio/webm'
      };

      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'audio/mp3';
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options.mimeType = '';
        }
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: options.mimeType || 'audio/webm' 
        });
        setAudioBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      setError('خطأ في التسجيل: ' + (err instanceof Error ? err.message : ''));
      console.error('Recording error:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const clearRecording = () => {
    setAudioBlob(null);
    setAudioUrl('');
    setSelectedFile(null);
    audioChunksRef.current = [];
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      if (!file.type.startsWith('audio/')) {
        setError('الرجاء اختيار ملف صوتي فقط');
        return;
      }

      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      setAudioBlob(null);
      audioChunksRef.current = [];
      
      if (isRecording) {
        stopRecording();
      }
    }
  };

  const openAddForm = () => {
    const maxOrder = Math.max(...tvoices.map(v => v.order_show), 0);
    
    setEditingVoice({
      material_id: filters.materialId ? parseInt(filters.materialId) : 0,
      unit_num: filters.unitNum ? parseInt(filters.unitNum) : 0,
      page_num: filters.pageNum ? parseInt(filters.pageNum) : 0,
      voice_name: '',
      voice_path: '',
      note: '',
      order_show: maxOrder + 1
    });
    
    clearRecording();
  };

  const openEditForm = (voice: Tvoice) => {
    console.log('Opening edit form with voice:', voice);
    
    setEditingVoice({ 
      ...voice,
      material_id: voice.material_id || 0,
      unit_num: voice.unit_num || 0,
      page_num: voice.page_num || 0
    });
    
    clearRecording();
  };

  const handleAdd = async (formData: FormData) => {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('فشل في إضافة الصوت');

      closeEditForm();
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الإضافة');
    }
  };

  const handleUpdate = async (formData: FormData) => {
    if (!editingVoice?.id) return;

    try {
      if (!editingVoice.material_id || editingVoice.material_id <= 0) {
        throw new Error('يرجى اختيار مادة صحيحة');
      }
      if (!editingVoice.unit_num || editingVoice.unit_num <= 0) {
        throw new Error('رقم الوحدة يجب أن يكون أكبر من الصفر');
      }
      if (!editingVoice.page_num || editingVoice.page_num <= 0) {
        throw new Error('رقم الصفحة يجب أن يكون أكبر من الصفر');
      }

      const updateData = {
        material_id: editingVoice.material_id,
        unit_num: editingVoice.unit_num,
        page_num: editingVoice.page_num,
        note: editingVoice.note || '',
        voice_name: editingVoice.voice_name || '',
        order_show: editingVoice.order_show || 0
      };

      console.log('Sending update with data:', updateData);

      const response = await fetch(`${API_URL}?id=${editingVoice.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error(`خطأ في الخادم: ${response.status}`);
      }

      const responseData = await response.json();
      console.log('Update response:', responseData);

      if (!responseData.success) {
        throw new Error(responseData.error || 'فشل في تحديث الصوت');
      }

      closeEditForm();
      fetchData();
      alert(responseData.message || 'تم التحديث بنجاح');
      
    } catch (err) {
      console.error('Update error:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء التحديث');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVoice) return;

    const formData = new FormData();
    
    formData.append('material_id', editingVoice.material_id.toString());
    formData.append('unit_num', editingVoice.unit_num.toString());
    formData.append('page_num', editingVoice.page_num.toString());
    formData.append('note', editingVoice.note || '');
    formData.append('voice_name', editingVoice.voice_name || '');
    formData.append('order_show', editingVoice.order_show.toString());

    if (audioBlob) {
      const fileName = editingVoice.voice_name 
        ? `${editingVoice.voice_name.replace(/\.[^/.]+$/, "")}.balesoft`
        : `voice_${Date.now()}.balesoft`;
      formData.append('voice_file', audioBlob, fileName);
    } else if (selectedFile) {
      const fileName = editingVoice.voice_name 
        ? `${editingVoice.voice_name.replace(/\.[^/.]+$/, "")}.balesoft`
        : `${selectedFile.name.replace(/\.[^/.]+$/, "")}.balesoft`;
      formData.append('voice_file', selectedFile, fileName);
    } else if (editingVoice.id && editingVoice.voice_path) {
      formData.append('voice_path', editingVoice.voice_path);
    }

    if (editingVoice.id) {
      await handleUpdate(formData);
    } else {
      await handleAdd(formData);
    }
  };

  const closeEditForm = () => {
    setEditingVoice(null);
    clearRecording();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الصوت؟')) return;
    
    try {
      const response = await fetch(`${API_URL}?id=${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('فشل في حذف الصوت');
      
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء الحذف');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('تم نسخ اسم الصوت: ' + text);
    }).catch(err => {
      console.error('Failed to copy: ', err);
      alert('فشل في النسخ: ' + err);
    });
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-lg font-medium text-gray-700">جاري التحميل...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 max-w-md mx-auto" role="alert">
        <p className="font-bold">خطأ</p>
        <p>{error}</p>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">إدارة المواد والوحدات والأصوات</h1>
          <div className="flex space-x-3">
            {showSaveOrderButton && (
              <div className="flex space-x-2">
                <button
                  onClick={saveAllOrderUpdates}
                  disabled={isUpdatingOrder}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:bg-green-400 flex items-center"
                >
                  {isUpdatingOrder ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      حفظ الترتيب
                    </>
                  )}
                </button>
                <button
                  onClick={cancelOrderUpdates}
                  disabled={isUpdatingOrder}
                  className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition disabled:bg-gray-400"
                >
                  إلغاء
                </button>
              </div>
            )}
            <button
              onClick={openAddForm}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg shadow hover:from-blue-600 hover:to-blue-700 transition duration-300 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              إضافة صوت جديد
            </button>
          </div>
        </div>

        {/* فلتر القسم */}
        <div className="bg-gray-50 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">تصفية البيانات</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* فلتر السنة */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">السنة</label>
              <select
                name="year"
                value={filters.year}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              >
                <option value="">كل السنوات</option>
                <option value="1">السنة الأولى</option>
                <option value="2">السنة الثانية</option>
                <option value="3">السنة الثالثة</option>
                <option value="4">السنة الرابعة</option>
              </select>
            </div>

            {/* فلتر المادة */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">المادة</label>
              <select
                name="materialId"
                value={filters.materialId}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                disabled={!filters.year}
              >
                <option value="">كل المواد</option>
                {materials
                  .filter(m => !filters.year || m.year1.toString() === filters.year)
                  .map(material => (
                    <option key={material.id} value={material.id}>
                      {material.material_name}
                    </option>
                  ))}
              </select>
            </div>

            {/* فلتر الوحدة */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الوحدة</label>
              <select
                name="unitNum"
                value={filters.unitNum}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                disabled={!filters.materialId}
              >
                <option value="">كل الوحدات</option>
                {tunits
                  .filter(u => u.material_id.toString() === filters.materialId)
                  .map(unit => (
                    <option key={unit.unit_num} value={unit.unit_num}>
                      {unit.unit_name} (الوحدة {unit.unit_num})
                    </option>
                  ))}
              </select>
            </div>

            {/* فلتر الصفحة */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">الصفحة</label>
              <select
                name="pageNum"
                value={filters.pageNum}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                disabled={!filters.unitNum}
              >
                <option value="">كل الصفحات</option>
                {tunits
                  .filter(u => u.material_id.toString() === filters.materialId && u.unit_num.toString() === filters.unitNum)
                  .flatMap(u => {
                    const pages = u.pages.split(',').map(p => parseInt(p.trim()));
                    return pages.map(page => (
                      <option key={page} value={page}>
                        الصفحة {page}
                      </option>
                    ));
                  })}
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              إعادة تعيين الفلتر
            </button>
          </div>
        </div>

        {/* عرض البيانات المصفاة */}
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-500">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الترتيب</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">المادة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الوحدة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الصفحة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الصوت</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">ملاحظات</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTvoices.length > 0 ? (
                filteredTvoices.map((voice, index) => {
                  const material = materials.find(m => m.id === voice.material_id);
                  const unit = tunits.find(u => 
                    u.material_id === voice.material_id && 
                    u.unit_num === voice.unit_num
                  );

                  const hasPendingUpdate = pendingOrderUpdates.some(update => update.id === voice.id);

                  return (
                    <tr 
                      key={voice.id} 
                      className={`hover:bg-gray-50 transition ${hasPendingUpdate ? 'bg-yellow-50 border-l-4 border-yellow-400' : ''}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, voice)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, voice)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-sm font-medium min-w-8 text-center ${
                            hasPendingUpdate 
                              ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {voice.order_show}
                            {hasPendingUpdate && ' *'}
                          </span>
                          <div className="flex flex-col space-y-1">
                            <button
                              onClick={() => moveUp(voice)}
                              disabled={isUpdatingOrder || index === 0}
                              className={`p-1 rounded transition-colors ${
                                isUpdatingOrder || index === 0 
                                  ? 'text-gray-400 cursor-not-allowed' 
                                  : 'text-green-600 hover:bg-green-100 hover:text-green-700'
                              }`}
                              title="نقل لأعلى"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                            </button>
                            <button
                              onClick={() => moveDown(voice)}
                              disabled={isUpdatingOrder || index === filteredTvoices.length - 1}
                              className={`p-1 rounded transition-colors ${
                                isUpdatingOrder || index === filteredTvoices.length - 1
                                  ? 'text-gray-400 cursor-not-allowed' 
                                  : 'text-green-600 hover:bg-green-100 hover:text-green-700'
                              }`}
                              title="نقل لأسفل"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {material?.material_name || 'غير معروف'}
                        </div>
                        <div className="text-sm text-gray-500">
                          السنة {material?.year1 || 'غير معروف'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {unit?.unit_name || 'غير معروف'}
                        </div>
                        <div className="text-sm text-gray-500">
                          الوحدة {voice.unit_num}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          الصفحة {voice.page_num}
                        </div>
                      </td>
                      <td className="px-6 py-4" style={{ minWidth: '250px', maxWidth: '350px' }}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900 truncate" title={voice.voice_name}>
                            {voice.voice_name}
                          </span>
                          <button 
                            onClick={() => copyToClipboard('http://alraskun.atwebpages.com/voices/'+voice.voice_name)}
                            className="text-gray-400 hover:text-blue-500 p-1"
                            title="نسخ اسم الصوت"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                          </button>
                        </div>
                        <div className="mt-2 overflow-x-auto">
                          <audio 
                            controls 
                            className="w-full min-w-[200px]"
                            src={`http://alraskun.atwebpages.com/${voice.voice_path}`}
                          >
                            متصفحك لا يدعم تشغيل الصوتيات.
                          </audio>
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <div className="text-sm text-gray-500">
                          {voice.note}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openEditForm(voice)}
                            className="text-yellow-600 hover:text-yellow-900 flex items-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                            تعديل
                          </button>
                          <button
                            onClick={() => voice.id && handleDelete(voice.id)}
                            className="text-red-600 hover:text-red-900 flex items-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    لا توجد بيانات متطابقة مع معايير الفلترة المحددة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal for Add/Edit Voice */}
        {editingVoice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl my-8 max-h-[90vh] overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {editingVoice.id ? 'تعديل الصوت' : 'إضافة صوت جديد'}
                  </h2>
                  
                  {/* زر إشارة الاستفهام مع التلميح */}
                  <div className="relative group">
                    <button className="text-gray-500 hover:text-blue-600 transition-colors duration-200">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    
                    {/* نص التلميح الذي يظهر عند الوقوف */}
                    <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-gray-800 text-white text-sm rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                      ملاحظة: إذا قمت بتعديل الصوت لن يتم تعديله إذا كان الطالب قام بتحميله مسبقاً يفضل حذفه
                      <div className="absolute -top-1 right-3 w-2 h-2 bg-gray-800 transform rotate-45"></div>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={closeEditForm}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
        
              <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">المادة</label>
                    <select
                      name="material_id"
                      value={editingVoice.material_id}
                      onChange={(e) => setEditingVoice({...editingVoice, material_id: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      required
                    >
                      <option value="">اختر المادة</option>
                      {materials.map(material => (
                        <option key={material.id} value={material.id}>
                          {material.material_name} (السنة {material.year1})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ترتيب العرض</label>
                    <input
                      type="number"
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      value={editingVoice.order_show || 1}
                      onChange={(e) => setEditingVoice({...editingVoice, order_show: parseInt(e.target.value) || 1})}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">الوحدة</label>
  <input
    type="number"
    min="1"
    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
    value={editingVoice.unit_num || ''}
    onChange={(e) => setEditingVoice({...editingVoice, unit_num: parseInt(e.target.value) || 0})}
    placeholder="أدخل رقم الوحدة"
    required
  />
 
</div>

<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">الصفحة</label>
  <input
    type="number"
    min="1"
    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
    value={editingVoice.page_num || ''}
    onChange={(e) => setEditingVoice({...editingVoice, page_num: parseInt(e.target.value) || 0})}
    placeholder="أدخل رقم الصفحة"
    required
  />
 
</div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات</label>
                  <textarea
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    value={editingVoice.note}
                    onChange={(e) => setEditingVoice({...editingVoice, note: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">اسم الملف الصوتي</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    value={editingVoice.voice_name || ''}
                    onChange={(e) => setEditingVoice({...editingVoice, voice_name: e.target.value})}
                    placeholder="أدخل اسمًا للملف الصوتي"
                    required
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    يفضل ان يتم اضافة اسم للملف لتميز الملفات في الاستضافة
                  </p>
                </div>
                
                <div className="border-t pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-3">التسجيل الصوتي</label>
                  
                  {/* قسم اختيار الملف */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">أو اختر ملف صوتي</label>
                    <div className="mt-1 flex items-center">
                      <label className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        اختر ملف
                        <input 
                          type="file" 
                          className="sr-only" 
                          onChange={handleFileChange}
                          accept="audio/*"
                        />
                      </label>
                      {selectedFile && (
                        <span className="ml-2 text-sm text-gray-500 truncate max-w-xs">
                          {selectedFile.name}
                        </span>
                      )}
                    </div>
                    
                    {/* معاينة الصوت المختار */}
                    {selectedFile && audioUrl && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-600 mb-2">معاينة الصوت المختار:</p>
                        <audio 
                          controls 
                          src={audioUrl}
                          className="w-full"
                        />
                        <button
                          type="button"
                          onClick={clearRecording}
                          className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm"
                        >
                          إزالة الملف المختار
                        </button>
                      </div>
                    )}
                    
                    <p className="mt-1 text-xs text-gray-500">
                      يفضل ان لا يكون نوع ملفات الصوت (mp3,mp2,ram,wma,avi)
                    </p>
                  </div>

                  {/* قسم التسجيل الصوتي المباشر */}
                  {!selectedFile && (
                    <div className="space-y-4">
                      {!isRecording ? (
                        <button
                          type="button"
                          onClick={startRecording}
                          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                          </svg>
                          بدء التسجيل ({MediaRecorder.isTypeSupported('audio/webm') ? 'WEBM' : 
                                      MediaRecorder.isTypeSupported('audio/mp3') ? 'MP3' : 
                                      'صيغة افتراضية'})
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={stopRecording}
                          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1zm4 0a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          إيقاف التسجيل
                        </button>
                      )}
                      
                      {audioUrl && !selectedFile && (
                        <div className="mt-4">
                          <p className="text-sm text-gray-600 mb-2">معاينة التسجيل:</p>
                          <audio controls src={audioUrl} className="w-full" />
                          <button
                            type="button"
                            onClick={clearRecording}
                            className="mt-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm"
                          >
                            حذف التسجيل
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* عرض التسجيل الحالي عند التعديل */}
                  {editingVoice?.id && editingVoice.voice_path && !audioUrl && !selectedFile && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-2">التسجيل الحالي:</p>
                      <audio 
                        controls 
                        src={`http://alraskun.atwebpages.com/${editingVoice.voice_path}`}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end space-x-3 pt-4 pb-2">
                  <button
                    type="button"
                    onClick={closeEditForm}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    حفظ التغييرات
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}