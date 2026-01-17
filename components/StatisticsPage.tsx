import React, { useState, useMemo } from 'react';
import { Patient, ARABIC_DAYS, EGYPT_WEEK_ORDER } from '../types';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Activity, TrendingUp, Calendar, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

interface StatisticsPageProps {
  patients: Patient[];
}

const StatisticsPage: React.FC<StatisticsPageProps> = ({ patients }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // --- Month Navigation Logic ---
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthName = currentDate.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });

  // --- Filtering Logic based on Selected Month ---
  const monthStats = useMemo(() => {
    // 1. Determine Month Boundaries as Strings (YYYY-MM-DD) to avoid Timezone issues
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1; // 1-12
    const daysInMonth = new Date(year, month, 0).getDate();
    
    const pad = (n: number) => n.toString().padStart(2, '0');
    const monthStartStr = `${year}-${pad(month)}-01`;
    const monthEndStr = `${year}-${pad(month)}-${pad(daysInMonth)}`;

    // 2. Identify Active Patients in this Month using STRICT string comparison
    const activeInMonth = patients.filter(p => {
      // Rule 1: Patient must have started on or before the end of this month
      if (p.startDate > monthEndStr) return false;

      // Rule 2: If patient has an end date, it must be on or after the start of this month
      if (p.endDate && p.endDate < monthStartStr) return false;

      return true;
    });

    // 3. Calculate Sessions & Income for this specific month day-by-day
    let totalSessions = 0;
    let totalIncome = 0;
    const diagnosisCount: Record<string, number> = {};
    const dailySessionCount = Array(7).fill(0); // For Bar Chart
    const incomeByPatient: Record<string, number> = {};

    // Loop strictly through the days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${pad(month)}-${pad(day)}`;
        const dateObj = new Date(year, month - 1, day);
        const dayOfWeek = dateObj.getDay();

        activeInMonth.forEach(p => {
            // Check if patient works on this day of week
            if (p.scheduledDays.includes(dayOfWeek)) {
                // Check exact date intersection
                const isAfterStart = dateStr >= p.startDate;
                const isBeforeEnd = !p.endDate || dateStr <= p.endDate;

                if (isAfterStart && isBeforeEnd) {
                    totalSessions++;
                    totalIncome += p.sessionCost;
                    dailySessionCount[dayOfWeek]++;
                    
                    incomeByPatient[p.name] = (incomeByPatient[p.name] || 0) + p.sessionCost;
                }
            }
        });
    }

    // Recalculate Diagnosis for *Active* patients in this month only
    activeInMonth.forEach(p => {
         const diag = p.diagnosis || 'غير محدد';
         diagnosisCount[diag] = (diagnosisCount[diag] || 0) + 1;
    });

    return {
        activeInMonthCount: activeInMonth.length,
        totalSessions,
        totalIncome,
        diagnosisCount,
        dailySessionCount,
        incomeByPatient
    };
  }, [patients, currentDate]);


  // Prepare Chart Data
  const diagnosisData = Object.keys(monthStats.diagnosisCount).map(key => ({
    name: key,
    value: monthStats.diagnosisCount[key]
  }));

  const busyDaysData = EGYPT_WEEK_ORDER.map(dayIndex => ({
    name: ARABIC_DAYS[dayIndex],
    sessions: monthStats.dailySessionCount[dayIndex]
  }));

  const topIncomeData = Object.keys(monthStats.incomeByPatient)
    .map(name => ({ name, income: monthStats.incomeByPatient[name] }))
    .sort((a, b) => b.income - a.income)
    .slice(0, 5);

  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Activity className="text-emerald-600" />
            الإحصائيات الشهرية
            </h2>
            <p className="text-slate-500">تحليل الأداء المالي والعيادي لشهر {monthName}</p>
        </div>

        <div className="flex items-center bg-white rounded-xl shadow-sm border border-slate-200 p-1">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600">
                <ChevronRight size={20} />
            </button>
            <div className="px-4 font-bold text-slate-700 min-w-[140px] text-center flex items-center justify-center gap-2">
                <CalendarDays size={18} className="text-emerald-600" />
                {monthName}
            </div>
            <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600">
                <ChevronLeft size={20} />
            </button>
        </div>
      </header>

      {/* Summary Cards for the Month */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-slate-500 text-sm font-medium">الدخل في {monthName}</p>
            <h3 className="text-3xl font-bold text-emerald-600 mt-2">{monthStats.totalIncome.toLocaleString()} ج.م</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-slate-500 text-sm font-medium">إجمالي الجلسات</p>
            <h3 className="text-3xl font-bold text-blue-600 mt-2">{monthStats.totalSessions}</h3>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-slate-500 text-sm font-medium">الحالات النشطة هذا الشهر</p>
            <h3 className="text-3xl font-bold text-purple-600 mt-2">{monthStats.activeInMonthCount}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Diagnosis Chart - Fixed Visuals */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-2">توزيع الحالات (حسب التشخيص)</h3>
          <p className="text-xs text-slate-400 mb-6">نسبة كل تشخيص من إجمالي الحالات النشطة في {monthName}</p>
          
          <div className="flex-1 min-h-[300px]">
            {diagnosisData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={diagnosisData}
                    cx="50%"
                    cy="45%" // Move chart up slightly to make room for legend
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {diagnosisData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    iconType="circle"
                    formatter={(value, entry: any) => (
                        <span className="text-slate-600 text-sm ml-2 font-medium">{value} ({entry.payload.value})</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 bg-slate-50 rounded-xl">لا توجد حالات في هذا الشهر</div>
            )}
          </div>
        </div>

        {/* Busiest Days Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
            <Calendar size={18} className="text-blue-500" />
            توزيع الجلسات خلال الأسبوع
          </h3>
          <p className="text-xs text-slate-400 mb-6">أي الأيام كان بها ضغط جلسات أكبر في {monthName}</p>

          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={busyDaysData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="sessions" name="عدد الجلسات" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Income Sources */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-500" />
            أعلى المرضى دخلاً في {monthName}
          </h3>
          <div className="h-[250px] w-full">
            {topIncomeData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topIncomeData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={120} axisLine={false} tickLine={false} tick={{fill: '#334155', fontWeight: 'bold'}} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    formatter={(value: number) => [`${value.toLocaleString()} ج.م`, 'الدخل الشهري']}
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  />
                  <Bar dataKey="income" fill="#10b981" radius={[0, 6, 6, 0]} barSize={24} background={{ fill: '#f1f5f9' }} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 bg-slate-50 rounded-xl">لا توجد بيانات مالية لهذا الشهر</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default StatisticsPage;