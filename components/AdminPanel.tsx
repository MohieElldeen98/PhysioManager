import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, Activity, Search, Mail, Calendar, Loader2, Trash2, Edit2, Check, X, Shield, AlertTriangle } from 'lucide-react';
import { db, auth } from '../services/firebase';
import { collection, getDocs, query, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';

interface UserData {
  uid: string;
  displayName: string;
  email: string;
  role: string;
  createdAt: string;
  lastLogin?: string;
}

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const usersData = querySnapshot.docs.map(doc => doc.data() as UserData);
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleRole = async (targetUser: UserData) => {
    if (targetUser.email === auth.currentUser?.email) {
        alert("لا يمكنك تغيير صلاحياتك بنفسك!");
        return;
    }

    const newRole = targetUser.role === 'admin' ? 'doctor' : 'admin';
    const actionName = newRole === 'admin' ? 'ترقية' : 'إلغاء صلاحيات';
    
    if (!window.confirm(`هل أنت متأكد من ${actionName} المستخدم "${targetUser.displayName}"؟`)) return;

    setActionLoading(targetUser.uid);
    try {
        const userRef = doc(db, "users", targetUser.uid);
        await updateDoc(userRef, { role: newRole });
        
        // Update local state
        setUsers(users.map(u => u.uid === targetUser.uid ? { ...u, role: newRole } : u));
        
    } catch (error) {
        console.error("Error updating role:", error);
        alert("حدث خطأ أثناء تحديث الصلاحيات");
    } finally {
        setActionLoading(null);
    }
  };

  const handleDeleteUser = async (targetUser: UserData) => {
    if (targetUser.email === auth.currentUser?.email) {
        alert("لا يمكنك حذف حسابك من هنا!");
        return;
    }

    if (!window.confirm(`تحذير خطير: هل أنت متأكد تماماً من حذف المستخدم "${targetUser.displayName}"؟\n\nسيتم حذف سجلاته من قاعدة البيانات ولن يتمكن من استخدام النظام.`)) return;

    setActionLoading(targetUser.uid);
    try {
        // Delete from Firestore
        await deleteDoc(doc(db, "users", targetUser.uid));
        
        // Remove from local list
        setUsers(users.filter(u => u.uid !== targetUser.uid));
        
    } catch (error) {
        console.error("Error deleting user:", error);
        alert("حدث خطأ أثناء حذف المستخدم");
    } finally {
        setActionLoading(null);
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (user.displayName && user.displayName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <ShieldCheck className="text-emerald-600" />
          لوحة تحكم المدير
        </h2>
        <p className="text-slate-500">التحكم الكامل في المستخدمين والصلاحيات.</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">إجمالي المستخدمين</p>
            <h3 className="text-3xl font-bold text-slate-800">{loading ? '-' : users.length}</h3>
          </div>
          <div className="bg-blue-50 text-blue-600 p-3 rounded-xl">
            <Users size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm font-medium mb-1">عدد المدراء</p>
            <h3 className="text-3xl font-bold text-slate-800">
               {loading ? '-' : users.filter(u => u.role === 'admin').length} 
            </h3>
          </div>
          <div className="bg-purple-50 text-purple-600 p-3 rounded-xl">
            <Shield size={24} />
          </div>
        </div>
        
        <div className="bg-slate-900 p-6 rounded-2xl shadow-lg text-white">
          <p className="text-slate-400 text-sm font-medium mb-1">حالة النظام</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="font-bold">قاعدة البيانات متصلة</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Firebase Firestore</p>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <h3 className="text-lg font-bold text-slate-800">إدارة الأطباء المسجلين</h3>
          
          <div className="relative w-full md:w-64">
            <Search className="absolute right-3 top-3 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="بحث بالاسم أو البريد..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
            />
          </div>
        </div>

        {loading ? (
            <div className="p-12 text-center">
                <Loader2 className="animate-spin text-emerald-600 mx-auto mb-4" size={32} />
                <p className="text-slate-500">جاري تحميل بيانات المستخدمين...</p>
            </div>
        ) : (
            <div className="overflow-x-auto">
            <table className="w-full text-right">
                <thead className="bg-slate-50 text-slate-600 font-semibold text-sm">
                <tr>
                    <th className="p-4">اسم الطبيب</th>
                    <th className="p-4">البريد الإلكتروني</th>
                    <th className="p-4">آخر دخول</th>
                    <th className="p-4">الصلاحية</th>
                    <th className="p-4 text-center">تحكم</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => (
                    <tr key={user.uid} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                                {user.displayName ? user.displayName.charAt(0) : 'U'}
                            </div>
                            <div>
                                <span className="block font-medium text-slate-900">{user.displayName || 'بدون اسم'}</span>
                                <span className="text-xs text-slate-400">{new Date(user.createdAt).toLocaleDateString('ar-EG')}</span>
                            </div>
                        </div>
                    </td>
                    <td className="p-4 text-slate-600">
                        <div className="flex items-center gap-2">
                            <Mail size={14} className="text-slate-400" />
                            {user.email}
                        </div>
                    </td>
                     <td className="p-4 text-slate-500 text-sm">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('ar-EG') : '-'}
                    </td>
                    <td className="p-4">
                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                            user.role === 'admin' 
                            ? 'bg-purple-100 text-purple-700' 
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                            {user.role === 'admin' ? 'مدير النظام' : 'طبيب'}
                        </span>
                    </td>
                    <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                             {actionLoading === user.uid ? (
                                 <Loader2 className="animate-spin text-slate-400" size={18} />
                             ) : (
                                 <>
                                    <button 
                                        onClick={() => handleToggleRole(user)}
                                        title={user.role === 'admin' ? "تحويل لطبيب" : "ترقية لمدير"}
                                        className={`p-2 rounded-lg transition-colors ${
                                            user.role === 'admin' 
                                            ? 'text-purple-600 hover:bg-purple-50' 
                                            : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                                        }`}
                                    >
                                        <Shield size={18} />
                                    </button>
                                    
                                    <button 
                                        onClick={() => handleDeleteUser(user)}
                                        title="حذف المستخدم"
                                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                 </>
                             )}
                        </div>
                    </td>
                    </tr>
                ))}
                
                {filteredUsers.length === 0 && (
                    <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400">
                            لا يوجد مستخدمين يطابقون البحث
                        </td>
                    </tr>
                )}
                </tbody>
            </table>
            </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
          <AlertTriangle className="text-blue-500 shrink-0" size={24} />
          <div className="text-sm text-blue-800">
            <p className="font-bold mb-1">تعليمات المدير:</p>
            <ul className="list-disc list-inside space-y-1">
                <li><strong>تغيير الصلاحية:</strong> يمكنك ترقية أي طبيب ليصبح مديراً (Admin) وسيحصل على صلاحية الدخول لهذه اللوحة.</li>
                <li><strong>حذف المستخدم:</strong> سيؤدي لحذف بيانات الطبيب من قاعدة البيانات (Firestore). لن يتمكن من استخدام التطبيق حتى لو كان حسابه لا يزال سارياً في المصادقة (Auth).</li>
            </ul>
          </div>
      </div>
    </div>
  );
};

export default AdminPanel;