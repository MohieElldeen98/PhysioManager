import React, { useState } from 'react';
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../services/firebase';
import { UserCircle, Save, Mail, Shield, Loader2, CheckCircle, Lock, KeyRound, Eye, EyeOff, AlertCircle } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const currentUser = auth.currentUser;
  
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [loading, setLoading] = useState(false);
  
  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    setLoading(true);
    setMessage(null);

    try {
      await updateProfile(currentUser, {
        displayName: displayName
      });
      await currentUser.reload();
      setMessage({ type: 'success', text: 'تم تحديث البيانات الشخصية بنجاح' });
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'حدث خطأ أثناء تحديث البيانات' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !currentUser.email) return;

    if (newPassword !== confirmPassword) {
        setMessage({ type: 'error', text: 'كلمة المرور الجديدة وتأكيدها غير متطابقين' });
        return;
    }

    if (newPassword.length < 6) {
        setMessage({ type: 'error', text: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' });
        return;
    }

    setPasswordLoading(true);
    setMessage(null);

    try {
        // 1. Re-authenticate user
        const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
        await reauthenticateWithCredential(currentUser, credential);

        // 2. Update Password
        await updatePassword(currentUser, newPassword);

        setMessage({ type: 'success', text: 'تم تغيير كلمة المرور بنجاح' });
        
        // Reset fields
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    } catch (error: any) {
        console.error("Password update error:", error);
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
            setMessage({ type: 'error', text: 'كلمة المرور الحالية غير صحيحة' });
        } else if (error.code === 'auth/weak-password') {
            setMessage({ type: 'error', text: 'كلمة المرور ضعيفة جداً' });
        } else if (error.code === 'auth/too-many-requests') {
            setMessage({ type: 'error', text: 'تم حظر المحاولات مؤقتاً. يرجى الانتظار قليلاً.' });
        } else {
            setMessage({ type: 'error', text: 'حدث خطأ أثناء تغيير كلمة المرور' });
        }
    } finally {
        setPasswordLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!currentUser?.email) return;
    if(!window.confirm('هل تود استلام رابط إعادة تعيين كلمة المرور عبر البريد الإلكتروني بدلاً من ذلك؟')) return;
    
    try {
        await sendPasswordResetEmail(auth, currentUser.email);
        setMessage({ type: 'success', text: 'تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني' });
    } catch (e) {
        setMessage({ type: 'error', text: 'حدث خطأ أثناء إرسال البريد' });
    }
  };

  if (!currentUser) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in pb-12">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <UserCircle className="text-emerald-600" />
          الملف الشخصي
        </h2>
        <p className="text-slate-500">إدارة معلومات حسابك وكلمة المرور</p>
      </header>

      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-emerald-600 to-teal-600 relative">
            <div className="absolute -bottom-10 right-8">
                <div className="w-24 h-24 bg-white rounded-full p-1 shadow-lg">
                    <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                        <UserCircle size={64} />
                    </div>
                </div>
            </div>
        </div>
        
        <div className="pt-12 px-8 pb-8">
            
            {message && (
                <div className={`mb-6 p-4 rounded-xl flex items-center gap-2 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                    {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    {message.text}
                </div>
            )}

            <div className="space-y-8">
                {/* Basic Info Form */}
                <form onSubmit={handleSaveProfile} className="space-y-6">
                    <h3 className="font-bold text-slate-800 text-lg border-b border-slate-100 pb-2">البيانات الأساسية</h3>
                    <div className="grid gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">اسم الطبيب (الاسم المعروض)</label>
                            <input 
                                type="text" 
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                placeholder="الاسم الكامل"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">البريد الإلكتروني</label>
                            <div className="relative">
                                <input 
                                    type="email" 
                                    value={currentUser.email || ''}
                                    disabled
                                    className="w-full p-3 pl-10 border border-slate-200 bg-slate-50 text-slate-500 rounded-xl outline-none cursor-not-allowed"
                                    dir="ltr"
                                />
                                <Mail className="absolute left-3 top-3.5 text-slate-400" size={18} />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button 
                            type="submit"
                            disabled={loading}
                            className="bg-slate-900 text-white px-6 py-2.5 rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-2 font-bold shadow-lg shadow-slate-900/10"
                        >
                            {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            حفظ البيانات
                        </button>
                    </div>
                </form>

                {/* Password Change Form */}
                <form onSubmit={handleChangePassword} className="bg-slate-50 rounded-xl p-6 border border-slate-200 space-y-5">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Lock size={20} className="text-emerald-600" />
                            تغيير كلمة المرور
                        </h3>
                        <button 
                            type="button" 
                            onClick={() => setShowPasswords(!showPasswords)}
                            className="text-sm text-slate-500 hover:text-emerald-600 flex items-center gap-1"
                        >
                            {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
                            {showPasswords ? 'إخفاء' : 'إظهار'}
                        </button>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">كلمة المرور الحالية</label>
                            <div className="relative">
                                <input 
                                    type={showPasswords ? "text" : "password"}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    required
                                    className="w-full pl-4 pr-10 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                                    dir="ltr"
                                    placeholder="••••••••"
                                />
                                <KeyRound className="absolute right-3 top-3.5 text-slate-400" size={18} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">كلمة المرور الجديدة</label>
                                <div className="relative">
                                    <input 
                                        type={showPasswords ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        className="w-full pl-4 pr-10 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                                        dir="ltr"
                                        placeholder="••••••••"
                                    />
                                    <Lock className="absolute right-3 top-3.5 text-slate-400" size={18} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">تأكيد كلمة المرور الجديدة</label>
                                <div className="relative">
                                    <input 
                                        type={showPasswords ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        className="w-full pl-4 pr-10 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                                        dir="ltr"
                                        placeholder="••••••••"
                                    />
                                    <CheckCircle className="absolute right-3 top-3.5 text-slate-400" size={18} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 flex flex-col md:flex-row items-center justify-between gap-4">
                        <button
                            type="button"
                            onClick={handleForgotPassword}
                            className="text-sm text-slate-500 hover:text-slate-800 hover:underline"
                        >
                            نسيت كلمة المرور الحالية؟
                        </button>

                        <button 
                            type="submit"
                            disabled={passwordLoading || !currentPassword || !newPassword}
                            className="w-full md:w-auto bg-emerald-600 text-white px-6 py-2.5 rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 font-bold shadow-lg shadow-emerald-200"
                        >
                            {passwordLoading ? <Loader2 className="animate-spin" size={18} /> : <KeyRound size={18} />}
                            تحديث كلمة المرور
                        </button>
                    </div>
                </form>

            </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;