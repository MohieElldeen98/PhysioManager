import React, { useState, useMemo } from 'react';
import { Patient, ARABIC_DAYS, sortDays } from '../types';
import { FileText, Printer, ChevronLeft, ChevronRight, CalendarDays, ArrowUpDown } from 'lucide-react';

interface ReportsPageProps {
  patients: Patient[];
}

const ReportsPage: React.FC<ReportsPageProps> = ({ patients }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc'); // 'desc' = Newest first

  const handlePrint = () => {
    window.print();
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthName = currentDate.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });

  // --- Calculate Monthly Data per Patient ---
  const reportData = useMemo(() => {
    // 1. Determine Month Boundaries as Strings
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1; // 1-12
    const daysInMonth = new Date(year, month, 0).getDate();
    
    const pad = (n: number) => n.toString().padStart(2, '0');
    const monthStartStr = `${year}-${pad(month)}-01`;
    const monthEndStr = `${year}-${pad(month)}-${pad(daysInMonth)}`;

    // 2. Identify Active Patients strictly by String Comparison
    const activePatients = patients.filter(p => {
        if (p.startDate > monthEndStr) return false;
        if (p.endDate && p.endDate < monthStartStr) return false;
        return true;
    });

    // 3. Calculate actual sessions/income
    const detailedData = activePatients.map(patient => {
        let sessionsInMonth = 0;
        
        // Loop strictly through days
        for (let day = 1; day <= daysInMonth; day++) {
             const dateStr = `${year}-${pad(month)}-${pad(day)}`;
             const dayIndex = new Date(year, month - 1, day).getDay();

            if (patient.scheduledDays.includes(dayIndex)) {
                 const isAfterStart = dateStr >= patient.startDate;
                 const isBeforeEnd = !patient.endDate || dateStr <= patient.endDate;

                 if (isAfterStart && isBeforeEnd) {
                     sessionsInMonth++;
                 }
            }
        }

        return {
            ...patient,
            monthlySessions: sessionsInMonth,
            monthlyIncome: sessionsInMonth * patient.sessionCost
        };
    });

    // Sort Data
    return detailedData.sort((a, b) => {
        const dateA = new Date(a.startDate).getTime();
        const dateB = new Date(b.startDate).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

  }, [patients, currentDate, sortOrder]);


  const totalMonthlyIncome = reportData.reduce((sum, item) => sum + item.monthlyIncome, 0);
  const totalMonthlySessions = reportData.reduce((sum, item) => sum + item.monthlySessions, 0);

  return (
    <div className="space-y-8 animate-fade-in print:p-0 print:m-0">
      <style>{`
        @media print {
          aside, header, button, .no-print { display: none !important; }
          body, main { background: white !important; margin: 0 !important; padding: 0 !important; overflow: visible !important; }
          .print-content { padding: 20px !important; }
        }
      `}</style>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 no-print">
        <header>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FileText className="text-emerald-600" />
            التقارير الشهرية
          </h2>
          <p className="text-slate-500">جداول البيانات المالية لشهر {monthName}</p>
        </header>

        <div className="flex gap-3">
             {/* Date Nav */}
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

            <button 
            onClick={handlePrint}
            className="bg-slate-900 text-white px-4 py-2 rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-lg"
            >
            <Printer size={20} />
            <span className="hidden md:inline">طباعة</span>
            </button>
        </div>
      </div>

      <div className="print-content space-y-8">
        
        {/* Report Header (Visible mainly in print) */}
        <div className="hidden print:block text-center border-b-2 border-slate-900 pb-6 mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">عيادة د. محي للعلاج الطبيعي</h1>
          <p className="text-slate-600">التقرير المالي - {monthName}</p>
          <p className="text-sm text-slate-500 mt-2">تاريخ التقرير: {new Date().toLocaleDateString('ar-EG')}</p>
        </div>

        {/* Summary Table */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 print:shadow-none print:border-2 print:border-slate-300">
          <h3 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">ملخص شهر {monthName}</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-slate-50 rounded-xl print:bg-white print:border">
              <p className="text-slate-500 text-sm">الحالات النشطة</p>
              <p className="text-2xl font-bold text-slate-900">{reportData.length}</p>
            </div>
            <div className="p-4 bg-emerald-50 rounded-xl print:bg-white print:border">
              <p className="text-emerald-700 text-sm">إجمالي الدخل المحقق</p>
              <p className="text-2xl font-bold text-emerald-700">{totalMonthlyIncome.toLocaleString()} ج.م</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl print:bg-white print:border">
              <p className="text-blue-700 text-sm">إجمالي الجلسات</p>
              <p className="text-2xl font-bold text-blue-700">{totalMonthlySessions}</p>
            </div>
          </div>
        </div>

        {/* Detailed Patient Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden print:shadow-none print:border-2 print:border-slate-300">
          <div className="p-6 border-b border-slate-100 bg-slate-50 print:bg-white flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">تفاصيل المرضى والحسابات</h3>
            
            <button 
                onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg transition-colors no-print"
            >
                <ArrowUpDown size={14} />
                {sortOrder === 'desc' ? 'الأحدث أولاً' : 'الأقدم أولاً'}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-slate-50 text-slate-600 font-semibold text-sm print:bg-slate-100">
                <tr>
                  <th className="p-4">اسم المريض</th>
                  <th className="p-4">التشخيص</th>
                  <th className="p-4">تاريخ البدء</th>
                  <th className="p-4">أيام الجلسات</th>
                  <th className="p-4">الجلسات (الشهر)</th>
                  <th className="p-4">الإجمالي (الشهر)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.map((patient) => (
                  <tr key={patient.id} className="hover:bg-slate-50 print:hover:bg-white">
                    <td className="p-4 font-medium text-slate-900">{patient.name}</td>
                    <td className="p-4 text-slate-600">{patient.diagnosis}</td>
                    <td className="p-4 text-slate-500 text-sm">{patient.startDate}</td>
                    <td className="p-4 text-slate-600 text-sm max-w-xs">
                      {patient.scheduledDays.length > 0 
                        ? sortDays(patient.scheduledDays).map(d => ARABIC_DAYS[d]).join('، ')
                        : 'غير محدد'}
                    </td>
                    <td className="p-4 text-slate-600">{patient.monthlySessions}</td>
                    <td className="p-4 font-bold text-emerald-600">
                      {patient.monthlyIncome.toLocaleString()} ج.م
                    </td>
                  </tr>
                ))}
                {reportData.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">لا توجد سجلات في هذا الشهر</td>
                  </tr>
                )}
              </tbody>
              {reportData.length > 0 && (
                <tfoot className="bg-slate-50 font-bold print:bg-slate-100">
                  <tr>
                    <td colSpan={5} className="p-4 text-slate-800">الإجمالي الشهري</td>
                    <td className="p-4 text-emerald-700">{totalMonthlyIncome.toLocaleString()} ج.م</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        {/* Footer for Print */}
        <div className="hidden print:block mt-12 pt-8 border-t border-slate-300 text-center text-slate-400 text-sm">
          <p>تم استخراج هذا التقرير آلياً من نظام إدارة العيادة - د. محي</p>
        </div>

      </div>
    </div>
  );
};

export default ReportsPage;