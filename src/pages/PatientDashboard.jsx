import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { Activity, Calendar, CreditCard, LogOut, CheckCircle, PlayCircle } from 'lucide-react';
import { IndianRupee, Download } from 'lucide-react';


export default function PatientDashboard() {
  const [exercises, setExercises] = useState([]);
  const [payments, setPayments] = useState([]);
  const [profile, setProfile] = useState(null);
  const totalPaid = payments.filter(p => p.status === 'Paid').reduce((sum, p) => sum + Number(p.amount), 0);


  // 1. Helper function to fix YouTube links
  const getYouTubeEmbedUrl = (url) => {
    if (!url) return "";
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) 
      ? `https://www.youtube.com/embed/${match[2]}` 
      : url;
  };

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return;

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
                  /* 2. We use the helper function here to ensure the URL works */
                  src={getYouTubeEmbedUrl(ex.videoUrl)} 
                  title="Exercise Video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            )}
            
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{ex.sets} Sets • {ex.reps} Reps</p>
          </div>
        ))}
      </div>
<div className="flex justify-between items-end pt-4">
        <h3 className="font-bold text-gray-800 flex items-center"><CreditCard className="mr-2 text-yellow-500"/> Billing & History</h3>
        <p className="text-[10px] font-bold text-gray-400">TOTAL PAID: ₹{totalPaid}</p>
      </div>

      <div className="space-y-3">
        {payments.length > 0 ? payments.map(p => (
          <div key={p.id} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex justify-between items-center group active:scale-95 transition-transform">
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-2xl ${p.status === 'Paid' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                <IndianRupee size={18} />
              </div>
              <div>
                <p className="font-bold text-sm text-gray-800">Consultation Fee</p>
                <div className="flex items-center text-[10px] text-gray-400 space-x-2">
                  <span>{p.date}</span>
                  <span>•</span>
                  <span>{p.method || 'Online'}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="font-black text-gray-900">₹{p.amount}</p>
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase ${
                p.status === 'Paid' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
              }`}>
                {p.status}
              </span>
            </div>
          </div>
        )) : (
          <p className="text-center text-gray-400 text-xs py-4">No payment records found.</p>
        )}
      </div>
    </div>
  );
}