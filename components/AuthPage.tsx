import React, { useState } from 'react';
import { auth, db } from '../services/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile,
  setPersistence, 
  browserLocalPersistence, 
  browserSessionPersistence,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Stethoscope, ArrowRight, Loader2, Lock, Mail, User, Eye, EyeOff, KeyRound, CheckCircle } from 'lucide-react';
import { ADMIN_EMAIL } from '../types';

type AuthView = 'login' | 'signup' | 'forgot';

const AuthPage: React.FC = () => {
  const [view, setView] = useState<AuthView>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      if (view === 'forgot') {
        await sendPasswordResetEmail(auth, email);
        setSuccessMessage('تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني.');
        setLoading(false);
        return;
      }

      const persistenceType = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistenceType);

      if (view === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        if (!name.trim()) {
            throw new Error('missing-name');
        }
        // 1. Create User
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. Update Display Name immediately
        await updateProfile(user, {
            displayName: name
        });

        // 3. Create User Document in Firestore
        try {
          await setDoc(doc(db, "users", user.uid), {
            uid: user.uid,
            email: user.email,
            displayName: name,
            role: user.email === ADMIN_EMAIL ? 'admin' : 'doctor',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
          });
        } catch (dbError) {
          console.error("Error creating user profile in DB:", dbError);
        }

        await user.reload();
      }
    } catch (err: any) {
      console.error(err);
      if (err.message === 'missing-name') {
        setError('يرجى كتابة الاسم الكامل');
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('البريد الإلكتروني مسجل بالفعل');
      } else if (err.code === 'auth/weak-password') {
        setError('كلمة المرور ضعيفة جداً');
      } else if (err.code === 'auth/too-many-requests') {
        setError('تم حظر الدخول مؤقتاً بسبب تكرار المحاولات الفاشلة. يرجى المحاولة لاحقاً.');
      } else {
        setError('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    switch(view) {
      case 'login': return 'تسجيل الدخول';
      case 'signup': return 'إنشاء حساب جديد';
      case 'forgot': return 'استعادة كلمة المرور';
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-emerald-600 p-8 text-center relative overflow-hidden">
          <div className="relative z-10">
            <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              {view === 'forgot' ? (
                <KeyRound size={32} className="text-white" />
              ) : (
                <Stethoscope size={32} className="text-white" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">د. محي</h1>
            <p className="text-emerald-100 text-sm">نظام إدارة العيادة المنزلية</p>
          </div>
          <div className="absolute top-0 left-0 w-full h-full bg-emerald-600 opacity-50"></div>
          <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        </div>

        {/* Form */}
        <div className="p-8 flex-1">
          <h2 className="text-xl font-bold text-slate-800 mb-6 text-center">
            {getTitle()}
          </h2>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-6 border border-red-100 text-center animate-fade-in">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl text-sm mb-6 border border-emerald-100 text-center animate-fade-in flex items-center justify-center gap-2">
              <CheckCircle size={16} />
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Name Input (Only for Signup) */}
            {view === 'signup' && (
                <div className="animate-fade-in">
                <label className="block text-sm font-medium text-slate-700 mb-1">الاسم الكامل (للعرض)</label>
                <div className="relative">
                    <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    placeholder="د. محي الدين"
                    />
                    <User className="absolute right-3 top-3.5 text-slate-400" size={18} />
                </div>
                </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">البريد الإلكتروني</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  placeholder="name@example.com"
                  dir="ltr"
                />
                <Mail className="absolute right-3 top-3.5 text-slate-400" size={18} />
              </div>
            </div>

            {view !== 'forgot' && (
              <div className="animate-fade-in">
                <label className="block text-sm font-medium text-slate-700 mb-1">كلمة المرور</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    placeholder="••••••••"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-emerald-600 transition-colors p-1"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {/* Remember Me & Forgot Password (Only for Login) */}
            {view === 'login' && (
              <div className="flex items-center justify-between pt-1 animate-fade-in">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                  />
                  <label htmlFor="rememberMe" className="text-sm text-slate-600 cursor-pointer select-none">
                    تذكرني
                  </label>
                </div>
                
                <button
                  type="button"
                  onClick={() => {
                    setView('forgot');
                    setError('');
                    setSuccessMessage('');
                  }}
                  className="text-sm text-emerald-600 font-bold hover:underline outline-none"
                >
                  نسيت كلمة المرور؟
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  {view === 'login' && 'دخول'}
                  {view === 'signup' && 'تسجيل حساب'}
                  {view === 'forgot' && 'إرسال رابط الاستعادة'}
                  {view !== 'forgot' && <ArrowRight size={18} className="rotate-180" />}
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            {view === 'forgot' ? (
              <button
                onClick={() => {
                  setView('login');
                  setError('');
                  setSuccessMessage('');
                }}
                className="text-slate-500 hover:text-slate-800 text-sm font-medium flex items-center justify-center gap-2 mx-auto"
              >
                <ArrowRight size={16} />
                العودة لتسجيل الدخول
              </button>
            ) : (
              <p className="text-sm text-slate-500">
                {view === 'login' ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'}
                <button
                  onClick={() => {
                      setView(view === 'login' ? 'signup' : 'login');
                      setError('');
                      setSuccessMessage('');
                  }}
                  className="text-emerald-600 font-bold mr-1 hover:underline outline-none"
                >
                  {view === 'login' ? 'أنشئ حساباً جديداً' : 'سجل دخولك'}
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;