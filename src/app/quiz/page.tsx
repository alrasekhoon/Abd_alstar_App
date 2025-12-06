  'use client';

  import { useState, useEffect, useRef } from 'react';

  interface QuestionOption {
    letter: string;
    text: string;
    isCorrect: boolean;
  }

  interface ExtractedQuestion {
    questionNumber: string;
    questionText: string;
    unit: string;
    page: string;
    importance: string;
    options: QuestionOption[];
    correctAnswer: string;
    error?: string;
    originalText?: string;
  }

  interface Material {
    id: string;
    material_name: string;
    category_id: number;
    category_name?: string;
  }

  interface Category {
    id: number;
    category_name: string;
  }

  interface Question {
    material_id: number;
    unit_num: number;
    page_num: number;
    parent: string;
    q_txt: string;
    a1: string;
    a2: string;
    a3: string;
    a4: string;
    answer: number;
    note: string;
    q_code: string;
    code_q_number: string;
    timer: number;
    importance: number;
  }

  // نص المساعدة مخزن في متغير منفصل
  const HELP_TEXT = {
    example: `01- {1}: أول من نقل استعمال مصطلح الأحوال الشخصية، هو:`,
    explanation: `إجابة السؤال موجود في الوحدة (1) الصفحة رقم (1) أهمية السؤال (1).`,
    points: [
      "1- في المثال السابق سيتم استخراج رمز السؤال من البداية 01- {1}",
      "2- سيتم استخراج نص بين علامتي (\":\") كمثال :نص السؤال:",
      "3- وسيتم استخراج رقم الوحدة والصفحة وأهمية السؤال من السطر الثاني",
      "4- سيتعرف النظام على الجواب الصحيح عن طريق وجود نجمة في النهاية دون فراغ",
      "5- أهمية السؤال تكون 0 (غير مهم) أو 1 (هام)"

    ]
  };

  export default function MultiQuestionExtractor() {
    const [inputText, setInputText] = useState<string>('');
    const [questions, setQuestions] = useState<ExtractedQuestion[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [selectedMaterial, setSelectedMaterial] = useState<string>('');
    const [timer, setTimer] = useState<string>('');
    const [materials, setMaterials] = useState<Material[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoadingMaterials, setIsLoadingMaterials] = useState<boolean>(true);
    const [selectedYear, setSelectedYear] = useState<string>('1');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [filterType, setFilterType] = useState<string>('all');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // جلب الفئات من الخادم
    useEffect(() => {
      const fetchCategories = async () => {
        try {
          const response = await fetch('/api/proxy/cp_ashtrak.php');
          if (!response.ok) throw new Error('فشل جلب الفئات');
          const data = await response.json();
          setCategories(data);
        } catch (error) {
          console.error('حدث خطأ أثناء جلب الفئات:', error);
        }
      };

      fetchCategories();
    }, []);

    // جلب المواد من الخادم عند تغيير السنة أو الفئة
    useEffect(() => {
      const fetchMaterials = async () => {
        try {
          setIsLoadingMaterials(true);
          setMaterials([]);
          setSelectedMaterial('');

          const response = await fetch(`/api/proxy/get_material.php?year1=${selectedYear}`);
          
          if (!response.ok) {
            throw new Error('فشل جلب البيانات من الخادم');
          }

          const data = await response.json();
          
          if (data && data.length > 0 && !data.message) {
            // إضافة أسماء الفئات للمواد
            const materialsWithCategories = data.map((material: Material) => ({
              ...material,
              category_name: categories.find(cat => cat.id === material.category_id)?.category_name || 'غير معروف'
            }));
            
            setMaterials(materialsWithCategories);
          }
        } catch (error) {
          console.error('حدث خطأ أثناء جلب المواد:', error);
        } finally {
          setIsLoadingMaterials(false);
        }
      };

      fetchMaterials();
    }, [selectedYear, categories]);

    // تصفية المواد حسب الفئة المختارة
    const filteredMaterials = selectedCategory === 'all' 
      ? materials 
      : materials.filter(material => material.category_id.toString() === selectedCategory);

    // تصفية الأسئلة المعروضة حسب النوع المختار
    const filteredQuestions = questions.filter(question => {
      if (filterType === 'invalid') {
        return question.error;
      } else if (filterType === 'valid') {
        return !question.error;
      }
      return true;
    });

    const extractAllQuestions = (): ExtractedQuestion[] => {
      const extractedQuestions: ExtractedQuestion[] = [];
      
      if (!inputText.trim()) return extractedQuestions;

      const questionBlocks = inputText.split(/(?=\d{2}- \{\d+\}:)/g);
      
      questionBlocks.forEach((block, index) => {
        if (!block.trim()) return;
        
        try {
          const questionNumberMatch = block.match(/^(\d{2})- \{(\d+)\}:/);
          if (!questionNumberMatch) {
            throw new Error('تنسيق رقم السؤال غير صحيح');
          }
          const questionNumber = `${questionNumberMatch[2]}/${questionNumberMatch[1]}`;

          const questionTextParts = block.split(/^.*?:\s*/)[1]?.split(/\n\s*(?:الوحدة|إجابة|أ-|ب-|ج-|د-|A-|B-|C-|D-)/)[0];
          const questionText = questionTextParts?.trim() || '';

          const unitPageMatch = block.match(/الوحدة\s*\((.*?)\)\s*الصفحة\s*رقم\s*\((\d+)\)\s*أهمية السؤال\s*\((\d+)\)/);
          const unit = unitPageMatch?.[1]?.trim() || 'غير معروف';
          if (unit == "غير معروف"){
            throw new Error('لم يتم العثور على رقم الوحدة، تأكد من وجوده في التنسيق الصحيح');
          }
          const page = unitPageMatch?.[2]?.trim() || 'غير معروف';
          if (page == "غير معروف"){
            throw new Error('لم يتم العثور على رقم الصفحة تأكد من وجوده في التنسيق الصحيح');
          }
          const importance = unitPageMatch?.[3]?.trim() || '0';

          const optionsSection = block.split(/(?:الوحدة|إجابة).*?(?:[أ-د]-|[A-D]-)/).pop() || '';
          const optionsMatch = optionsSection.match(/(?:[أ-د]|[A-D])-\s*[\s\S]*?(?:\.\*|\.)(?=\s*(?:[أ-د]-|[A-D]-|$))/g) || [];
          
          if (optionsMatch.length < 2) {
            throw new Error('يجب أن يحتوي السؤال على خيارين على الأقل');
          }

          const options: QuestionOption[] = optionsMatch.map(opt => {
            const isCorrect = opt.trim().endsWith('.*');
            const cleanText = opt.replace(/^([أ-د]|[A-D])-\s*/, '').replace(/\.\*?$/, '').trim();
            const letter = opt.charAt(0);

            return {
              letter,
              text: cleanText,
              isCorrect
            };
          });

          if (!options.some(opt => opt.isCorrect)) {
            throw new Error('لم يتم تحديد إجابة صحيحة (يجب أن ينتهي أحد الخيارات بـ .*)');
          }

          const correctAnswerOption = options.find(opt => opt.isCorrect);
          const correctAnswer = correctAnswerOption 
            ? `${correctAnswerOption.letter}- ${correctAnswerOption.text}`
            : '';

          extractedQuestions.push({
            questionNumber,
            questionText,
            unit,
            page,
            importance,
            options,
            correctAnswer,
            originalText: block.trim()
          });

        } catch (error) {
          extractedQuestions.push({
            questionNumber: `سؤال ${index + 1}`,
            questionText: block.split('\n')[0]?.substring(0, 100) + (block.length > 100 ? '...' : ''),
            unit: '--',
            page: '--',
            importance: '1',
            options: [],
            correctAnswer: '',
            error: error instanceof Error ? error.message : 'خطأ غير معروف',
            originalText: block.trim()
          });
        }
      });

      setQuestions(extractedQuestions);
      return extractedQuestions;
    };

    const scrollToInvalidQuestion = (question: ExtractedQuestion) => {
      if (!question.originalText || !textareaRef.current) return;

      const textarea = textareaRef.current;
      const questionText = question.originalText;
      const startIndex = inputText.indexOf(questionText);
      
      if (startIndex !== -1) {
        textarea.focus();
        textarea.setSelectionRange(startIndex, startIndex + questionText.length);
        
        const lineHeight = parseInt(getComputedStyle(textarea).lineHeight);
        const linesBefore = (inputText.substring(0, startIndex).match(/\n/g) || []).length;
        textarea.scrollTop = linesBefore * lineHeight;
      }
    };

    const hasInvalidQuestions = () => {
      return questions.some(q => q.error);
    };

    const extractAndUploadQuestions = async () => {
      if (hasInvalidQuestions()) {
        alert('لا يمكن رفع الأسئلة لأن هناك أسئلة غير صالحة. يرجى تصحيحها أولاً.');
        return { success: false, error: 'يوجد أسئلة غير صالحة' };
      }

      setIsLoading(true);
      try {
        const extractedQuestions = extractAllQuestions();
        const validQuestions = extractedQuestions.filter(q => !q.error);
        
        if (validQuestions.length === 0) {
          throw new Error('لا توجد أسئلة صالحة للرفع');
        }

        if (!selectedMaterial || !timer) {
          throw new Error('يجب اختيار المادة وإدخال الوقت');
        }

        const questionsToUpload = convertToTquizFormat(validQuestions, selectedMaterial, timer);
        await uploadQuestions(questionsToUpload); 
        
        const verification = await verifyQuestionsOnServer(questionsToUpload[0].material_id, questionsToUpload[0].unit_num);
        
        if (verification.length === 0) {
          throw new Error('الأسئلة لم تظهر في الخادم بعد الرفع');
        }

        alert(`تم رفع ${questionsToUpload.length} سؤال بنجاح وتأكيد حفظها`);
        setInputText('');
        setQuestions([]);
        setTimer('');
        return { success: true, data: verification };
      } catch (error) {
        console.error('Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
        alert(`فشل في الرفع: ${errorMessage}`);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    };

    const verifyQuestionsOnServer = async (materialId: number, unitNum: number) => {
      try {
        const response = await fetch(
          `/api/proxy/cp_multi_quiz.php?material_id=${materialId}&unit_num=${unitNum}`
        );
        return await response.json();
      } catch (error) {
        console.error('Verification failed:', error);
        return [];
      }
    };

    const convertToTquizFormat = (
      questions: ExtractedQuestion[],
      materialId: string,
      timerValue: string
    ): Question[] => {
      return questions.map((q) => {
        const unitNumMatch = q.unit.match(/\d+/);
        const unitNum = unitNumMatch ? parseInt(unitNumMatch[0]) : 1;
        const pageNum = parseInt(q.page) || 1;
        const importance = parseInt(q.importance) === 1 ? 1 : 0;
        const correctOption = q.options.find(opt => opt.isCorrect);
        const answerMap: Record<string, number> = {
          'أ': 1, 'ب': 2, 'ج': 3, 'د': 4,
          'A': 1, 'B': 2, 'C': 3, 'D': 4
        };
        const answer = correctOption ? answerMap[correctOption.letter] || 1 : 1;

        const questionCodeParts = q.questionNumber.split('/');
        const q_code = questionCodeParts[0] || `gen-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const code_q_number = questionCodeParts[1] || '';

        const options = q.options || [];
        const isEnglish = options.length > 0 && ['A', 'B', 'C', 'D'].includes(options[0].letter.toUpperCase());
        const defaultOptions = isEnglish ? ['A', 'B', 'C', 'D'] : ['أ', 'ب', 'ج', 'د'];
        
        const allOptions = defaultOptions.map((letter, index) => ({
          letter,
          text: options[index] ? `${letter}- ${options[index].text}` : `${letter}- `,
          isCorrect: options[index]?.isCorrect || false
        }));

        return {
          material_id: parseInt(materialId) || 0,
          unit_num: unitNum,
          page_num: pageNum,
          parent: '',
          q_txt: q.questionText.trim(),
          a1: allOptions[0].text,
          a2: allOptions[1].text,
          a3: allOptions[2].text,
          a4: allOptions[3].text,
          answer: answer,
          note: q.error || '',
          q_code: q_code,
          code_q_number: code_q_number,
          timer: parseInt(timerValue) || 30,
          importance: importance
        };
      });
    };

    const uploadQuestions = async (questions: Question[]) => {
      setIsLoading(true);
      try {
        console.log('Sending data:', JSON.stringify(questions, null, 2));

        const response = await fetch('/api/proxy/cp_multi_quiz.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(questions),
        });

        const responseText = await response.text();
        console.log('Raw response:', responseText);

        if (!responseText.trim().startsWith('{') && !responseText.trim().startsWith('[')) {
          if (response.ok) {
            const verifyResponse = await fetch(`/api/proxy/cp_multi_quiz.php?material_id=${questions[0].material_id}&unit_num=${questions[0].unit_num}`);
            const verifiedData = await verifyResponse.json();
            
            if (verifiedData.length > 0) {
              return { success: true, message: 'تم رفع الأسئلة بنجاح' };
            }
          }
          throw new Error('الخادم لم يعيد تأكيد الحفظ');
        }

        let result;
        try {
          result = JSON.parse(responseText);
        } catch (e) {
          console.error('JSON parse error:', e);
          throw new Error('استجابة غير متوقعة من الخادم');
        }

        if (!result.success) {
          throw new Error(result.message || 'فشل في الحفظ');
        }

        return result;
      } catch (error) {
        console.error('Upload failed:', error);
        throw new Error(typeof error === 'string' ? error : 
                  error instanceof Error ? error.message : 
                  'فشل في رفع الأسئلة');
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center mb-6">
          <h1 className="text-2xl font-bold text-center">أداة استخراج الأسئلة</h1>
          
          <div className="relative ml-2 group">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 text-gray-500 hover:text-gray-700 cursor-pointer" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
            <div className="absolute hidden group-hover:block z-10 w-100 p-2 text-sm text-white bg-gray-800 rounded shadow-lg right-0">
              <div className="bg-gray-800 p-4 rounded-lg text-right font-arabic my-4 whitespace-pre-line border border-gray-300">
                <p className="">{HELP_TEXT.example}</p>
                <p className="mb-2 text-gray-300">{HELP_TEXT.explanation}</p>
                <ul className="list-disc pr-5 space-y-1">
                  <li>أ- علي الطنطاوي.</li>
                  <li className="text-green-600">ب- محمد قدري باشا.*</li>
                  <li>ج- محمد القرضاوي.</li>
                  <li>د- ابن القيم الجوزي.</li>
                </ul>

                <p>************************************</p>
                {HELP_TEXT.points.map((point, index) => (
                  <p key={index}>{point}</p>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* نظام الفلترة المحدث */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">

          <div>
            <label className="block text-lg font-medium mb-2">
              اختر الفئة:
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg"
            >
              <option value="all">جميع الفئات</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.category_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-lg font-medium mb-2">
              اختر السنة:
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg"
            >
              <option value="1">السنة الأولى</option>
              <option value="2">السنة الثانية</option>
              <option value="3">السنة الثالثة</option>
              <option value="4">السنة الرابعة</option>
            </select>
          </div>
          
          <div>
            <label className="block text-lg font-medium mb-2">
              اختر المادة:
            </label>
            {isLoadingMaterials ? (
              <div className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 animate-pulse">
                جاري تحميل المواد...
              </div>
            ) : (
              <select
                value={selectedMaterial}
                onChange={(e) => setSelectedMaterial(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg"
                disabled={filteredMaterials.length === 0}
              >
                <option value="">-- اختر المادة --</option>
                {filteredMaterials.map((material) => (
                  <option key={material.id} value={material.id}>
                    {material.material_name}
                  </option>
                ))}
              </select>
            )}
          </div>
          
          <div>
            <label className="block text-lg font-medium mb-2">
              المؤقت (بالثواني):
            </label>
            <input
              type="number"
              value={timer}
              onChange={(e) => setTimer(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg"
              placeholder="أدخل الزمن بالثانية"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-lg font-medium mb-2">
            أدخل نصوص الأسئلة (يمكن إدخال عدة أسئلة):
          </label>
          <textarea
            ref={textareaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg"
            rows={10}
            placeholder="الصق نصوص الأسئلة هنا، كل سؤال في سطر أو أكثر..."
          />
        </div>
        
        <div className="flex gap-4 mb-8">
          <button
            onClick={extractAllQuestions}
            disabled={!inputText.trim() || isLoading}
            className={`flex-1 py-3 px-4 rounded-lg font-medium text-white ${
              !inputText.trim() || isLoading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLoading ? 'جاري معالجة الأسئلة...' : 'استخراج الأسئلة'}
          </button>

          <button
            onClick={extractAndUploadQuestions}
            disabled={questions.length === 0 || isLoading || !selectedMaterial || !timer || hasInvalidQuestions()}
            className={`flex-1 py-3 px-4 rounded-lg font-medium text-white ${
              questions.length === 0 || isLoading || !selectedMaterial || !timer || hasInvalidQuestions()
                ? 'bg-gray-400' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isLoading ? 'جاري رفع الأسئلة...' : 'رفع الأسئلة'}
          </button>
        </div>

        {questions.length > 0 && (
          <div className="overflow-x-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">النتائج</h2>
              
              {/* زر فلترة الجدول */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    filterType === 'all' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  عرض الكل ({questions.length})
                </button>
                <button
                  onClick={() => setFilterType('valid')}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    filterType === 'valid' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  الأسئلة الصالحة ({questions.filter(q => !q.error).length})
                </button>
                <button
                  onClick={() => setFilterType('invalid')}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    filterType === 'invalid' 
                      ? 'bg-red-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  الأسئلة المعطوبة ({questions.filter(q => q.error).length})
                </button>
              </div>
            </div>
            
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 border-b">رقم السؤال</th>
                  <th className="py-2 px-4 border-b">نص السؤال</th>
                  <th className="py-2 px-4 border-b">الوحدة</th>
                  <th className="py-2 px-4 border-b">الصفحة</th>
                  <th className="py-2 px-4 border-b">الأهمية</th>
                  <th className="py-2 px-4 border-b">الإجابة الصحيحة</th>
                  <th className="py-2 px-4 border-b">الحالة</th>
                  <th className="py-2 px-4 border-b">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuestions.map((q, index) => (
                  <tr 
                    key={index} 
                    className={q.error ? 'bg-red-50' : index % 2 === 0 ? 'bg-gray-50' : ''}
                  >
                    <td className="py-2 px-4 border-b">{q.questionNumber}</td>
                    <td className="py-2 px-4 border-b max-w-xs truncate">{q.questionText}</td>
                    <td className="py-2 px-4 border-b">{q.unit}</td>
                    <td className="py-2 px-4 border-b">{q.page}</td>
                    <td className="py-2 px-4 border-b">{q.importance}</td>
                    <td className="py-2 px-4 border-b">{q.correctAnswer}</td>
                    <td className="py-2 px-4 border-b">
                      {q.error ? (
                        <span className="text-red-600">✗ {q.error}</span>
                      ) : (
                        <span className="text-green-600">✓ صالح</span>
                      )}
                    </td>
                    <td className="py-2 px-4 border-b">
                      {q.error && (
                        <button
                          onClick={() => scrollToInvalidQuestion(q)}
                          className="bg-blue-500 hover:bg-blue-700 text-white py-1 px-3 rounded text-sm"
                        >
                          التمرير للتحرير
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {hasInvalidQuestions() && (
              <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                <p className="font-semibold">تحذير: هناك أسئلة غير صالحة</p>
                <p>يجب تصحيح جميع الأسئلة غير الصالحة قبل إمكانية رفع الأسئلة.</p>
                <p>يمكنك استخدام زر التمرير للتحرير للانتقال مباشرة إلى السؤال غير الصالح في مربع النص.</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }