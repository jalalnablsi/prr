'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import { Eye, EyeOff, Users, RefreshCw, Fingerprint } from 'lucide-react';
import { cn } from '@/lib/utils';

const gameTopics = PlaceHolderImages.filter(img => img.imageHint === 'stranger_game');

export default function StrangerGamePage() {
    const [gameState, setGameState] = useState<'setup' | 'reveal' | 'discuss' | 'end'>('setup');
    const [numPlayers, setNumPlayers] = useState(4);
    const [currentPlayer, setCurrentPlayer] = useState(1);
    
    const [stranger, setStranger] = useState<number | null>(null);
    const [topic, setTopic] = useState<{ imageUrl: string; description: string } | null>(null);
    const [isRoleVisible, setIsRoleVisible] = useState(false);

    const handleStartGame = () => {
        setStranger(Math.floor(Math.random() * numPlayers) + 1);
        const randomTopic = gameTopics[Math.floor(Math.random() * gameTopics.length)];
        setTopic({
            imageUrl: randomTopic.imageUrl,
            description: randomTopic.description
        });
        setGameState('reveal');
        setCurrentPlayer(1);
        setIsRoleVisible(false);
    };

    const handleNextPlayer = () => {
        if (currentPlayer < numPlayers) {
            setCurrentPlayer(p => p + 1);
            setIsRoleVisible(false);
        } else {
            setGameState('discuss');
        }
    };
    
    const handleReset = () => {
        setGameState('setup');
        setNumPlayers(4);
        setCurrentPlayer(1);
        setStranger(null);
        setTopic(null);
        setIsRoleVisible(false);
    };

    if (gameState === 'setup') {
        return (
            <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[70vh]">
                <Card className="max-w-md w-full">
                    <CardHeader className="text-center">
                        <Fingerprint className="h-16 w-16 text-primary mx-auto mb-4" />
                        <CardTitle className="text-3xl font-headline">لعبة: هناك غريب بيننا</CardTitle>
                        <CardDescription className="text-lg pt-2">لعبة استنتاج اجتماعي لاكتشاف اللاعب الغريب. اجمع أصدقاءك وابدأ اللعب!</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8 pt-6">
                        <div className="space-y-4">
                            <Label htmlFor="players" className="flex items-center justify-center text-center text-lg font-medium">
                                <Users className="ms-2" />
                                <span>عدد اللاعبين:</span>
                                <span className="font-bold text-primary text-xl mx-2">{numPlayers}</span>
                            </Label>
                            <Slider
                                id="players"
                                min={4}
                                max={10}
                                step={1}
                                value={[numPlayers]}
                                onValueChange={(value) => setNumPlayers(value[0])}
                            />
                        </div>
                         <Button size="lg" className="w-full" onClick={handleStartGame}>
                            ابدأ اللعبة
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    if (gameState === 'reveal') {
        const isCurrentPlayerStranger = currentPlayer === stranger;
        return (
            <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[70vh]">
                <Card className="max-w-md w-full text-center">
                    <CardHeader>
                        <CardTitle className="text-3xl font-headline">دور اللاعب رقم {currentPlayer}</CardTitle>
                        <CardDescription className="text-lg pt-2">
                          {isRoleVisible ? 'احفظ دورك جيداً!' : 'مرر الهاتف للاعب الحالي واطلب منه الضغط على الزر.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {isRoleVisible ? (
                            <div className="p-6 bg-card/80 rounded-lg border-2 border-dashed space-y-4 animate-in fade-in-50">
                                {isCurrentPlayerStranger ? (
                                    <>
                                        <h3 className="text-2xl font-bold text-destructive">أنت الغريب!</h3>
                                        <p className="text-muted-foreground">مهمتك هي التظاهر بمعرفة الموضوع السري من خلال حديث اللاعبين الآخرين. لا تدعهم يكشفونك!</p>
                                    </>
                                ) : (
                                    <>
                                        <h3 className="text-2xl font-bold text-primary">أنت لست الغريب</h3>
                                        <p className="text-muted-foreground">الكلمة السرية هي:</p>
                                        <p className="text-3xl font-bold font-headline">{topic?.description}</p>
                                        <div className="relative w-full aspect-video rounded-md overflow-hidden border">
                                            {topic?.imageUrl && <Image src={topic.imageUrl} alt={topic.description} fill className="object-cover" />}
                                        </div>
                                    </>
                                )}
                                <Button size="lg" className="w-full" onClick={handleNextPlayer}>
                                    فهمت، مرر الهاتف للاعب التالي
                                </Button>
                            </div>
                        ) : (
                             <Button size="lg" className="w-full" onClick={() => setIsRoleVisible(true)}>
                                <Eye className="ms-2" />
                                اضغط هنا لمعرفة دورك
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (gameState === 'discuss') {
        return (
             <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[70vh]">
                <Card className="max-w-md w-full text-center">
                    <CardHeader>
                        <CardTitle className="text-3xl font-headline">ابدأوا النقاش!</CardTitle>
                        <CardDescription className="text-lg pt-2">
                           الآن بعد أن عرف كل شخص دوره، ابدأوا في طرح أسئلة ذكية على بعضكم البعض لكشف الغريب!
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Button size="lg" className="w-full" onClick={() => setGameState('end')}>
                            كشف الغريب
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }
    
    if (gameState === 'end') {
         return (
             <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[70vh]">
                <Card className="max-w-md w-full text-center">
                    <CardHeader>
                        <CardTitle className="text-3xl font-headline">انتهت اللعبة!</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="p-6 bg-card/80 rounded-lg border-2 border-dashed space-y-4">
                            <p className="text-muted-foreground">الغريب كان:</p>
                            <p className="text-4xl font-bold text-primary">اللاعب رقم {stranger}</p>
                            <p className="text-muted-foreground pt-4">الموضوع السري كان:</p>
                             <p className="text-3xl font-bold font-headline">{topic?.description}</p>
                             <div className="relative w-full aspect-video rounded-md overflow-hidden border">
                                {topic?.imageUrl && <Image src={topic.imageUrl} alt={topic.description} fill className="object-cover" />}
                            </div>
                        </div>
                        <Button size="lg" className="w-full" onClick={handleReset}>
                            <RefreshCw className="ms-2" />
                            العب مرة أخرى
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return null;
}

// Dummy Label component to avoid TS errors, as it's not exported from the UI component
const Label = (props: React.LabelHTMLAttributes<HTMLLabelElement>) => <label {...props} />
