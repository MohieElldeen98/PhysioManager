import React, { useState, useEffect } from 'react';
import { Patient, ARABIC_DAYS } from '../types';
import { Calculator, Calendar, DollarSign, ArrowRight, Activity, PieChart as PieIcon, TrendingUp, Filter, Printer, X, Check } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

interface IncomeCalculatorProps {
  patients: Patient[];
}

const IncomeCalculator: React.FC<IncomeCalculatorProps> = ({ patients }) => {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0]
  );
  
  const [excludedPatientIds, setExcludedPatientIds] = useState<string[]>([]);
  
  const [calculationResult, setCalculationResult] = useState<{
    totalIncome: number;
    totalSessions: number;
    daysCount: number;
    averageDailyIncome: number;
    breakdown: { date: string; dayName: string; income: number; sessions: number; patients: string[] }[];
    patientShares: { name: string; value: number }[];
  } | null>(null);

  // --- Quick Select Helpers ---
  const setRange = (type: 'thisMonth' | 'nextMonth' | 'last30') => {
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (type === 'thisMonth') {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    } else if (type === 'nextMonth') {
        start = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        end = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    } else if (type === 'last30') {
        start = new Date();
        start.setDate(now.getDate() - 30);
        end = new Date(); // Today
    }

    // Adjust for timezone offset to ensure YYYY-MM-DD is correct locally
    const offset = start.getTimezoneOffset();
    const localStart = new Date(start.getTime() - (offset*60*1000));
    const localEnd = new Date(end.getTime() - (offset*60*1000));

    setStartDate(localStart.toISOString().split('T')[0]);
    setEndDate(localEnd.toISOString().split('T')[0]);
  };

  const toggleExclusion = (id: string) => {
      setExcludedPatientIds(prev => 
        prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
      );
  };

  const calculateIncome = () => {
    // 1. Setup Dates
    const startObj = new Date(startDate);
    const endObj = new Date(endDate);
    const dayCount = Math.floor((endObj.getTime() - startObj.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    let totalIncome = 0;
    let totalSessions = 0;
    const breakdown = [];
    const patientIncomeMap: Record<string, number> = {};

    // Filter patients based on exclusion list
    const activeCalcPatients = patients.filter(p => !excludedPatientIds.includes(p.id));

    // 2. Iterate Days
    for (let d = new Date(startObj); d <= endObj; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD
      const dayIndex = d.getDay();
      
      let dailyIncome = 0;
      let dailySessions = 0;
      const dailyPatients: string[] = [];

      // 3. Check each patient strictly
      activeCalcPatients.forEach(p => {
        // Must be scheduled on this weekday
        if (!p.scheduledDays.includes(dayIndex)) return;

        // Must be within patient's active contract dates
        // Start Date Check
        if (p.startDate > dateStr) return;
        
        // End Date Check (if exists)
        if (p.endDate && p.endDate < dateStr) return;

        // Note: For calculator, we project "expected" income, so we use sessionCost regardless of payment method
        // to show value of work done.
        
        dailyIncome += p.sessionCost;
        dailySessions++;
        dailyPatients.push(p.name);
        
        // Accumulate for Pie Chart
        patientIncomeMap[p.name] = (patientIncomeMap[p.name] || 0) + p.sessionCost;
      });

      totalIncome += dailyIncome;
      totalSessions += dailySessions;

      if (dailyIncome > 0) {
        breakdown.push({
          date: d.toLocaleDateString('ar-EG'),
          dayName: ARABIC_DAYS[dayIndex],
          income: dailyIncome,
          sessions: dailySessions,
          patients: dailyPatients
        });
      }
    }

    // 4. Format Pie Chart Data
    const patientShares = Object.keys(patientIncomeMap)
        .map(name => ({ name, value: patientIncomeMap[name] }))
        .sort((a, b) => b.value - a.value);

    setCalculationResult({
      totalIncome,
      totalSessions,
      daysCount: dayCount,
      averageDailyIncome: dayCount > 0 ? Math.round(totalIncome / dayCount) : 0,
      breakdown,
      patientShares
    });
  };

  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Calculator className="text-emerald-600" />
            حاسبة الدخل المتقدمة
            </h2>
            <p className="text-slate-500">تحليل وتوقع الدخل بناءً على جداول المرضى وتواريخهم الفعلية.</p>
        </div>
        <button 
           onClick={() => window.print()} 
           className="hidden md:flex items-center gap-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 px-3 py-2 rounded-xl transition-colors"
        >
            <Printer size={18} />
            طباعة التقرير
        </button>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: Controls */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 sticky top-4">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                <Filter size={20} className="text-slate-400" />
                إعدادات الحساب
            </h3>
            
            {/* Quick Filters */}
            <div className="grid grid-cols-3 gap-2 mb-6">
                <button onClick={() => setRange('last30')} className="text-xs font-medium bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 py-2 rounded-lg border border-slate-200 transition-colors">
                    آخر 30 يوم
                </button>
                <button onClick={() => setRange('thisMonth')} className="text-xs font-medium bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 py-2 rounded-lg border border-slate-200 transition-colors">
                    هذا الشهر
                </button>
                <button onClick={() => setRange('nextMonth')} className="text-xs font-medium bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 py-2 rounded-lg border border-slate-200 transition-colors">
                    الشهر القادم
                </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">من تاريخ</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">إلى تاريخ</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              {/* Exclusion List */}
              <div className="pt-4 border-t border-slate-100">
                  <label className="block text-sm font-bold text-slate-700 mb-2">استثناء مرضى (Exception)</label>
                  <div className="max-h-40 overflow-y-auto space-y-1 border border-slate-100 rounded-xl p-2 bg-slate-50">
                      {patients.filter(p => p.status === 'active').map(patient => {
                          const isExcluded = excludedPatientIds.includes(patient.id);
                          return (
                              <div 
                                key={patient.id}
                                onClick={() => toggleExclusion(patient.id)}
                                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-sm transition-colors ${
                                    isExcluded ? 'bg-red-50 text-red-600' : 'hover:bg-white text-slate-700'
                                }`}
                              >
                                  <span>{patient.name}</span>
                                  {isExcluded ? <X size={14} /> : <Check size={14} className="text-slate-300" />}
                              </div>
                          );
                      })}
                      {patients.filter(p => p.status === 'active').length === 0 && (
                          <p className="text-xs text-slate-400 text-center py-2">لا توجد حالات نشطة</p>
                      )}
                  </div>
              </div>

              <button
                onClick={calculateIncome}
                className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-900/20 mt-6 flex justify-center items-center gap-2"
              >
                <Calculator size={20} />
                احسب النتائج
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="xl:col-span-2">
          {calculationResult ? (
            <div className="space-y-6">
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden group">
                  <div className="relative z-10">
                    <p className="text-emerald-100 font-medium text-sm mb-1">إجمالي الدخل المتوقع</p>
                    <h3 className="text-3xl font-bold">{calculationResult.totalIncome.toLocaleString()} ج.م</h3>
                    <div className="mt-3 text-xs bg-white/20 inline-block px-2 py-1 rounded-lg backdrop-blur-sm">
                        متوسط {calculationResult.averageDailyIncome.toLocaleString()} ج.م / يوم
                    </div>
                  </div>
                  <DollarSign className="absolute bottom-[-10px] left-[-10px] text-white opacity-10 group-hover:scale-110 transition-transform" size={100} />
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
                  <div className="relative z-10">
                    <p className="text-slate-500 font-medium text-sm mb-1">عدد الجلسات</p>
                    <h3 className="text-3xl font-bold text-slate-800">{calculationResult.totalSessions}</h3>
                    <p className="text-xs text-slate-400 mt-2">خلال {calculationResult.daysCount} يوم</p>
                  </div>
                  <Activity className="absolute bottom-4 left-4 text-blue-500 opacity-10 group-hover:scale-110 transition-transform" size={60} />
                </div>

                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
                  <div className="relative z-10">
                    <p className="text-slate-500 font-medium text-sm mb-1">أكثر مريض دخلاً</p>
                    <h3 className="text-xl font-bold text-slate-800 truncate">
                        {calculationResult.patientShares[0]?.name || '-'}
                    </h3>
                    <p className="text-xs text-emerald-600 font-bold mt-2">
                        {calculationResult.patientShares[0]?.value.toLocaleString() || 0} ج.م
                    </p>
                  </div>
                  <TrendingUp className="absolute bottom-4 left-4 text-purple-500 opacity-10" size={60} />
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Area Chart: Trend */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 min-h-[300px] flex flex-col">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <TrendingUp size={18} className="text-blue-500" />
                        المسار الزمني للدخل
                    </h3>
                    <div className="flex-1">
                        <ResponsiveContainer width="100%" height={250}>
                            <AreaChart data={calculationResult.breakdown}>
                                <defs>
                                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="dayName" hide />
                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                <Tooltip 
                                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                    labelStyle={{color: '#64748b'}}
                                    formatter={(value: number) => [`${value} ج.م`, 'الدخل']}
                                />
                                <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Pie Chart: Distribution */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 min-h-[300px] flex flex-col">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <PieIcon size={18} className="text-purple-500" />
                        توزيع الدخل حسب المرضى
                    </h3>
                     <div className="flex-1">
                        {calculationResult.patientShares.length > 0 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={calculationResult.patientShares}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {calculationResult.patientShares.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                                    <Legend wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-slate-400">لا توجد بيانات</div>
                        )}
                    </div>
                </div>

              </div>

              {/* Breakdown Table */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">التفاصيل اليومية</h3>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{calculationResult.breakdown.length} يوم عمل</span>
                </div>
                
                <div className="overflow-x-auto max-h-[400px]">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-slate-50 text-slate-500 font-medium sticky top-0 z-10">
                            <tr>
                                <th className="p-4">التاريخ</th>
                                <th className="p-4">اليوم</th>
                                <th className="p-4">المرضى</th>
                                <th className="p-4 text-center">الجلسات</th>
                                <th className="p-4 text-emerald-700">الدخل</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                        {calculationResult.breakdown.length > 0 ? (
                             calculationResult.breakdown.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-4 font-medium text-slate-800">{item.date}</td>
                                    <td className="p-4 text-slate-600">{item.dayName}</td>
                                    <td className="p-4 text-slate-500 max-w-[200px] truncate" title={item.patients.join(', ')}>
                                        {item.patients.join('، ')}
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-md font-bold text-xs">
                                            {item.sessions}
                                        </span>
                                    </td>
                                    <td className="p-4 font-bold text-emerald-600">
                                        {item.income.toLocaleString()} ج.م
                                    </td>
                                </tr>
                            ))
                        ) : (
                             <tr><td colSpan={5} className="p-8 text-center text-slate-400">لا توجد جلسات في هذه الفترة</td></tr>
                        )}
                        </tbody>
                    </table>
                </div>
              </div>

            </div>
          ) : (
            <div className="h-full min-h-[400px] bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 p-8">
              <div className="bg-white p-6 rounded-full mb-4 shadow-sm animate-bounce-slow">
                <Calculator size={40} className="text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-600">في انتظار بدء الحساب</h3>
              <p className="text-sm text-center mt-2 max-w-sm leading-relaxed">
                استخدم القائمة الجانبية لتحديد الفترة الزمنية، أو اختر أحد الاختصارات السريعة (هذا الشهر، إلخ) ثم اضغط على زر "احسب النتائج".
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IncomeCalculator;