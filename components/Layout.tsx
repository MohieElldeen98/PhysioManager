import React, { useState } from 'react';
import { Activity, Users, Calendar, BarChart2, Stethoscope, Calculator, LogOut, ShieldCheck, FileText, PieChart, UserCircle, Menu, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { auth } from '../services/firebase';
import { User } from 'firebase/auth';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user?: User | null;
  userRole?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, user, userRole }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const currentUser = user || auth.currentUser;
  const isAdmin = userRole === 'admin';
  const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'دكتور';

  const navItems = [
    { id: 'dashboard', label: 'لوحة المعلومات', icon: <BarChart2 size={20} /> },
    { id: 'patients', label: 'المرضى والحالات', icon: <Users size={20} /> },
    { id: 'calendar', label: 'جدول الجلسات', icon: <Calendar size={20} /> },
    { id: 'calculator', label: 'حاسبة الدخل', icon: <Calculator size={20} /> },
    { id: 'statistics', label: 'الإحصائيات', icon: <PieChart size={20} /> },
    { id: 'reports', label: 'التقارير', icon: <FileText size={20} /> },
    { id: 'profile', label: 'الملف الشخصي', icon: <UserCircle size={20} /> },
  ];

  if (isAdmin) {
    navItems.push({ id: 'admin', label: 'لوحة المدير', icon: <ShieldCheck size={20} /> });
  }

  const handleLogout = async () => {
    try {
      if (window.confirm('هل تود تسجيل الخروج؟')) {
        await auth.signOut();
      }
    } catch (error) {
      console.error("Logout failed", error);
      alert("حدث خطأ أثناء تسجيل الخروج");
    }
  };

  const SidebarContent = () => (
    <>
      <div className={`p-4 flex items-center gap-3 border-b border-slate-800 ${collapsed ? 'justify-center' : ''} transition-all`}>
        <div className="bg-emerald-500 p-2 rounded-lg shrink-0">
          <Stethoscope size={24} className="text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-lg font-bold truncate text-white" title={displayName}>{displayName}</h1>
            <p className="text-xs text-slate-400">إدارة الجلسات المنزلية</p>
          </div>
        )}
      </div>

      <nav className="p-3 space-y-2 flex-1 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => {
              setActiveTab(item.id);
              setMobileMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative ${
              activeTab === item.id
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            } ${collapsed ? 'justify-center' : ''}`}
            title={collapsed ? item.label : ''}
            type="button"
          >
            <div className="shrink-0">{item.icon}</div>
            {!collapsed && <span className="font-medium whitespace-nowrap">{item.label}</span>}
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-slate-800 space-y-4">
        {!collapsed && (
          <div className="px-3">
            <p className="text-xs text-slate-500 mb-1">المستخدم الحالي</p>
            <p className="text-sm font-bold truncate text-slate-300" title={currentUser?.email || ''}>{currentUser?.email}</p>
            {isAdmin && <span className="text-[10px] bg-purple-500 text-white px-2 py-0.5 rounded-full inline-block mt-1">مدير النظام</span>}
          </div>
        )}

        <button 
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-400 hover:bg-slate-800 hover:text-red-300 transition-colors ${collapsed ? 'justify-center' : ''}`}
          title="تسجيل الخروج"
          type="button"
        >
          <LogOut size={20} />
          {!collapsed && <span className="font-medium">تسجيل الخروج</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-20 shadow-md">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-500 p-1.5 rounded-lg">
            <Stethoscope size={20} className="text-white" />
          </div>
          <span className="font-bold">د. محي</span>
        </div>
        <button onClick={() => setMobileMenuOpen(true)} className="p-2">
          <Menu size={24} />
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-30 md:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
          <aside className="absolute top-0 right-0 w-64 h-full bg-slate-900 text-white flex flex-col shadow-2xl transition-transform">
             <div className="absolute top-4 left-4">
                <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-white">
                  <X size={24} />
                </button>
             </div>
             <SidebarContent />
          </aside>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside 
        className={`hidden md:flex flex-col h-screen sticky top-0 bg-slate-900 text-white transition-all duration-300 z-10 ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -left-3 top-8 bg-emerald-500 rounded-full p-1 text-white shadow-lg border-2 border-slate-50 hover:bg-emerald-600 transition-colors z-50"
        >
          {collapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-[calc(100vh-60px)] md:h-screen p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;