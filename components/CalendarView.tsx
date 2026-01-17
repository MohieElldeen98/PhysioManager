import React, { useState } from 'react';
import { Patient, ARABIC_DAYS, SessionLog, PaymentRecord } from '../types';
import { Calendar as CalendarIcon, DollarSign, Users, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { doc, collection, addDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';

interface CalendarViewProps {
  patients: Patient[];
  sessionLogs: SessionLog[];
  onAddPayment: (payment: Omit<PaymentRecord, 'id'>) => Promise<void>;
  onUpdatePatient: (patient: Patient) => Promise<void>;
  onAddSession: (session: Omit<SessionLog, 'id'>) => Promise<void>;
}

const CalendarView: React.FC<CalendarViewProps> = ({ patients, sessionLogs, onAddPayment, onUpdatePatient, onAddSession }) => {
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay());
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Filter Active Patients Only
  const activePatients = patients.filter(p => p.status === 'active');
  const scheduledPatients = activePatients.filter(p => p.scheduledDays.includes(selectedDay));

  // Determine date of the selected day in the current week
  const today = new Date();
  const currentDayIndex = today.getDay();
  const diff = selectedDay - currentDayIndex;
  const targetDate = new Date();
  targetDate.setDate(today.getDate() + diff);
  const targetDateStr = targetDate.toISOString().split('T')[0];

  // Logic to handle check-in
  const handleCheckIn = async (patient: Patient, status: 'attended' | 'cancelled') => {
    if (!auth.currentUser) return;
    setProcessingId(patient.id);

    try {
        // 1. Log the session
        const isAttended = status === 'attended';
        
        await onAddSession({
            patientId: patient.id,
            date: targetDateStr,
            status: status,
            paid: false, // Will be updated if paid immediately
            cost: patient.sessionCost,
            timestamp: new Date().toISOString()
        });

        if (isAttended) {
            let paymentMade = false;
            let amountPaid = 0;
            let paymentType: PaymentRecord['type'] = 'single_session';
            let newSessionsCompleted = (patient.sessionsCompleted || 0) + 1;

            // 2. Handle Financials based on Payment Method
            if (patient.paymentMethod === 'per_session') {
                // Immediate Payment
                amountPaid = patient.sessionCost;
                paymentMade = true;
                paymentType = 'single_session';
                
            } else if (patient.paymentMethod === 'postpaid') {
                // Check if cycle is complete
                if (patient.packageSize && newSessionsCompleted % patient.packageSize === 0) {
                     amountPaid = patient.sessionCost * patient.packageSize;
                     paymentMade = true;
                     paymentType = 'package_postpaid';
                }
            } else if (patient.paymentMethod === 'prepaid') {
                // Deduct from balance (logic handled in display/validation, but no money added here usually unless renewing)
                // Money was collected separately.
                paymentMade = false;
            }

            // 3. Register Payment if applicable
            if (paymentMade) {
                 await onAddPayment({
                    patientId: patient.id,
                    amount: amountPaid,
                    date: targetDateStr,
                    type: paymentType,
                    timestamp: new Date().toISOString()
                 });
            }

            // 4. Update Patient Counter
            await onUpdatePatient({
                ...patient,
                sessionsCompleted: newSessionsCompleted
            });
        }

    } catch (e) {
        console.error("Error processing check-in:", e);
        alert("حدث خطأ أثناء تسجيل الجلسة");
    } finally {
        setProcessingId(null);
    }
  };

  // Get logs for the selected day
  const dailyLogs = sessionLogs.filter(log => log.date === targetDateStr);
  
  // Calculate Daily Totals (Expected vs Realized)
  const expectedTotal = scheduledPatients.reduce((sum, p) => sum + p.sessionCost, 0);
  
  // Realized income logic for today (Approximation for UI: Only per-session counts immediately here visually)
  // Actual "Payment" records are the source of truth for Dashboard.
  
  // Egypt Week: Sat (6) -> Fri (5)
  const orderedDays = [6, 0, 1, 2, 3, 4, 5];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full animate-fade-in">
      {/* Calendar Selector */}
      <div className="lg:col-span-1 space-y-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
            <CalendarIcon size={20} className="text-emerald-600" />
            جدول الأسبوع
          </h3>
          <p className="text-xs text-slate-500 mb-4">حدد اليوم لتسجيل الحضور والمتابعة</p>
          
          <div className="space-y-2">
            {orderedDays.map((dayIndex) => {
              const dayName = ARABIC_DAYS[dayIndex];
              const isSelected = selectedDay === dayIndex;
              const isToday = currentDayIndex === dayIndex;
              
              // Count scheduled
              const count = activePatients.filter(p => p.scheduledDays.includes(dayIndex)).length;

              return (
                <button
                  key={dayIndex}
                  onClick={() => setSelectedDay(dayIndex)}
                  className={`w-full flex justify-between items-center p-3 rounded-xl transition-all duration-200 border relative ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                      : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                      <span className="font-bold">{dayName}</span>
                      {isToday && <span className="text-[10px] bg-emerald-500 text-white px-1.5 py-0.5 rounded">اليوم</span>}
                  </div>
                  {count > 0 && (
                    <span className={`text-xs px-2 py-1 rounded-md font-medium ${
                      isSelected ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {count} حالات
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Day Details */}
      <div className="lg:col-span-2 space-y-6">
        {/* Daily Summary Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white shadow-md flex justify-between items-center">
            <div>
              <p className="text-emerald-100 text-sm font-medium mb-1">تاريخ: {targetDateStr}</p>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                 {ARABIC_DAYS[selectedDay]}
              </h2>
            </div>
            <div className="text-left">
                <p className="text-emerald-100 text-xs">إجمالي المتوقع</p>
                <p className="font-bold text-xl">{expectedTotal.toLocaleString()} ج.م</p>
            </div>
        </div>

        {/* Sessions List */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 min-h-[400px]">
          <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2">
            <Users size={20} className="text-slate-400" />
            قائمة المرضى ({scheduledPatients.length})
          </h3>

          {scheduledPatients.length > 0 ? (
            <div className="grid gap-3">
              {scheduledPatients.map(patient => {
                  const log = dailyLogs.find(l => l.patientId === patient.id);
                  const isLogged = !!log;
                  const isAttended = log?.status === 'attended';
                  const isProcessing = processingId === patient.id;

                  // Info strings
                  let paymentInfo = '';
                  if (patient.paymentMethod === 'per_session') paymentInfo = 'دفع فوري';
                  if (patient.paymentMethod === 'prepaid') paymentInfo = `باقة (${patient.sessionsCompleted}/${patient.packageSize || '?'})`;
                  if (patient.paymentMethod === 'postpaid') paymentInfo = `مؤخر (${patient.sessionsCompleted % (patient.packageSize || 1)}/${patient.packageSize})`;

                  return (
                    <div 
                    key={patient.id} 
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all ${
                        isLogged 
                            ? isAttended ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100 opacity-75'
                            : 'bg-white border-slate-100 hover:shadow-md'
                    }`}
                    >
                    <div className="flex items-center gap-4 mb-3 sm:mb-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0 ${
                            isLogged && isAttended ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                            {patient.name.charAt(0)}
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800">{patient.name}</h4>
                            <div className="flex flex-wrap gap-2 mt-1">
                                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{patient.diagnosis}</span>
                                <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <DollarSign size={10} /> {paymentInfo}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                        {isLogged ? (
                            <div className="flex items-center gap-2 font-bold px-3 py-1.5 rounded-lg bg-white/50">
                                {isAttended ? (
                                    <>
                                        <CheckCircle size={18} className="text-emerald-600" />
                                        <span className="text-emerald-700 text-sm">تمت الجلسة</span>
                                    </>
                                ) : (
                                    <>
                                        <XCircle size={18} className="text-red-600" />
                                        <span className="text-red-700 text-sm">تم الإلغاء</span>
                                    </>
                                )}
                            </div>
                        ) : (
                            isProcessing ? (
                                <span className="text-xs text-slate-400 animate-pulse">جاري التسجيل...</span>
                            ) : (
                                <>
                                    <button 
                                        onClick={() => handleCheckIn(patient, 'cancelled')}
                                        className="text-xs bg-white border border-slate-200 text-slate-500 hover:border-red-200 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
                                    >
                                        إلغاء/اعتذار
                                    </button>
                                    <button 
                                        onClick={() => handleCheckIn(patient, 'attended')}
                                        className="flex items-center gap-1 text-xs bg-emerald-600 text-white hover:bg-emerald-700 px-4 py-2 rounded-lg transition-colors shadow-sm"
                                    >
                                        <CheckCircle size={14} />
                                        تأكيد الحضور
                                    </button>
                                </>
                            )
                        )}
                    </div>
                    </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <CalendarIcon size={48} className="mb-4 opacity-20" />
              <p>لا توجد جلسات مجدولة لهذا اليوم</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarView;