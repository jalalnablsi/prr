"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Trash2, Settings } from 'lucide-react';
import { Separator } from "@/components/ui/separator";

const optionSchema = z.object({
  text: z.string().min(1, "نص الخيار مطلوب."),
  imageUrl: z.string().url("يجب أن يكون رابطًا صحيحًا.").optional().or(z.literal('')),
});

const formSchema = z.object({
  type: z.enum(["poll", "challenge", "prediction"]),
  category: z.enum(["sports", "games", "math", "puzzles", "islamic", "tech", "general", "science"]),
  question: z.string().min(10, "يجب أن يتكون السؤال من 10 أحرف على الأقل."),
  options: z.array(optionSchema).min(2, "مطلوب خياران على الأقل."),
  correctOptionId: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
}).refine(data => {
    if (data.type === 'challenge') {
        return !!data.correctOptionId && !!data.difficulty;
    }
    return true;
}, {
    message: "الإجابة الصحيحة ومستوى الصعوبة مطلوبان للاختبارات.",
    path: ["correctOptionId"],
});

type ContentFormValues = z.infer<typeof formSchema>;

const categoryTranslations: Record<ContentFormValues['category'], string> = {
  sports: 'رياضة',
  games: 'ألعاب',
  math: 'رياضيات',
  puzzles: 'ألغاز',
  islamic: 'إسلامية',
  tech: 'تقنية',
  general: 'عام',
  science: 'علوم',
};

const difficultyTranslations: Record<Exclude<ContentFormValues['difficulty'], undefined>, string> = {
  easy: 'سهل',
  medium: 'متوسط',
  hard: 'صعب'
};

export default function AdminPage() {
  const { toast } = useToast();
  const form = useForm<ContentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "poll",
      category: "general",
      question: "",
      options: [{ text: "", imageUrl: "" }, { text: "", imageUrl: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "options",
  });

  const watchType = form.watch("type");
  const watchOptions = form.watch("options");

  const onSubmit = (data: ContentFormValues) => {
    // In a real app, this would send data to the backend.
    console.log("Form Data:", data);
    toast({
      title: "تم إنشاء المحتوى بنجاح!",
      description: "تمت إضافة السؤال أو الاستطلاع الجديد إلى النظام.",
    });
    form.reset();
  };

  return (
    <div className="container mx-auto px-4 py-12" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
            <Settings className="h-10 w-10 text-primary" />
            <div>
                <h1 className="text-3xl font-headline font-bold">لوحة تحكم المسؤول</h1>
                <p className="text-muted-foreground">أنشئ وأدر محتوى التطبيق من هنا.</p>
            </div>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>إنشاء محتوى جديد</CardTitle>
                <CardDescription>املأ النموذج لإنشاء استطلاع، تحدي، أو توقع جديد.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <div className="grid md:grid-cols-2 gap-8">
                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>نوع المحتوى</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="poll">استطلاع</SelectItem>
                                        <SelectItem value="challenge">تحدي/اختبار</SelectItem>
                                        <SelectItem value="prediction">توقع</SelectItem>
                                    </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="category"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>الفئة</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {Object.entries(categoryTranslations).map(([key, value]) => (
                                            <SelectItem key={key} value={key as ContentFormValues['category']}>{value}</SelectItem>
                                        ))}
                                    </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </div>
                        
                        <FormField
                            control={form.control}
                            name="question"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>السؤال</FormLabel>
                                <FormControl>
                                <Textarea placeholder="اطرح سؤالاً جذاباً..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />

                        <Separator />

                        <div>
                            <h3 className="text-lg font-medium mb-4">الخيارات</h3>
                            <div className="space-y-6">
                                {fields.map((field, index) => (
                                <div key={field.id} className="flex items-start gap-4 p-4 border rounded-lg bg-card/50">
                                    <span className="text-primary font-bold pt-2">{index + 1}.</span>
                                    <div className="flex-1 space-y-4">
                                        <FormField
                                            control={form.control}
                                            name={`options.${index}.text`}
                                            render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>نص الخيار</FormLabel>
                                                <FormControl>
                                                <Input placeholder={`نص الخيار ${index + 1}`} {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`options.${index}.imageUrl`}
                                            render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>رابط الصورة (اختياري)</FormLabel>
                                                <FormControl>
                                                <Input placeholder="https://..." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                            )}
                                        />
                                    </div>
                                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 2}>
                                        <Trash2 className="h-5 w-5 text-destructive" />
                                    </Button>
                                </div>
                                ))}
                            </div>
                            <Button type="button" variant="outline" size="sm" onClick={() => append({ text: "", imageUrl: "" })} className="mt-4">
                                <PlusCircle className="ms-2 h-4 w-4" />
                                إضافة خيار
                            </Button>
                        </div>

                        {watchType === 'challenge' && (
                            <>
                                <Separator />
                                <div className="space-y-8">
                                <h3 className="text-lg font-medium">إعدادات الاختبار</h3>
                                <div className="grid md:grid-cols-2 gap-8">
                                <FormField
                                    control={form.control}
                                    name="correctOptionId"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>الإجابة الصحيحة</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="اختر الإجابة الصحيحة" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {watchOptions.map((option, index) => (
                                                option.text ? <SelectItem key={index} value={`${index + 1}`}>{option.text}</SelectItem> : null
                                            ))}
                                        </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            اختر رقم الخيار الصحيح من القائمة أعلاه.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={form.control}
                                    name="difficulty"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>مستوى الصعوبة</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="اختر مستوى الصعوبة" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {Object.entries(difficultyTranslations).map(([key, value]) => (
                                                <SelectItem key={key} value={key as Exclude<ContentFormValues['difficulty'], undefined>}>{value}</SelectItem>
                                            ))}
                                        </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                </div>
                                </div>
                            </>
                        )}
                        
                        <div className="pt-6">
                            <Button type="submit" size="lg" className="w-full md:w-auto">إنشاء المحتوى</Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
