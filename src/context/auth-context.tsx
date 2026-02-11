"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import WebApp from '@twa-dev/sdk'; 
import { authenticateUser } from '@/app/actions/auth'; 
import { addPointsToUser } from '@/app/actions/points'; 

// تعريف شكل بيانات المستخدم
interface User {
  id: string;
  telegram_id: number;
  first_name: string;
  points: number;
  username?: string;
  photo_url?: string;
  last_daily_challenge_at?: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
  awardPoints: (amount: number, reason: string, meta?: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// نستخدم نفس اسم التصدير الموجود في Layout لديك
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    setIsLoading(true);
    try {
      let userPayload: any = null;

      // This logic must only run on the client
      if (typeof window !== 'undefined') {
        const tgUser = WebApp.initDataUnsafe.user;
        if (tgUser && tgUser.id) {
          WebApp.ready();
          userPayload = tgUser;
        }
      }
      
      if (userPayload) {
        const dbUser = await authenticateUser(userPayload, false);
        setUser(dbUser as User);
      } else {
        // Not in Telegram, or on the server during SSR. User will be null.
        console.log("Not running in Telegram or user data not found.");
        setUser(null);
      }
    } catch (error) {
      console.error("Auth Failed:", error);
      setUser(null); // Ensure user is null on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const awardPoints = async (amount: number, reason: string, meta?: any) => {
    if (!user) return;
    
    // 1. تحديث الواجهة فوراً (Optimistic UI)
    setUser(prev => prev ? { ...prev, points: prev.points + amount } : null);

    // 2. إرسال للسيرفر
    const result = await addPointsToUser(user.id, amount, reason, meta);

    if (!result.success) {
      // التراجع في حالة الفشل
      setUser(prev => prev ? { ...prev, points: prev.points - amount } : null);
      console.error("Failed to award points");
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, refreshUser, awardPoints }}>
      {children}
    </AuthContext.Provider>
  );
}

// تصدير الـ Hook للاستخدام في المكونات الأخرى
export const useAuth = () => { // يمكنك استخدام useAuth أو useUser حسب تفضيلك
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within a AuthProvider");
  return context;
};
