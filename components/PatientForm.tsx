import React, { useState } from 'react';
import { Patient, ARABIC_DAYS, EGYPT_WEEK_ORDER, PaymentMethod } from '../types';
import { Save, X, CreditCard } from 'lucide-react';

interface PatientFormProps {
  onSave: (patient: Patient) => void;
  onCancel: () => void;
  initialData?: Patient | null;
}

const PatientForm: React.FC<PatientFormProps> = ({ onSave, onCancel, initialData }) => {
  const [formData, setFormData] = useState<Partial<Patient>>(
    initialData || {
      name: '',
      diagnosis: '',
      sessionCost: 0,
      sessionsPerWeek: 3,
      scheduledDays: [],
      startDate: new Date().toISOString().split('T')[0],
      endDate: '', // Initialize empty
      notes: '',
      status: 'active',
      paymentMethod: 'per_session',
      packageSize: 0,
      sessionsCompleted: 0
    }
  );

  const [error, setError] = useState('');

  const handleDayToggle = (dayIndex: number) => {
    const currentDays = formData.scheduledDays || [];
    const newDays = currentDays.includes(dayIndex)
      ? currentDays.filter(d => d !== dayIndex)
      : [...currentDays, dayIndex].sort();
    
    setFormData({ ...formData, scheduledDays: newDays });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.diagnosis || !formData.sessionCost) {
      setError('يرجى ملء الحقول الأساسية (الاسم، التشخيص، التكلفة)');
      return;
    }

    if ((formData.paymentMethod === 'prepaid' || formData.paymentMethod === 'postpaid') && (!formData.packageSize || formData.packageSize < 1)) {
        setError('يرجى تحديد عدد جلسات الباقة لنظام الدفع المختار');
        return;
    }
    
    const patientToSave: Patient = {
      id: initialData?.id || crypto.randomUUID(),
      name: formData.name!,
      diagnosis: formData.diagnosis!,
      sessionCost: Number(formData.sessionCost),
      sessionsPerWeek: formData.scheduledDays?.length || formData.sessionsPerWeek || 0,
      scheduledDays: formData.scheduledDays || [],
      notes: formData.notes || '',
      startDate: formData.startDate || new Date().toISOString().split('T')[0],
      status: formData.status || 'active',
      paymentMethod: formData.paymentMethod || 'per_session',
      packageSize: Number(formData.packageSize) || 0,
      sessionsCompleted: formData.sessionsCompleted || 0
    };

    if (formData.endDate) {
      patientToSave.endDate = formData.endDate;
    }

    onSave(patientToSave);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden max-w-2xl mx-auto">
      <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
        <h2 className="text-lg font-bold">
          {initialData ? 'تعديل بيانات مريض' : 'إضافة مريض جديد'}
        </h2>
        <button onClick={onCancel} className="hover:bg-slate-700 p-2 rounded-full transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="p-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">اسم المريض</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  placeholder="مثال: أحمد محمد"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">التشخيص الطبي</label>
                <input
                  type="text"
                  value={formData.diagnosis}
                  onChange={e => setFormData({ ...formData, diagnosis: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                  placeholder="مثال: تمزق الرباط الصليبي"
                />
              </div>

              {/* Payment Section */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm">
                      <CreditCard size={16} className="text-emerald-600" />
                      إعدادات الدفع والحساب
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">تكلفة الجلسة (ج.م)</label>
                        <input
                            type="number"
                            value={formData.sessionCost}
                            onChange={e => setFormData({ ...formData, sessionCost: Number(e.target.value) })}
                            className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                            placeholder="0"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">نظام الدفع</label>
                        <select 
                            value={formData.paymentMethod}
                            onChange={e => setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })}
                            className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white cursor-pointer"
                        >
                            <option value="per_session">جلسة بجلسة</option>
                            <option value="prepaid">باقة (دفع مقدم)</option>
                            <option value="postpaid">باقة (دفع مؤخر/مجمع)</option>
                        </select>
                    </div>
                  </div>

                  {(formData.paymentMethod === 'prepaid' || formData.paymentMethod === 'postpaid') && (
                      <div className="animate-fade-in">
                          <label className="block text-sm font-medium text-slate-700 mb-1">
                              {formData.paymentMethod === 'prepaid' ? 'عدد جلسات الباقة المدفوعة مقدماً' : 'التحصيل كل عدد جلسات:'}
                          </label>
                          <input
                                type="number"
                                value={formData.packageSize || ''}
                                onChange={e => setFormData({ ...formData, packageSize: Number(e.target.value) })}
                                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                                placeholder="مثال: 12 جلسة"
                            />
                            <p className="text-xs text-slate-500 mt-1">
                                {formData.paymentMethod === 'prepaid' 
                                    ? 'سيتم تسجيل الدفع بالكامل عند تحديد ذلك، ويتم خصم الجلسات من الرصيد.' 
                                    : 'لن يتم تسجيل الدخل إلا عند اكتمال هذا العدد من الجلسات (Check).'}
                            </p>
                      </div>
                  )}
              </div>

              {/* Dates Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">تاريخ البدء</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">تاريخ الانتهاء المتوقع (اختياري)</label>
                  <input
                    type="date"
                    value={formData.endDate || ''}
                    onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">أيام الجلسات (المحددة أسبوعياً)</label>
                <div className="flex flex-wrap gap-2">
                  {EGYPT_WEEK_ORDER.map((dayIndex) => (
                    <button
                      key={dayIndex}
                      type="button"
                      onClick={() => handleDayToggle(dayIndex)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                        formData.scheduledDays?.includes(dayIndex)
                          ? 'bg-emerald-500 text-white border-emerald-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      {ARABIC_DAYS[dayIndex]}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  عدد الجلسات: {formData.scheduledDays?.length} جلسات أسبوعياً
                </p>
              </div>

               <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ملاحظات إضافية</label>
                <textarea
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-3 border border-slate-200 rounded-xl h-24 text-sm outline-none"
                  placeholder="أي ملاحظات خاصة عن المريض..."
                ></textarea>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors flex items-center gap-2"
            >
              <Save size={18} />
              حفظ البيانات
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientForm;