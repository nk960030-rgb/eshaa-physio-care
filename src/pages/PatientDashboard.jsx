import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { Activity, Calendar, CreditCard, LogOut, CheckCircle, PlayCircle } from 'lucide-react';

export default function PatientDashboard() {
  const [exercises, setExercises] = useState([]);
  const [payments, setPayments] = useState([]);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      const profSnap = await getDoc(doc(db, "profiles", user.uid));
      setProfile(profSnap.data());

      const exSnap = await getDocs(query(collection(db, "exercises"), where("patient_id", "==", user.uid)));
      setExercises(exSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const paySnap = await getDocs(query(collection(db, "payments"), where("patient_id", "==", user.uid)));
      setPayments(paySnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-20 font-sans max-w-md mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-black text-green-800 tracking-tight">Eshaa Physio</h1>
        <button onClick={() => signOut(auth)} className="text-red-500"><LogOut size={20}/></button>
      </div>

      <div className="bg-green-800 text-white p-6 rounded-3xl shadow-lg">
        <h2 className="text-xl font-bold">Welcome, {profile?.full_name}</h2>
        <p className="opacity-80 text-xs">Plan: {profile?.condition}</p>
      </div>

      <h3 className="font-bold text-gray-800 flex items-center"><Activity className="mr-2 text-green-600"/> My Exercises</h3>
      <div className="space-y-4">
        {exercises.map(ex => (
          <div key={ex.id} className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-gray-900">{ex.name}</h4>
              <CheckCircle className="text-green-100" />
            </div>
            {ex.videoUrl && (
              <div className="aspect-video bg-gray-100 rounded-2xl overflow-hidden relative group">
                <iframe 
                  className="w-full h-full" 
                  src={ex.videoUrl.replace("watch?v=", "embed/")} 
                  title="Exercise Video"
                  allowFullScreen
                ></iframe>
              </div>
            )}
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{ex.sets} Sets • {ex.reps} Reps</p>
          </div>
        ))}
      </div>

      <h3 className="font-bold text-gray-800 flex items-center pt-4"><CreditCard className="mr-2 text-yellow-500"/> Billing & Payments</h3>
      <div className="space-y-3">        {payments.map(p => (
          <div key={p.id} className="bg-white p-4 rounded-2xl border flex justify-between items-center">
            <div>
              <p className="font-bold text-sm">Consultation Fee</p>
              <p className="text-[10px] text-gray-400">{p.date}</p>
            </div>
            <div className="text-right">              <p className="font-bold text-green-800">₹{p.amount}</p>
              <span className={`text-[10px] font-black ${p.status === 'Paid' ? 'text-green-500' : 'text-orange-500'}`}>{p.status.toUpperCase()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}