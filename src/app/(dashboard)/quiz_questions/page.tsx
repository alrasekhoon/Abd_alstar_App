'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';

interface ChatRoom {
  type: string;
  unit_num: string;
  resolved_type?: string;
  resolved_unit?: string;
  last_updated: string;
  total_messages: number;
  last_message?: string;
  last_sender?: string;
}

interface ChatMessage {
  id: number;
  text1: string;
  sender: string;
  time1: string;
  is_reply: number;
  replied_message?: string;
  type: string;
  unit_num: string;
  created_at: string;
  mes_id: string;
  user_name?: string | null;
}

export default function QuizQuestionsDashboard() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const API_URL = '/api/proxy/cp_quiz_questions.php';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchRooms = useCallback(async () => {
    try {
      setIsLoadingRooms(true);
      const url = `${API_URL}?action=list_rooms&_t=${new Date().getTime()}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        cache: 'no-store'
      });
      if (!res.ok) throw new Error('فشل جلب الغرف');
      const data = await res.json();
      if (data.success) {
        setRooms(data.rooms || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingRooms(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
    const interval = setInterval(fetchRooms, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [fetchRooms]);

  const fetchMessages = useCallback(async (type: string, unit_num: string) => {
    try {
      setIsLoadingMessages(true);
      const url = `${API_URL}?action=get_messages&type=${encodeURIComponent(type)}&unit_num=${encodeURIComponent(unit_num)}&_t=${new Date().getTime()}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        cache: 'no-store'
      });
      if (!res.ok) throw new Error('فشل جلب الرسائل');
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages || []);
        setTimeout(scrollToBottom, 100);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (selectedRoom) {
      fetchMessages(selectedRoom.type, selectedRoom.unit_num);
      const interval = setInterval(() => fetchMessages(selectedRoom.type, selectedRoom.unit_num), 15000);
      return () => clearInterval(interval);
    }
  }, [selectedRoom, fetchMessages]);

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedRoom) return;
    
    setIsSending(true);
    try {
      // Find the last message to act as the replied_message
      const lastMessage = messages.length > 0 ? messages[messages.length - 1].text1 : null;

      const res = await fetch(`${API_URL}?action=send_reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: replyText.trim(),
          type: selectedRoom.type,
          unit_num: selectedRoom.unit_num,
          replied_message: lastMessage
        }),
      });

      const data = await res.json();
      if (data.success) {
        setReplyText('');
        fetchMessages(selectedRoom.type, selectedRoom.unit_num);
      } else {
        throw new Error(data.error || 'فشل الإرسال');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'حدث خطأ أثناء الإرسال');
    } finally {
      setIsSending(false);
    }
  };

  const getFilteredRooms = () => {
    if (!searchQuery.trim()) return rooms;
    return rooms.filter(r => 
      r.type.includes(searchQuery) || 
      r.unit_num.includes(searchQuery) ||
      (r.last_sender && r.last_sender.includes(searchQuery))
    );
  };

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) + ' - ' + d.toLocaleDateString('ar-EG');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="container mx-auto p-4 lg:p-8 max-w-[90rem] h-[calc(100vh-80px)] flex flex-col font-sans">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">استفسارات <span className="text-amber-500 font-light">الاختبارات</span></h1>
          <p className="text-slate-500 mt-2 font-medium">الرد على أسئلة الطلاب في المواد والوحدات الدراسية مباشرة.</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden pb-4">
        {/* Sidebar: Rooms List */}
        <div className="w-full md:w-[380px] bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col overflow-hidden h-[40vh] md:h-full shrink-0">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <input
              type="text"
              placeholder="ابحث عن مادة، وحدة، أو طالب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 bg-white border-2 border-slate-100 rounded-xl focus:border-amber-400 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all shadow-sm"
            />
          </div>
          
          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            {isLoadingRooms && rooms.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-slate-400">
                <svg className="animate-spin h-8 w-8 text-amber-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="font-medium">جاري تحميل الاستفسارات...</span>
              </div>
            ) : getFilteredRooms().length === 0 ? (
              <div className="text-center p-8 text-slate-400 font-medium">لا توجد غرف أو استفسارات متطابقة.</div>
            ) : (
              getFilteredRooms().map((room, idx) => {
                const isSelected = selectedRoom?.type === room.type && selectedRoom?.unit_num === room.unit_num;
                return (
                  <div
                    key={`${room.type}_${room.unit_num}_${idx}`}
                    onClick={() => setSelectedRoom(room)}
                    className={`p-4 rounded-2xl cursor-pointer transition-all ${
                      isSelected 
                        ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10 transform scale-[1.02]' 
                        : 'bg-white hover:bg-slate-50 border border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className={`font-bold text-sm ${isSelected ? 'text-amber-400' : 'text-slate-800'}`}>
                        {room.resolved_type || room.type}: {room.resolved_unit || room.unit_num}
                      </h3>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${isSelected ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-500'}`}>
                        {room.total_messages} رسالة
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${isSelected ? 'bg-amber-500 text-slate-900' : 'bg-slate-200 text-slate-600'}`}>
                        {room.last_sender?.charAt(0) || '?'}
                      </div>
                      <p className={`text-xs truncate flex-1 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                        <span className="font-bold">{room.last_sender}:</span> {room.last_message || 'لا يوجد نص'}
                      </p>
                    </div>
                    <div className={`text-[10px] mt-2 text-left ${isSelected ? 'text-slate-500' : 'text-slate-400'}`}>
                      {formatDate(room.last_updated)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col overflow-hidden relative">
          {selectedRoom ? (
            <>
              {/* Chat Header */}
              <div className="h-20 border-b border-slate-100 bg-white/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 border border-amber-100 shadow-inner">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332-.477-4.5-1.253" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">
                      غرفة: {selectedRoom.resolved_type || selectedRoom.type}
                    </h2>
                    <p className="text-slate-500 text-sm font-medium">القسم: {selectedRoom.resolved_unit || selectedRoom.unit_num}</p>
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 relative custom-scrollbar">
                {isLoadingMessages && messages.length === 0 ? (
                  <div className="flex justify-center items-center h-full text-slate-400">جاري جلب المحادثة...</div>
                ) : messages.length === 0 ? (
                  <div className="flex justify-center items-center h-full text-slate-400">لا توجد رسائل سابقة.</div>
                ) : (
                  messages.map((msg, index) => {
                    const isAdmin = msg.sender === 'admin';
                    const isReplyMsg = msg.is_reply === 1 && msg.replied_message;
                    
                    return (
                      <div key={msg.id || index} className={`flex w-full ${isAdmin ? 'justify-start' : 'justify-end'}`}>
                        <div className={`flex flex-col max-w-[80%] lg:max-w-[70%] ${isAdmin ? 'items-start' : 'items-end'}`}>
                          
                          {/* اسم المرسل */}
                          <span className="text-xs font-bold text-slate-400 mb-1 px-1">
                            {isAdmin ? 'الإدارة' : (msg.user_name || `طالب (${msg.sender})`)}
                          </span>

                          <div 
                            className={`relative px-5 py-3.5 rounded-2xl shadow-sm ${
                              isAdmin 
                                ? 'bg-amber-500 text-slate-900 rounded-tr-none' 
                                : 'bg-slate-800 text-white rounded-tl-none'
                            }`}
                          >
                            {/* إذا كانت رداً على رسالة سابقة، نظهرها فوق النص الأساسي كإشارة */}
                            {isReplyMsg && (
                              <div className={`mb-2 pl-3 border-l-2 ${isAdmin ? 'border-slate-900/30 text-slate-800' : 'border-slate-400/30 text-slate-300'} text-xs font-medium bg-black/5 p-2 rounded-lg`}>
                                <span className="font-bold opacity-70">رداً على:</span> {msg.replied_message}
                              </div>
                            )}
                            
                            <p className="leading-relaxed text-sm md:text-base font-medium whitespace-pre-wrap">{msg.text1}</p>
                          </div>
                          
                          <span className="text-[10px] text-slate-400 mt-1.5 px-1 font-medium">{formatDate(msg.created_at)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-4 bg-white border-t border-slate-100 z-10 shrink-0">
                <div className="relative flex items-end gap-3">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply();
                      }
                    }}
                    placeholder={`اكتب ردك للطلاب في ${selectedRoom.resolved_type || selectedRoom.type} / ${selectedRoom.resolved_unit || selectedRoom.unit_num}...`}
                    className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 focus:bg-white focus:border-amber-400 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all resize-none min-h-[60px] max-h-[150px] shadow-sm text-slate-700"
                    rows={1}
                  />
                  <button
                    onClick={handleSendReply}
                    disabled={isSending || !replyText.trim()}
                    className="bg-slate-900 text-amber-400 hover:bg-slate-800 p-4 rounded-2xl transition-all shadow-lg shadow-slate-900/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center h-[56px] w-[56px]"
                  >
                    {isSending ? (
                      <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transform rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="text-center mt-2">
                  <span className="text-[10px] text-slate-400">اضغط Enter للإرسال المباشر، أو Shift+Enter لسطر جديد</span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50/50 h-full">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-700 mb-2">غرفة الردود للمادة والوحدة</h2>
              <p className="max-w-md mx-auto text-slate-500">اختر إحدى الدردشات من القائمة الجانبية لعرض استفسارات الطلاب والتجاوب معها مباشرةً.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
