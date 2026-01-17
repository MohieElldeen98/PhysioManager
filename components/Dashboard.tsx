import React, { useState, useMemo } from 'react';
import { Patient, ARABIC_DAYS, PaymentRecord } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Wallet, Users, CalendarCheck, Hourglass, CalendarDays, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, DollarSign } from 'lucide-react';
import { auth } from '../services/firebase';

interface DashboardProps {
  patients: Patient[];
  payments: PaymentRecord[];
}

const Dashboard: React.FC<DashboardProps> = ({ patients, payments }) => {
  const [showForecast, setShowForecast] = useState(false);
  const [includePrepaidInTotal, setIncludePrepaidInTotal] = useState(false);

  const user = auth.currentUser;
  const displayName = user?.displayName || 'دكتور';

  const activePatientsList = patients.filter(p => p.status === 'active');
  
  // Date Logic Check: Check for expired active patients
  const todayDateStr = new Date().toISOString().split('T')[0];
  const expiredActivePatients = activePatientsList.filter(p => p.endDate && p.endDate < todayDateStr);

  // --- Projected Income (Old Logic) ---
  const projectedWeeklyIncome = activePatientsList.reduce((sum, p) => sum + (p.sessionCost * p.scheduledDays.length), 0);
  const projectedMonthlyIncome = projectedWeeklyIncome * 4; 

  // --- Actual Income (New Logic from Payments) ---
  const actualStats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - now.getDay()); // Sunday as start approximation (or adjust for Sat)

    let monthTotal = 0;
    let monthTotalWithoutPrepaid = 0;
    let weekTotal = 0;
    let todayTotal = 0;

    payments.forEach(pay => {
        const pDate = new Date(pay.date);
        
        // Month Check
        if (pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear) {
            monthTotal += pay.amount;
            if (pay.type !== 'package_prepaid') {
                monthTotalWithoutPrepaid += pay.amount;
            }
        }

        // Today Check
        if (pay.date === todayDateStr) {
            todayTotal += pay.amount;
        }

        // Week Check (Simple check: within last 7 days or current week)
        // Let's use simple "This week" based on date diff < 7 days from now? No, stick to calendar week
        // or just sum of this month for simplicity in this prompt context
    });
    
    return { monthTotal, monthTotalWithoutPrepaid, todayTotal };
  }, [payments, todayDateStr]);

  const displayedMonthlyActual = includePrepaidInTotal ? actualStats.monthTotal : actualStats.monthTotalWithoutPrepaid;

  // Prepare chart data per patient for weekly income (Projected)
  const patientIncomeData = activePatientsList.map(p => ({
    name: p.name.split(' ')[0], 
    income: p.sessionCost * p.scheduledDays.length,
    fullIncome: p.sessionCost * p.scheduledDays.length
  }));

  const StatCard = ({ title, value, sub, icon, colorClass, highlight = false }: any) => (
    <div className={`p-6 rounded-2xl shadow-sm border transition-shadow ${highlight ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-100 hover:shadow-md'}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className={`text-sm font-medium mb-1 ${highlight ? 'text-slate-400' : 'text-slate-500'}`}>{title}</p>
          <h3 className={`text-2xl font-bold ${highlight ? 'text-white' : 'text-slate-800'}`}>{value}</h3>
          {sub && <p className={`text-xs mt-1 ${highlight ? 'text-slate-500' : 'text-slate-400'}`}>{sub}</p>}
        </div>
        <div className={`p-3 rounded-xl ${colorClass}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-2xl font-bold text-slate-800">مرحباً {displayName} 👋</h2>
           <p className="text-slate-500">نظرة عامة على الأداء المالي الفعلي والمتوقع</p>
        </div>
        
        {expiredActivePatients.length > 0 && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl border border-red-100 text-sm flex items-center gap-2">
            <AlertCircle size={18} />
            <span>تنبيه: يوجد {expiredActivePatients.length} حالات انتهى تاريخها ولا تزال نشطة.</span>
          </div>
        )}
      </header>

      {/* Actual Income Section (New) */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <CheckCircle2 className="text-emerald-600" size={20} />
                الدخل الفعلي (المحصل)
            </h3>
            
            <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-slate-600 cursor-pointer select-none" htmlFor="prepaidToggle">
                    عرض إجمالي الباقات المقدمة
                </label>
                <div 
                    onClick={() => setIncludePrepaidInTotal(!includePrepaidInTotal)}
                    className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${includePrepaidInTotal ? 'bg-emerald-600' : 'bg-slate-300'}`}
                >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${includePrepaidInTotal ? 'translate-x-[-16px]' : ''}`}></div>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <StatCard
                title="الدخل المحصل اليوم"
                value={`${actualStats.todayTotal.toLocaleString()} ج.م`}
                sub="بناءً على الـ Check-in"
                icon={<DollarSign size={24} className="text-emerald-400" />}
                colorClass="bg-emerald-900/50"
                highlight={true}
            />
            <StatCard
                title={`الدخل المحصل هذا الشهر ${includePrepaidInTotal ? '(بالباقات)' : '(بدون الباقات)'}`}
                value={`${displayedMonthlyActual.toLocaleString()} ج.م`}
                sub={includePrepaidInTotal ? "يشمل الدفعات المقدمة الكبيرة" : "الدخل التشغيلي المعتاد"}
                icon={<Wallet size={24} className="text-blue-600" />}
                colorClass="bg-blue-50"
            />
            <StatCard
                title="الدخل المتوقع (نظرياً)"
                value={`${projectedWeeklyIncome.toLocaleString()} ج.م`}
                sub="أسبوعياً (لو حضر الجميع)"
                icon={<TrendingUp size={24} className="text-purple-600" />}
                colorClass="bg-purple-50"
            />
        </div>
      </div>

      {/* Main Stats Grid */}
      <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2 mb-4">
            <Users className="text-slate-600" size={20} />
            إحصائيات الحالات
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="عدد الحالات النشطة"
          value={patients.filter(p => p.status === 'active').length}
          sub="مرضى حاليين"
          icon={<Users size={24} className="text-purple-600" />}
          colorClass="bg-purple-50"
        />
        <StatCard
          title="حالات بنظام الباقة (مقدم)"
          value={activePatientsList.filter(p => p.paymentMethod === 'prepaid').length}
          sub="دفع مسبق"
          icon={<Wallet size={24} className="text-orange-600" />}
          colorClass="bg-orange-50"
        />
        <StatCard
          title="حالات بنظام المؤخر"
          value={activePatientsList.filter(p => p.paymentMethod === 'postpaid').length}
          sub="دفع عند الاكتمال"
          icon={<CalendarCheck size={24} className="text-indigo-600" />}
          colorClass="bg-indigo-50"
        />
         <StatCard
          title="جلسة بجلسة"
          value={activePatientsList.filter(p => p.paymentMethod === 'per_session').length}
          sub="دفع فوري"
          icon={<CheckCircle2 size={24} className="text-emerald-600" />}
          colorClass="bg-emerald-50"
        />
      </div>

      {/* Collapsible Forecast Section (Existing) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <button 
          onClick={() => setShowForecast(!showForecast)}
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-2 font-bold text-slate-700">
             <Hourglass size={20} className="text-indigo-500" />
             <span>التوقعات المالية النظرية للفترة المتبقية (بدون اعتبار للدفع الفعلي)</span>
          </div>
          {showForecast ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
        </button>
        
        {showForecast && (
          <div className="p-6 pt-0 border-t border-slate-50 bg-slate-50/50">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-md relative overflow-hidden">
                  <div className="relative z-10 flex justify-between items-center">
                    <div>
                      <p className="text-indigo-100 font-medium mb-1">إجمالي الشهر (توقعات)</p>
                      <h3 className="text-3xl font-bold">{projectedMonthlyIncome.toLocaleString()} ج.م</h3>
                    </div>
                    <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                      <Hourglass size={24} />
                    </div>
                  </div>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Charts & Lists Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Active Patients Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full">
          <div className="p-5 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">تفاصيل الحالات النشطة</h3>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{activePatientsList.length} حالات</span>
          </div>
          
          <div className="overflow-x-auto flex-1">
             <table className="w-full text-sm text-right">
                <thead className="bg-slate-50 text-slate-500 font-medium">
                   <tr>
                      <th className="p-3 pr-5">المريض</th>
                      <th className="p-3">نظام الدفع</th>
                      <th className="p-3">القيمة</th>
                      <th className="p-3 pl-5 text-emerald-700">المتوقع (أسبوعي)</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {activePatientsList.map(patient => {
                       const weeklyIncome = patient.sessionCost * patient.scheduledDays.length;
                       let payType = 'جلسة';
                       if(patient.paymentMethod === 'prepaid') payType = 'باقة مقدم';
                       if(patient.paymentMethod === 'postpaid') payType = 'باقة مؤخر';

                       return (
                          <tr key={patient.id} className="hover:bg-slate-50/80 transition-colors">
                             <td className="p-3 pr-5">
                                <div className="font-bold text-slate-800">{patient.name}</div>
                                <div className="text-xs text-slate-400 truncate max-w-[120px]">{patient.diagnosis}</div>
                             </td>
                             <td className="p-3">
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                    patient.paymentMethod === 'prepaid' ? 'bg-orange-100 text-orange-700' :
                                    patient.paymentMethod === 'postpaid' ? 'bg-indigo-100 text-indigo-700' :
                                    'bg-emerald-100 text-emerald-700'
                                }`}>
                                    {payType}
                                </span>
                             </td>
                             <td className="p-3 text-slate-600">{patient.sessionCost}</td>
                             <td className="p-3 pl-5 font-bold text-emerald-600">
                                {weeklyIncome.toLocaleString()}
                             </td>
                          </tr>
                       );
                   })}
                   {activePatientsList.length === 0 && (
                      <tr>
                         <td colSpan={4} className="p-8 text-center text-slate-400">لا توجد حالات نشطة</td>
                      </tr>
                   )}
                </tbody>
             </table>
          </div>
        </div>

        {/* Income Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full min-h-[350px]">
          <h3 className="font-bold text-slate-800 mb-6">توزيع الدخل الأسبوعي (المتوقع)</h3>
          <div className="flex-1 min-h-[250px]">
            {activePatientsList.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={patientIncomeData} margin={{top: 10, right: 10, left: -20, bottom: 0}}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  />
                  <Bar dataKey="income" radius={[6, 6, 0, 0]} barSize={32} fill="#3b82f6">
                    {patientIncomeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'][index % 6]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                لا توجد بيانات للعرض
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;