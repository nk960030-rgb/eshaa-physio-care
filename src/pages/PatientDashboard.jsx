import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc, addDoc } from 'firebase/firestore';
import { Activity, CreditCard, LogOut, CheckCircle2, IndianRupee, FileText, Calendar, Clock } from 'lucide-react';

export default function PatientDashboard() {
  const [exercises, setExercises] = useState([]);
  const [payments, setPayments] = useState([]);
  const [profile, setProfile] = useState(null);
  const [completedToday, setCompletedToday] = useState([]);
  const [activeReceipt, setActiveReceipt] = useState(null);
  
  const today = new Date().toISOString().split('T')[0];

  const getYouTubeEmbedUrl = (url) => {
    if (!url) return "";
    let videoId = "";
    if (url.includes('shorts/')) videoId = url.split('shorts/')[1]?.split(/[?#]/)[0];
    else if (url.includes('youtu.be/')) videoId = url.split('youtu.be/')[1]?.split(/[?#]/)[0];
    else if (url.includes('watch?v=')) videoId = url.split('watch?v=')[1]?.split('&')[0];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  };

  const fetchData = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const profSnap = await getDoc(doc(db, "profiles", user.uid));
    setProfile(profSnap.data());
    const exSnap = await getDocs(query(collection(db, "exercises"), where("patient_id", "==", user.uid)));
    const currentExs = exSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setExercises(currentExs);
    const logSnap = await getDocs(query(collection(db, "logs"), where("patient_id", "==", user.uid), where("date", "==", today)));
    const doneIds = logSnap.docs.map(doc => doc.data().exercise_id);
    const assignedIds = currentExs.map(ex => ex.id);
    setCompletedToday([...new Set(doneIds.filter(id => assignedIds.includes(id)))]);
    const paySnap = await getDocs(query(collection(db, "payments"), where("patient_id", "==", user.uid)));
    setPayments(paySnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  useEffect(() => { 
    const unsubscribe = auth.onAuthStateChanged(user => { if (user) fetchData(); });
    return () => unsubscribe();
  }, []);

  const markAsDone = async (exId) => {
    if (completedToday.includes(exId)) return;
    setCompletedToday(prev => [...prev, exId]);
    await addDoc(collection(db, "logs"), { patient_id: auth.currentUser.uid, exercise_id: exId, date: today, timestamp: new Date() });
  };

  const handlePrint = (record) => { setActiveReceipt(record); setTimeout(() => { window.print(); setActiveReceipt(null); }, 500); };

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-20 font-sans max-w-md mx-auto space-y-6 print:p-0">
      <div className="flex justify-between items-center print:hidden">
        <h1 className="text-xl font-black text-green-800 italic">Eshaa Physio</h1>
        <button onClick={() => signOut(auth)} className="text-red-500"><LogOut size={20}/></button>
      </div>

      {/* Appointment Banner */}
      {profile?.nextSession && (
        <div className="bg-purple-600 text-white p-5 rounded-[2.5rem] shadow-lg flex items-center justify-between print:hidden animate-in fade-in zoom-in duration-500">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-2xl"><Calendar size={20}/></div>
            <div>
              <p className="text-[10px] font-black uppercase opacity-60">Next Session</p>
              <p className="font-bold text-sm">{profile.nextSession.date} at {profile.nextSession.time}</p>
            </div>
          </div>
          <Clock size={20} className="opacity-30" />
        </div>
      )}

      {/* Progress Card */}
      <div className="bg-green-800 text-white p-6 rounded-[2.5rem] shadow-lg print:hidden">
        <h2 className="text-xl font-bold">Hello, {profile?.full_name}</h2>
        <p className="opacity-60 text-[10px] font-black uppercase mb-4">{profile?.condition}</p>
        <div className="bg-white/10 p-4 rounded-2xl flex justify-between items-center border border-white/5">
          <div><p className="text-[10px] font-black opacity-60 uppercase">Today</p><p className="text-lg font-black">{completedToday.length} / {exercises.length} Done</p></div>
          <div className="h-2 w-24 bg-white/20 rounded-full overflow-hidden"><div className="h-full bg-white transition-all duration-700" style={{ width: `${(completedToday.length / (exercises.length || 1)) * 100}%` }} /></div>
        </div>
      </div>

      {/* Exercises */}
      <div className="print:hidden space-y-4">
        <h3 className="font-bold text-gray-800 px-1 flex items-center gap-2">Treatment Plan</h3>
        {exercises.map(ex => (
          <div key={ex.id} className="bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 space-y-4">
            <div className="flex gap-4 items-center">
              <button onClick={() => markAsDone(ex.id)} className={`transition-transform active:scale-90 ${completedToday.includes(ex.id) ? 'text-green-500' : 'text-gray-200'}`}><CheckCircle2 size={36} fill={completedToday.includes(ex.id) ? "currentColor" : "none"} /></button>
              <div className="flex-1"><h4 className="font-bold text-gray-900 leading-tight">{ex.name}</h4><p className="text-[10px] text-gray-400 font-bold uppercase">{ex.sets} Sets • {ex.reps} Reps</p></div>
            </div>
            {ex.videoUrl && (
              <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-inner"><iframe className="w-full h-full" src={getYouTubeEmbedUrl(ex.videoUrl)} title="Video" allowFullScreen></iframe></div>
            )}
          </div>
        ))}
      </div>

      {/* Billing */}
      <div className="print:hidden space-y-3">
        <h3 className="font-bold text-gray-800 px-1">Receipts</h3>
        {payments.map(p => (
          <div key={p.id} className="bg-white p-4 rounded-3xl border flex justify-between items-center shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-50 text-green-600 rounded-2xl"><IndianRupee size={18} /></div>
              <div><p className="font-bold text-sm">{p.date}</p><p className="text-[9px] font-black text-gray-400 uppercase">{p.status}</p></div>
            </div>
            <div className="flex items-center gap-3"><p className="font-black text-gray-900">₹{p.amount}</p><button onClick={() => handlePrint(p)} className="p-2 text-slate-300 hover:text-green-700"><FileText size={20}/></button></div>
          </div>
        ))}
      </div>

      {/* Receipt Template (Hidden on screen) */}
      {activeReceipt && (
        <div className="hidden print:block p-10 bg-white">
          <div className="flex justify-between border-b-2 pb-8">
            <div><h1 className="text-2xl font-black text-green-800">Eshaa Physio</h1><p className="text-xs font-bold text-slate-400 uppercase">Treatment Receipt</p></div>
            <div className="text-right text-xs uppercase font-bold"><p>Date: {activeReceipt.date}</p></div>
          </div>
          <div className="my-10"><p className="text-[10px] font-black uppercase text-slate-400">Patient</p><p className="text-xl font-black">{profile?.full_name}</p></div>
          <table className="w-full mt-10"><tr className="border-b text-left text-xs uppercase font-black"><th className="py-2">Description</th><th className="py-2 text-right">Amount</th></tr><tr><td className="py-6 font-bold">Physio Therapy Session</td><td className="py-6 text-right font-black">₹{activeReceipt.amount}</td></tr></table>
        </div>
      )}
    </div>
  );
}