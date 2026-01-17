import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import PatientList from './components/PatientList';
import PatientForm from './components/PatientForm';
import CalendarView from './components/CalendarView';
import IncomeCalculator from './components/IncomeCalculator';
import StatisticsPage from './components/StatisticsPage';
import ReportsPage from './components/ReportsPage';
import AuthPage from './components/AuthPage';
import AdminPanel from './components/AdminPanel';
import PatientDetailModal from './components/PatientDetailModal';
import ProfilePage from './components/ProfilePage';
import { Patient, ADMIN_EMAIL, SessionLog, PaymentRecord } from './types';
import { Plus, Loader2 } from 'lucide-react';
import { auth, db } from './services/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc, getDoc, getDocs, addDoc } from 'firebase/firestore';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>('doctor'); // State to store Firestore role
  const [authLoading, setAuthLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null); 
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [sessionLogs, setSessionLogs] = useState<SessionLog[]>([]);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setAuthLoading(false);
        setUserRole('doctor');
      }
    });
    return () => unsubscribe();
  }, []);

  // Sync User Data & Patients
  useEffect(() => {
    if (!user) {
      setPatients([]);
      setPayments([]);
      setSessionLogs([]);
      return;
    }

    // 1. Ensure User Document Exists & Fetch Role
    const syncUserDoc = async () => {
       try {
         const userRef = doc(db, "users", user.uid);
         const userSnap = await getDoc(userRef);
         
         const isAdminEmail = user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
         let currentRole = 'doctor';

         if (!userSnap.exists()) {
             // Create new user doc
             currentRole = isAdminEmail ? 'admin' : 'doctor';
             await setDoc(userRef, {
                 uid: user.uid,
                 email: user.email,
                 displayName: user.displayName,
                 role: currentRole,
                 createdAt: new Date().toISOString(),
                 lastLogin: new Date().toISOString()
             }, { merge: true });
         } else {
             const userData = userSnap.data();
             
             // Auto-promote to admin if emails match but DB says doctor
             if (isAdminEmail && userData.role !== 'admin') {
                 await setDoc(userRef, { role: 'admin' }, { merge: true });
                 currentRole = 'admin';
             } else {
                 currentRole = userData.role || 'doctor';
             }
             
             // Update last login
             await setDoc(userRef, { lastLogin: new Date().toISOString() }, { merge: true });
         }
         
         setUserRole(currentRole);
         setAuthLoading(false);
       } catch (e) {
           console.error("Error ensuring user doc:", e);
           setAuthLoading(false);
       }
    };
    syncUserDoc();

    // 2. Setup Realtime Listener for Patients
    const q = query(collection(db, "users", user.uid, "patients"));
    const unsubPatients = onSnapshot(q, (snapshot) => {
      const patientsData = snapshot.docs.map(doc => doc.data() as Patient);
      setPatients(patientsData);
    });

    // 3. Listener for Payments (for Dashboard)
    const qPayments = query(collection(db, "users", user.uid, "payments"));
    const unsubPayments = onSnapshot(qPayments, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PaymentRecord));
        setPayments(data);
    });

    // 4. Listener for Session Logs (for Calendar)
    const qSessions = query(collection(db, "users", user.uid, "sessions"));
    const unsubSessions = onSnapshot(qSessions, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SessionLog));
        setSessionLogs(data);
    });

    return () => {
        unsubPatients();
        unsubPayments();
        unsubSessions();
    };
  }, [user]);


  const handleSavePatient = async (patient: Patient) => {
    if (!user) return;
    try {
        await setDoc(doc(db, "users", user.uid, "patients", patient.id), patient);
        setIsFormOpen(false);
        setEditingPatient(null);
        if (selectedPatient?.id === patient.id) {
            setSelectedPatient(patient);
        }
    } catch (e: any) {
        console.error(e);
        alert(`حدث خطأ أثناء حفظ البيانات:\n${e.message || 'خطأ غير معروف'}`);
    }
  };

  const handleDeletePatient = async (id: string) => {
    if (!user) return;
    if (window.confirm('هل أنت متأكد من حذف هذا المريض؟')) {
      try {
        await deleteDoc(doc(db, "users", user.uid, "patients", id));
        if (selectedPatient?.id === id) {
            setSelectedPatient(null);
        }
      } catch (e: any) {
          alert(`حدث خطأ أثناء الحذف: ${e.message}`);
          console.error(e);
      }
    }
  };

  const handleEditPatient = (patient: Patient) => {
    setSelectedPatient(null);
    setEditingPatient(patient);
    setIsFormOpen(true);
  };

  const handleUpdatePatientDirectly = async (updatedPatient: Patient) => {
    if (!user) return;
    try {
        await setDoc(doc(db, "users", user.uid, "patients", updatedPatient.id), updatedPatient);
        setSelectedPatient(updatedPatient);
    } catch (e) {
        console.error(e);
    }
  };

  // Helpers for Calendar actions
  const handleAddPayment = async (payment: Omit<PaymentRecord, 'id'>) => {
      if(!user) return;
      await addDoc(collection(db, "users", user.uid, "payments"), payment);
  };
  
  const handleAddSession = async (session: Omit<SessionLog, 'id'>) => {
      if(!user) return;
      await addDoc(collection(db, "users", user.uid, "sessions"), session);
  };

  const renderContent = () => {
    if (isFormOpen) {
      return (
        <PatientForm
          initialData={editingPatient}
          onSave={handleSavePatient}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingPatient(null);
          }}
        />
      );
    }

    if (activeTab === 'admin' && userRole !== 'admin') {
        setActiveTab('dashboard');
        return <Dashboard patients={patients} payments={payments} />;
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard patients={patients} payments={payments} />;
      case 'patients':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">قائمة المرضى</h2>
                <p className="text-slate-500">إدارة الملفات الطبية والحالات</p>
              </div>
              <button
                onClick={() => {
                  setEditingPatient(null);
                  setIsFormOpen(true);
                }}
                className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-lg shadow-emerald-200"
              >
                <Plus size={20} />
                إضافة مريض جديد
              </button>
            </div>
            <PatientList
              patients={patients}
              onEdit={handleEditPatient}
              onDelete={handleDeletePatient}
              onSelect={setSelectedPatient}
            />
          </div>
        );
      case 'calendar':
        return (
            <CalendarView 
                patients={patients} 
                sessionLogs={sessionLogs}
                onAddPayment={handleAddPayment}
                onUpdatePatient={handleUpdatePatientDirectly}
                onAddSession={handleAddSession}
            />
        );
      case 'calculator':
        return <IncomeCalculator patients={patients} />;
      case 'statistics':
        return <StatisticsPage patients={patients} />;
      case 'reports':
        return <ReportsPage patients={patients} />;
      case 'profile':
        return <ProfilePage />;
      case 'admin':
        return <AdminPanel />;
      default:
        return <Dashboard patients={patients} payments={payments} />;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin text-emerald-600 mx-auto mb-4" size={40} />
          <p className="text-slate-500 font-medium">جاري الاتصال بقاعدة البيانات...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <>
      <Layout 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setIsFormOpen(false);
          setActiveTab(tab);
        }}
        user={user}
        userRole={userRole} 
      >
        {renderContent()}
      </Layout>

      {selectedPatient && (
        <PatientDetailModal 
          patient={selectedPatient}
          onClose={() => setSelectedPatient(null)}
          onUpdatePatient={handleUpdatePatientDirectly}
          onEdit={() => handleEditPatient(selectedPatient)}
        />
      )}
    </>
  );
};

export default App;