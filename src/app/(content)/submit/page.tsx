"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Image as ImageIcon, PlusCircle, X, Upload } from 'lucide-react';
import Image from 'next/image';

type Option = {
  text: string;
  imageUrl: string;
}

export default function SubmitPage() {
  const { toast } = useToast();
  const [contentType, setContentType] = useState('poll');
  const [options, setOptions] = useState<Option[]>([{ text: '', imageUrl: '' }, { text: '', imageUrl: '' }]);

  const handleAddOption = () => {
    if (options.length < 5) {
      setOptions([...options, { text: '', imageUrl: '' }]);
    }
  };
  
  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = [...options];
      newOptions.splice(index, 1);
      setOptions(newOptions);
    }
  };

  const handleOptionChange = (index: number, field: keyof Option, value: string) => {
    const newOptions = [...options];
    newOptions[index][field] = value;
    setOptions(newOptions);
  };
  
  const handleFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleOptionChange(index, 'imageUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "تم إرسال المحتوى!",
      description: "مشاركتك الآن قيد المراجعة. شكرا لمساهمتك!",
    });
    // Here you would typically send the data to your backend API
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl">إنشاء مشاركة جديدة</CardTitle>
            <CardDescription>شارك استطلاعًا أو تحديًا أو توقعًا مع المجتمع.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">نوع المحتوى</Label>
                <Select onValueChange={setContentType} defaultValue="poll">
                  <SelectTrigger id="type">
                    <SelectValue placeholder="اختر نوع المحتوى" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="poll">استطلاع مجتمعي</SelectItem>
                    <SelectItem value="challenge">تحدي / اختبار</SelectItem>
                    <SelectItem value="prediction">توقع</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">الفئة</Label>
                <Select defaultValue="general">
                  <SelectTrigger id="category">
                    <SelectValue placeholder="اختر فئة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">عام</SelectItem>
                    <SelectItem value="sports">رياضة</SelectItem>
                    <SelectItem value="games">ألعاب</SelectItem>
                    <SelectItem value="math">رياضيات</SelectItem>
                    <SelectItem value="puzzles">ألغاز</SelectItem>
                    <SelectItem value="islamic">أسئلة إسلامية</SelectItem>
                    <SelectItem value="tech">تقنية</SelectItem>
                    <SelectItem value="science">علوم</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="question">السؤال</Label>
              <Textarea id="question" placeholder="مثال: ما هي أفضل لغة برمجة لتطوير الواجهات الأمامية؟" required />
            </div>
            <div className="space-y-4">
              <Label className='text-base font-medium'>الخيارات</Label>
              {options.map((option, index) => (
                <div key={index} className="flex items-start gap-2 p-4 border rounded-lg bg-background">
                  <div className='w-full space-y-3'>
                     <Input 
                        type="text" 
                        placeholder={`الخيار ${index + 1}`}
                        value={option.text}
                        onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                        required 
                      />
                      <div className="space-y-2">
                         <Label className='text-xs text-muted-foreground'>صورة الخيار (اختياري)</Label>
                         <div className="relative">
                            <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                type="text" 
                                placeholder="أو الصق رابط الصورة هنا"
                                value={option.imageUrl}
                                onChange={(e) => handleOptionChange(index, 'imageUrl', e.target.value)}
                                className="pl-10"
                              />
                         </div>
                         <div className='relative'>
                             <Button asChild variant="outline" className='w-full cursor-pointer'>
                                <label>
                                   <Upload className='ms-2' />
                                   رفع صورة من جهازك
                                   <input type="file" className="sr-only" accept="image/*" onChange={(e) => handleFileChange(index, e)} />
                                </label>
                             </Button>
                         </div>
                         {option.imageUrl && (
                            <div className='relative w-full aspect-video mt-2 rounded-md overflow-hidden border'>
                               <Image src={option.imageUrl} alt={`Preview ${index+1}`} fill className="object-cover" />
                            </div>
                         )}
                      </div>
                  </div>
                  {options.length > 2 && (
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveOption(index)} className='shrink-0'>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {options.length < 5 && (
                <Button type="button" variant="outline" size="sm" onClick={handleAddOption}>
                  <PlusCircle className="ms-2 h-4 w-4" />
                  إضافة خيار
                </Button>
              )}
            </div>
             
             {contentType === 'challenge' && (
                <div className="space-y-2">
                    <Label>مستوى الصعوبة</Label>
                     <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر مستوى الصعوبة" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">سهل</SelectItem>
                        <SelectItem value="medium">متوسط</SelectItem>
                        <SelectItem value="hard">صعب</SelectItem>
                      </SelectContent>
                    </Select>
                </div>
             )}


            {contentType === 'prediction' && (
              <div className="space-y-2">
                <Label htmlFor="timeframe">الإطار الزمني للتوقع</Label>
                <Select>
                  <SelectTrigger id="timeframe">
                    <SelectValue placeholder="اختر إطارًا زمنيًا" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">أسبوع واحد</SelectItem>
                    <SelectItem value="month">شهر واحد</SelectItem>
                    <SelectItem value="year">سنة واحدة</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" size="lg">إرسال للمراجعة</Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
