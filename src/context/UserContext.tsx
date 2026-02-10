"use client";

import { createContext, useContext, useEffect, useState } from 'react';
// تأكد من تثبيت المكتبة: npm install @twa-dev/sdk
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
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
  awardPoints: (amount: number, reason: string, meta?: any) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      let userDataToSend: any;
      let isDev = false;

      // === التحقق: هل نحن داخل تيلجرام؟ ===
      if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
        WebApp.ready();
        const tgUser = WebApp.initDataUnsafe.user;
        
        if (tgUser) {
          userDataToSend = tgUser;
          isDev = false;
        } else {
          throw new Error("No user in Telegram");
        }
      } else {
        // === وضع التطوير (المتصفح العادي) ===
        console.log("Running in Dev Mode (Browser) - Using Mock User");
        userDataToSend = {
          id: 999888777, // ID وهمي ثابت
          first_name: "مطور التطبيق",
          username: "dev_admin",
          photo_url: "https://picsum.photos/seed/dev/200/200"
        };
        isDev = true;
      }

      // إرسال البيانات للسيرفر
      const dbUser = await authenticateUser(JSON.stringify(userDataToSend), isDev);
      setUser(dbUser as User);

    } catch (error) {
      console.error("Auth Failed:", error);
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
    <UserContext.Provider value={{ user, isLoading, refreshUser, awardPoints }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within a UserProvider");
  return context;
};