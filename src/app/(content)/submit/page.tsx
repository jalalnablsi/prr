"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, X } from 'lucide-react';

export default function SubmitPage() {
  const { toast } = useToast();
  const [contentType, setContentType] = useState('poll');
  const [options, setOptions] = useState(['', '']);

  const handleAddOption = () => {
    if (options.length < 5) {
      setOptions([...options, '']);
    }
  };
  
  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = [...options];
      newOptions.splice(index, 1);
      setOptions(newOptions);
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Content Submitted!",
      description: "Your post is now under review. Thank you for contributing!",
    });
    // Here you would typically send the data to your backend API
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Create a New Post</CardTitle>
            <CardDescription>Share a poll, challenge, or prediction with the community.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="type">Content Type</Label>
              <Select onValueChange={setContentType} defaultValue="poll">
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select a content type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="poll">Community Poll</SelectItem>
                  <SelectItem value="challenge">Daily Challenge</SelectItem>
                  <SelectItem value="prediction">Prediction</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="question">Question</Label>
              <Textarea id="question" placeholder="e.g., What's the best JS framework?" required />
            </div>
            <div className="space-y-4">
              <Label>Options</Label>
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input 
                    type="text" 
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    required 
                  />
                  {options.length > 2 && (
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveOption(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {options.length < 5 && (
                <Button type="button" variant="outline" size="sm" onClick={handleAddOption}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Option
                </Button>
              )}
            </div>

            {contentType === 'prediction' && (
              <div className="space-y-2">
                <Label htmlFor="timeframe">Prediction Timeframe</Label>
                <Select>
                  <SelectTrigger id="timeframe">
                    <SelectValue placeholder="Select a timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">1 Week</SelectItem>
                    <SelectItem value="month">1 Month</SelectItem>
                    <SelectItem value="year">1 Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" size="lg">Submit for Review</Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
