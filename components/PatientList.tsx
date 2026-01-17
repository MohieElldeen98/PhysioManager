import React, { useState } from 'react';
import { Patient, ARABIC_DAYS } from '../types';
import { 
  Edit2, Trash2, FileText, Calendar, User, Activity, 
  MoveVertical, Move, Heart, Search, Filter, AlertCircle,
  Brain, Bone, Zap, Accessibility 
} from 'lucide-react';

interface PatientListProps {
  patients: Patient[];
  onEdit: (patient: Patient) => void;
  onDelete: (id: string) => void;
  onSelect: (patient: Patient) => void;
}

const getIconForDiagnosis = (diagnosis: string) => {
  const d = diagnosis.toLowerCase();

  // Neurological (Stroke, CP, Hemiplegia, Nerves)
  // مخ، أعصاب، جلطة، شلل
  if (d.includes('جلط') || d.includes('مخ') || d.includes('stroke') || d.includes('neuro') || d.includes('شلل') || d.includes('نصف')) {
    return <Brain size={20} />;
  }

  // Orthopedic - Fractures & Bones
  // كسور، عظام، شروخ
  if (d.includes('كسر') || d.includes('fracture') || d.includes('bone') || d.includes('عظم') || d.includes('شرخ')) {
    return <Bone size={20} />;
  }

  // Spine & Back
  // عمود فقري، ديسك، انزلاق، ظهر
  if (d.includes('ظهر') || d.includes('back') || d.includes('spine') || d.includes('فقرات') || d.includes('disk') || d.includes('ديسك') || d.includes('انزلاق')) {
    return <MoveVertical size={20} />;
  }

  // Lower Extremity (Knee, Foot, Leg, Walking issues)
  // ركبة، قدم، ساق، خشونة، رباط صليبي
  if (d.includes('ركب') || d.includes('knee') || d.includes('leg') || d.includes('قدم') || d.includes('foot') || d.includes('خشونة') || d.includes('acl')) {
    return <Activity size={20} />;
  }

  // Upper Extremity (Shoulder, Arm, Hand)
  // كتف، يد، ذراع
  if (d.includes('كتف') || d.includes('shoulder') || d.includes('arm') || d.includes('يد') || d.includes('hand')) {
    return <Move size={20} />;
  }

  // Cardiopulmonary
  // قلب، تنفس
  if (d.includes('قلب') || d.includes('heart') || d.includes('cardio') || d.includes('تنفس')) {
    return <Heart size={20} />;
  }

  // Pain / Inflammation / Nerves
  // التهاب، ألم، عصب
  if (d.includes('ألم') || d.includes('pain') || d.includes('التهاب') || d.includes('عصب') || d.includes('nerve')) {
    return <Zap size={20} />;
  }

  // Geriatrics / Mobility / Balance
  // كبار سن، توازن، مشي
  if (d.includes('مسن') || d.includes('elderly') || d.includes('توازن') || d.includes('balance') || d.includes('مشى') || d.includes('mobility')) {
    return <Accessibility size={20} />;
  }

  // Default
  return <User size={20} />;
};

const PatientList: React.FC<PatientListProps> = ({ patients, onEdit, onDelete, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'cost'>('date');

  const filteredPatients = patients
    .filter(p => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.diagnosis.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'cost') return b.sessionCost - a.sessionCost;
      if (sortBy === 'date') return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
      return 0;
    });

  const todayStr = new Date().toISOString().split('T')[0];

  if (patients.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
          <FileText size={32} />
        </div>
        <h3 className="text-lg font-bold text-slate-800">لا يوجد مرضى مسجلين</h3>
        <p className="text-slate-500 mt-2">ابدأ بإضافة مريض جديد لتتبع الجلسات</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      
      {/* Search and Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col lg:flex-row gap-4 justify-between items-center sticky top-0 z-10">
        <div className="relative w-full lg:w-1/3">
          <Search className="absolute right-3 top-3 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="بحث..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-10 pl-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
          />
        </div>

        <div className="flex gap-2 w-full lg:w-auto overflow-x-auto pb-1 lg:pb-0">
          <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
            <button 
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${statusFilter === 'active' ? 'bg-white shadow text-emerald-700' : 'text-slate-500'}`}
            >
              نشط
            </button>
            <button 
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${statusFilter === 'completed' ? 'bg-white shadow text-slate-700' : 'text-slate-500'}`}
            >
              منتهي
            </button>
            <button 
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${statusFilter === 'all' ? 'bg-white shadow text-slate-700' : 'text-slate-500'}`}
            >
              الكل
            </button>
          </div>

          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-4 py-2 bg-slate-100 border-none rounded-xl text-slate-600 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer"
          >
            <option value="date">الأحدث</option>
            <option value="name">الاسم</option>
            <option value="cost">السعر</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="grid gap-3">
        {filteredPatients.map((patient) => {
            const isExpired = patient.status === 'active' && patient.endDate && patient.endDate < todayStr;
            
            return (
            <div 
                key={patient.id} 
                onClick={() => onSelect(patient)}
                className={`bg-white rounded-xl shadow-sm border border-slate-100 p-4 hover:shadow-md transition-all cursor-pointer relative overflow-hidden group ${
                    patient.status === 'completed' ? 'bg-slate-50/50' : ''
                }`}
            >
                {/* Expired Indicator */}
                {isExpired && (
                    <div className="absolute top-0 right-0 bg-red-500 w-2 h-full w-[4px]"></div>
                )}

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Dynamic Icon based on diagnosis */}
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${patient.status === 'completed' ? 'bg-slate-200 text-slate-500' : 'bg-emerald-100 text-emerald-600'}`}>
                            {getIconForDiagnosis(patient.diagnosis)}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className={`font-bold text-slate-800 ${patient.status === 'completed' ? 'line-through decoration-slate-400 opacity-60' : ''}`}>
                                    {patient.name}
                                </h3>
                                {isExpired && (
                                    <span className="text-[10px] bg-red-100 text-red-600 px-1.5 rounded flex items-center gap-1">
                                        <AlertCircle size={10} /> منتهية زمنياً
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-500">{patient.diagnosis}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                         <div className="text-right hidden sm:block">
                            <span className="block font-bold text-slate-900">{patient.sessionCost} ج.م</span>
                            <span className="text-[10px] text-slate-400">للجلسة</span>
                        </div>

                         <div className="flex gap-2">
                            <button 
                                onClick={(e) => { e.stopPropagation(); onEdit(patient); }}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDelete(patient.id); }}
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )})}
        
        {filteredPatients.length === 0 && (
            <div className="text-center py-8 text-slate-400">
                لا توجد نتائج
            </div>
        )}
      </div>
    </div>
  );
};

export default PatientList;