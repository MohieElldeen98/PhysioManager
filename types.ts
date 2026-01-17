import React from 'react';

// ⚠️ تم تحديث الإيميل ليطابق حسابك الحالي
export const ADMIN_EMAIL = 'admin@physiomanager.com';

export type PaymentMethod = 'per_session' | 'prepaid' | 'postpaid';

export interface Patient {
  id: string;
  name: string;
  diagnosis: string;
  sessionCost: number;
  sessionsPerWeek: number;
  scheduledDays: number[]; // 0 = Sunday, 1 = Monday, etc.
  notes: string;
  startDate: string;
  endDate?: string; // Date when treatment finished or scheduled to finish
  status: 'active' | 'completed';
  
  // Payment Details
  paymentMethod: PaymentMethod;
  packageSize?: number; // For prepaid/postpaid (e.g., pay every 12 sessions)
  sessionsCompleted: number; // Counter for postpaid/prepaid tracking
}

export interface SessionLog {
  id: string;
  patientId: string;
  date: string; // YYYY-MM-DD
  status: 'attended' | 'cancelled';
  paid: boolean;
  cost: number;
  timestamp: string;
}

export interface PaymentRecord {
  id: string;
  patientId: string;
  amount: number;
  date: string; // YYYY-MM-DD
  type: 'single_session' | 'package_prepaid' | 'package_postpaid';
  note?: string;
  timestamp: string;
}

export interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

// ⚠️ ملاحظة تقنية: في البرمجة الأحد دائماً = 0
// نحن نستخدم EGYPT_WEEK_ORDER لضبط العرض فقط ليبدأ من السبت
export enum WeekDay {
  Sunday = 0,
  Monday = 1,
  Tuesday = 2,
  Wednesday = 3,
  Thursday = 4,
  Friday = 5,
  Saturday = 6
}

export const ARABIC_DAYS = [
  'الأحد',
  'الاثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت'
];

// ترتيب الأسبوع المصري: يبدأ السبت (6) وينتهي الجمعة (5)
export const EGYPT_WEEK_ORDER = [6, 0, 1, 2, 3, 4, 5];

export const sortDays = (days: number[]) => {
  return [...days].sort((a, b) => EGYPT_WEEK_ORDER.indexOf(a) - EGYPT_WEEK_ORDER.indexOf(b));
};