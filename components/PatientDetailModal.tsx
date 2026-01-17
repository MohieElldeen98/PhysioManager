import React, { useState } from 'react';
import { Patient, ARABIC_DAYS, sortDays, PaymentRecord } from '../types';
import { X, CheckCircle, Clock, AlertCircle, DollarSign, Plus } from 'lucide-react';
import { addDoc, collection } from 'firebase/firestore';
import { db, auth } from '../services/firebase';

interface PatientDetailModalProps {
  patient: Patient;
  onClose: () => void;
  onUpdatePatient: (patient: Patient) => void;
  onEdit: () => void;
}

const PatientDetailModal: React.FC<PatientDetailModalProps> = ({ patient, onClose, onUpdatePatient, onEdit }) => {
  const [showPaymentInput, setShowPaymentInput] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  
  const calculateHistory = () => {
    const start = new Date(patient.startDate);
    const end = patient.status === 'completed' && patient.endDate 
      ? new Date(patient.endDate) 
      : new Date();
    
    start.setHours(0,0,0,0);
    end.setHours(0,0,0,0);

    let sessionsCount = 0;
    
    if (start > end) return { sessions: 0, totalCost: 0 };

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dayIndex = d.getDay();
      if (patient.scheduledDays.includes(dayIndex)) {
        sessionsCount++;
      }
    }

    return {
      sessions: sessionsCount,
      totalCost: sessionsCount * patient.sessionCost,
    };
  };

  const history = calculateHistory();

  // Check if expired but still active
  const todayStr = new Date().toISOString().split('T')[0];
  const isExpired = patient.status === 'active' && patient.endDate && patient.endDate < todayStr;

  const handleToggleStatus = () => {
    const isCompleting = patient.status === 'active';
    const newStatus = isCompleting ? 'completed' : 'active';
    const newEndDate = isCompleting ? new Date().toISOString().split('T')[0] : undefined;

    if (isCompleting) {
        if (!window.confirm('هل أنت متأكد من إنهاء علاج هذا المريض؟')) return;
    }

    onUpdatePatient({
      ...patient,
      status: newStatus,
      endDate: newEndDate
    });
  };

  const handleManualPayment = async () => {
      if(!auth.currentUser || !paymentAmount) return;
      try {
          await addDoc(collection(db, "users", auth.currentUser.uid, "payments"), {
              patientId: patient.id,
              amount: Number(paymentAmount),
              date: new Date().toISOString().split('T')[0],
              type: 'package_prepaid', // Assume manual entry is usually a package/bulk pay
              timestamp: new Date().toISOString()
          });
          alert("تم تسجيل الدفعة بنجاح");
          setShowPaymentInput(false);
          setPaymentAmount('');
      } catch(e) {
          console.error(e);
          alert("حدث خطأ");
      }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 p-6 flex justify-between items-start text-white relative overflow-hidden">
          <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-1">{patient.name}</h2>
              <p className="text-slate-400 text-sm">{patient.diagnosis}</p>
          </div>
          <button 
            onClick={onClose}
            className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors z-10"
          >
            <X size={20} />
          </button>
        </div>

        {/* Warning for Expired Status */}
        {isExpired && (
            <div className="bg-red-50 p-3 text-red-700 text-sm flex items-center gap-2 justify-center border-b border-red-100">
                <AlertCircle size={16} />
                <span>تاريخ الانتهاء المحدد ({patient.endDate}) قد مرّ، لكن الحالة لا تزال نشطة.</span>
            </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Main Stats Row */}
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-center">
                <p className="text-slate-500 text-sm mb-1">عدد الجلسات (نظري)</p>
                <p className="text-2xl font-bold text-slate-800">{history.sessions}</p>
             </div>
             <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-center">
                <p className="text-emerald-700 text-sm mb-1">القيمة الإجمالية (نظري)</p>
                <p className="text-2xl font-bold text-emerald-800">{history.totalCost.toLocaleString()} ج.م</p>
             </div>
          </div>

          <div className="space-y-4">
             <div className="flex justify-between items-center border-b pb-2">
                 <h3 className="font-bold text-slate-800">التفاصيل</h3>
                 
                 {patient.paymentMethod === 'prepaid' && (
                     <button 
                        onClick={() => setShowPaymentInput(!showPaymentInput)}
                        className="text-xs flex items-center gap-1 bg-emerald-600 text-white px-2 py-1 rounded-lg"
                     >
                         <Plus size={12} /> تسجيل دفعة مقدمة
                     </button>
                 )}
             </div>

            {showPaymentInput && (
                <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 flex gap-2 items-center">
                    <input 
                        type="number" 
                        placeholder="المبلغ" 
                        value={paymentAmount}
                        onChange={e => setPaymentAmount(e.target.value)}
                        className="p-2 rounded-lg border border-emerald-200 text-sm w-full outline-none"
                    />
                    <button onClick={handleManualPayment} className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm font-bold">
                        حفظ
                    </button>
                </div>
            )}
             
             <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                <div>
                   <p className="text-slate-500">نظام الدفع</p>
                   <p className="font-medium text-slate-800">
                       {patient.paymentMethod === 'prepaid' ? 'باقة مقدم' : patient.paymentMethod === 'postpaid' ? 'باقة مؤخر' : 'جلسة بجلسة'}
                       {patient.packageSize ? ` (${patient.packageSize} جلسات)` : ''}
                   </p>
                </div>
                <div>
                   <p className="text-slate-500">سعر الجلسة</p>
                   <p className="font-medium text-slate-800">{patient.sessionCost} ج.م</p>
                </div>
                <div>
                   <p className="text-slate-500">الأيام</p>
                   <p className="font-medium text-slate-800">
                      {sortDays(patient.scheduledDays).map(d => ARABIC_DAYS[d]).join('، ')}
                   </p>
                </div>
                <div>
                   <p className="text-slate-500">تم تنفيذه (Check)</p>
                   <p className="font-medium text-slate-800">{patient.sessionsCompleted || 0}</p>
                </div>
             </div>

             {patient.notes && (
                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 mt-4">
                   <p className="text-sm font-bold text-yellow-700 mb-1">ملاحظات:</p>
                   <p className="text-sm text-yellow-800">{patient.notes}</p>
                </div>
             )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
            <button 
              onClick={onEdit}
              className="text-slate-500 hover:text-slate-800 font-medium px-4 py-2 transition-colors"
            >
              تعديل
            </button>

            <button
              onClick={handleToggleStatus}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white transition-all shadow-md ${
                patient.status === 'active'
                  ? 'bg-slate-900 hover:bg-slate-800'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
            >
               {patient.status === 'active' ? (
                 <>
                   <CheckCircle size={18} />
                   إنهاء الحالة
                 </>
               ) : (
                 <>
                   <Clock size={18} />
                   إعادة للتنشيط
                 </>
               )}
            </button>
        </div>

      </div>
    </div>
  );
};

export default PatientDetailModal;