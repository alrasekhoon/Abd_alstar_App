

'use client';

import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';

type ChatListItem = {
  user_id: number;
  user_name: string;
  user_phone: string;
  first_name: string;
  last_name: string;
  last_message: string;
  last_message_time: string;
  last_sender: string;
  unread_count: number;
};

type ChatMessage = {
  id: number;
  user_id: number;
  sender_type: 'user' | 'admin';
  message_text: string;
  is_read: number;
  created_at: string;
};

export default function SupportChatManagement() {
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedUser, setSelectedUser] = useState<ChatListItem | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ChatListItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // جلب قائمة المحادثات
  const fetchChats = async () => {
    try {
      const response = await fetch('/api/proxy/cp_chat_list.php');
      const data = await response.json();
      if (data.success && data.chats) {
        setChats(data.chats);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    }
  };

  // جلب الرسائل الخاصة بمستخدم معين
  const fetchMessages = async (userId: number) => {
    try {
      const response = await fetch(`/api/proxy/chat_get_messages.php?user_id=${userId}&mark_read=1&reader=admin`);
      const data = await response.json();
      if (data.success && data.messages) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // إرسال رسالة
  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedUser) return;

    setIsSending(true);
    const textToSend = messageInput;
    setMessageInput('');

    // إضافة اللحظية (Optimistic UI)
    const optimisticMessage: ChatMessage = {
      id: Date.now(),
      user_id: selectedUser.user_id,
      sender_type: 'admin',
      message_text: textToSend,
      is_read: 0,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimisticMessage]);
    scrollToBottom();

    try {
      const response = await fetch('/api/proxy/chat_send.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedUser.user_id,
          sender_type: 'admin',
          message_text: textToSend
        })
      });

      const data = await response.json();
      if (!data.success) {
        alert('حدث خطأ أثناء إرسال الرسالة');
        // في حال الفشل يمكننا حذف الرسالة من القائمة
      } else {
        fetchMessages(selectedUser.user_id);
        fetchChats();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('حدث خطأ في الاتصال');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // بحث عن مستخدم
  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim().length === 0) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/proxy/cp_chat_search_users.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: query })
      });
      const data = await response.json();
      if (data.success && data.users) {
        setSearchResults(data.users.map((u: any) => ({
          ...u,
          last_message: 'محادثة جديدة',
          last_message_time: new Date().toISOString(),
          last_sender: '',
          unread_count: 0
        })));
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // عند اختيار مستخدم من البحث
  const handleSelectSearchedUser = (user: ChatListItem) => {
    // تبديل الواجهة لإنهاء البحث
    setSearchQuery('');
    setSearchResults([]);
    
    // هل المستخدم موجود مسبقاً في القائمة؟
    const exists = chats.find(c => c.user_id === user.user_id);
    if (!exists) {
      setChats([user, ...chats]);
    }
    setSelectedUser(user);
  };

  // الاستماع لاختيار مستخدم
  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser.user_id);
      
      // بمجرد اختيار المستخدم، نصفر عداد القراءة له محلياً لتحديث الـ UIทันที
      setChats(prevChats => prevChats.map(c => 
        c.user_id === selectedUser.user_id ? { ...c, unread_count: 0 } : c
      ));
    } else {
      setMessages([]);
    }
  }, [selectedUser]);

  // التمرير التلقائي عند وصول رسالة جديدة
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Polling كل 5 ثواني لتحديث المحادثات والرسائل
  useEffect(() => {
    fetchChats();
    const intervalId = setInterval(() => {
      fetchChats();
      if (selectedUser) {
        // نحدث الرسائل في الخلفية بدون إعادة تعيين الـ loading
        fetchMessages(selectedUser.user_id);
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [selectedUser]); // نضيف selectedUser كمراقب ليقرأ منه الرسائل إذا تغير

  return (
    <div className="min-h-screen bg-gray-100 p-2 md:p-4 font-sans" dir="rtl">
      <Head>
        <title>الدردشة المباشرة مع الطلاب</title>
      </Head>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex h-[calc(100vh-120px)]">
        
        {/* قائمة المحادثات (Sidebar) */}
        <div className="w-1/3 min-w-[260px] bg-gray-50 border-l border-gray-100 flex flex-col h-full">
  <div className="p-4 border-b border-gray-100 bg-blue-50 flex flex-col space-y-3">
    <h2 className="text-lg font-extrabold text-blue-900">المحادثات</h2>
            
            {/* مربع البحث */}
            <div className="relative">
              <input 
                type="text" 
                value={searchQuery}
                onChange={handleSearch}
                placeholder="ابحث عن مستخدم بالاسم أو الرقم لتنشاء محادثة..." 
                className="w-full px-4 py-2.5 pr-10 bg-white border border-gray-200 rounded-xl shadow-sm text-gray-700 placeholder-gray-400 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#c4a900]/40 focus:border-[#c4a900]"
              />
            <svg className="w-5 h-5 absolute right-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            {isSearching && (
               <span className="absolute left-3 top-2.5 w-5 h-5 border-2 border-white border-t-blue-500 rounded-full animate-spin"></span>
            )}
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {searchQuery.trim().length > 0 ? (
            /* نتائج البحث */
            searchResults.length === 0 && !isSearching ? (
               <p className="text-gray-500 text-center p-6">لا توجد نتائج بحث</p>
            ) : (
              searchResults.map((chat) => (
                <div 
                  key={`search-${chat.user_id}`}
                  onClick={() => handleSelectSearchedUser(chat)}
                  className="p-4 border-b border-gray-100 cursor-pointer transition-colors duration-200 hover:bg-green-50 flex justify-between items-center"
                >
                  <div className="flex flex-col">
                    <h3 className="font-semibold text-green-800 text-lg">
                      {chat.first_name || chat.last_name ? `${chat.first_name || ''} ${chat.last_name || ''}` : chat.user_name || 'مستخدم غير معروف'}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">{chat.user_phone}</p>
                    <p className="text-xs text-green-600 mt-1 font-bold">+ بدء محادثة جديدة</p>
                  </div>
                </div>
              ))
            )
          ) : (
            /* القائمة العادية */
            chats.length === 0 ? (
              <p className="text-gray-500 text-center p-6">لا توجد محادثات حالياً</p>
            ) : (
              chats.map((chat) => (
              <div 
                key={chat.user_id}
                onClick={() => setSelectedUser(chat)}
                className={`p-4 border-b border-gray-100 cursor-pointer transition-colors duration-200 flex justify-between items-center ${
  selectedUser?.user_id === chat.user_id
    ? 'bg-blue-50 border-r-4 border-[#c4a900]'
    : 'hover:bg-gray-100'
}`}
              >
                <div className="flex flex-col overflow-hidden">
                  <h3 className="font-semibold text-gray-800 text-lg">
                    {chat.first_name || chat.last_name ? `${chat.first_name || ''} ${chat.last_name || ''}` : chat.user_name || 'مستخدم غير معروف'}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">{chat.user_phone}</p>
                  <p className={`text-sm mt-2 truncate ${chat.unread_count > 0 ? 'font-bold text-gray-900' : 'text-gray-500'}`}>
                    <span className="text-blue-500">{chat.last_sender === 'admin' ? 'أنت: ' : ''}</span>
                    {chat.last_message}
                  </p>
                </div>
                <div className="flex flex-col items-end justify-between h-full space-y-2">
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {new Date(chat.last_message_time).toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}
                  </span>
                  {chat.unread_count > 0 && Number(chat.unread_count) !== 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 flex items-center justify-center rounded-full min-w-[24px]">
                      {chat.unread_count}
                    </span>
                  )}
                </div>
              </div>
            ))
          )
        )}
        </div>
      </div>

      {/* منطقة الدردشة (Main Chat Area) */}
      <div className="flex-1 flex flex-col bg-gray-50 h-full relative">
        {selectedUser ? (
          <>
            {/* رأس الدردشة */}
            <div className="p-4 bg-white border-b border-gray-100 flex items-center shadow-sm">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700 font-extrabold ml-3">
                {selectedUser.first_name?.charAt(0) || selectedUser.user_name?.charAt(0) || '?'}
              </div>
              <div>
                <h2 className="font-bold text-lg text-gray-800">
                  {selectedUser.first_name || selectedUser.last_name ? `${selectedUser.first_name || ''} ${selectedUser.last_name || ''}` : selectedUser.user_name}
                </h2>
                <p className="text-xs text-gray-500">{selectedUser.user_phone}</p>
              </div>
            </div>

            {/* الرسائل */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="flex justify-center items-center h-full">
                  <div className="bg-white/80 px-4 py-2 rounded-lg shadow-sm text-gray-500 text-sm">
                    لا توجد رسائل سابقة. ابدأ المحادثة الآن.
                  </div>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isAdmin = msg.sender_type === 'admin';
                  return (
                    <div key={msg.id || idx} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                      <div 
                        className={`max-w-[70%] rounded-2xl p-3.5 shadow-sm relative text-sm leading-relaxed ${
  isAdmin
    ? 'bg-blue-600 text-white rounded-tl-sm'
    : 'bg-white text-gray-800 border border-gray-100 rounded-tr-sm'
}`}
                      >
                        <p className="text-md mb-3 pr-2 pl-6">{msg.message_text}</p>
                        <div className={`text-[10px] flex items-center justify-end mt-1 ${isAdmin ? 'text-blue-200' : 'text-gray-400'}`}>
                          <span>{new Date(msg.created_at).toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}</span>
                          {isAdmin && (
                            <span className="ml-1 flex items-center">
                              {msg.is_read == 1 ? (
                                <svg viewBox="0 0 18 18" width="16" height="16" className="text-blue-500 fill-current"><path d="M17.394 5.035l-.57-.442c-.418-.323-.984-.24-1.312.185L10.32 11.45 7.491 8.62c-.426-.426-1.127-.426-1.553 0l-.527.527c-.426.426-.426 1.127 0 1.553l3.856 3.856c.426.426 1.127.426 1.553 0l5.862-7.514c.328-.425.244-.991-.174-1.315z"></path><path d="M12.394 5.035l-.57-.442c-.418-.323-.984-.24-1.312.185l-5.188 6.671-2.829-2.83c-.426-.426-1.127-.426-1.553 0l-.527.527c-.426.426-.426 1.127 0 1.553l3.856 3.856c.426.426 1.127.426 1.553 0l5.862-7.514c.328-.425.244-.991-.174-1.315z"></path></svg>
                              ) : (
                                <svg viewBox="0 0 18 18" width="16" height="16" className="text-gray-400 fill-current"><path d="M17.394 5.035l-.57-.442c-.418-.323-.984-.24-1.312.185l-5.188 6.671-2.829-2.83c-.426-.426-1.127-.426-1.553 0l-.527.527c-.426.426-.426 1.127 0 1.553l3.856 3.856c.426.426 1.127.426 1.553 0l5.862-7.514c.328-.425.244-.991-.174-1.315z"></path></svg>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* مربع الكتابة */}
            <div className="p-3 bg-white border-t border-gray-100 flex items-end gap-2">
              <textarea
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="اكتب رسالة للرد..."
                className="flex-1 resize-none overflow-hidden rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 outline-none text-gray-800 max-h-32 transition-all focus:outline-none focus:ring-2 focus:ring-[#c4a900]/40 focus:border-[#c4a900] focus:bg-white"
                rows={1}
                style={{ minHeight: '50px' }}
              />
              <button
                onClick={sendMessage}
                disabled={isSending || !messageInput.trim()}
                className={`w-11 h-11 rounded-xl flex justify-center items-center shrink-0 transition-colors shadow-sm ${ isSending ? 'bg-gray-300' : 'bg-blue-600 hover:bg-blue-700' }`} 
              >
                {isSending ? (
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                  </svg>
                )}
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center text-gray-400 bg-gray-50">
            <svg className="w-24 h-24 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
            </svg>
            <p className="text-lg font-bold text-gray-500 mt-3">اختر محادثة للبدء</p>
<p className="text-sm text-gray-400 mt-1">انقر على أي محادثة من القائمة</p> 
          </div>
        )}
      </div>
     </div>
    </div>
  );
}

