import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc, Timestamp, doc, getDoc } from 'firebase/firestore';
import { Activity, Calendar, CreditCard, LogOut, CheckCircle, X } from 'lucide-react';

export default function PatientDashboard() {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState([]);
  const [profile, setProfile] = useState(null);
  const [showBooking, setShowBooking] = useState(false);
  const [apptDate, setApptDate] = useState('');
  const [payments, setPayments] = useState([]);


  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const paySnap = await getDocs(query(collection(db, "payments"), where("patient_id", "==", user.uid)));
setPayments(paySnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));


      // Fetch Profile
      const profSnap = await getDoc(doc(db, "profiles", user.uid));
      setProfile(profSnap.data());      // Fetch Exercises
      const q = query(collection(db, "exercises"), where("patient_id", "==", user.uid));
      const snap = await getDocs(q);
      setExercises(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };    fetchData();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

const handleBooking = async (e) => {
  e.preventDefault();  if (!apptDate) return alert("Please select a date and time");

  try {
    await addDoc(collection(db, "appointments"), {
      patient_id: auth.currentUser.uid,
      patient_name: profile?.full_name || "John Doe",
      date: apptDate,
      status: 'scheduled',
      timestamp: Timestamp.now()
    });
    alert("Appointment Confirmed!");
    setShowBooking(false);
    window.location.reload(); // Refresh to ensure data sync
  } catch (error) {
    console.error("Booking Error:", error);
    alert("Failed to book: " + error.message);
  }
};



  if (!profile?.is_approved) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-center p-6 bg-gray-50">
        <div className="bg-yellow-100 p-6 rounded-full mb-4 text-yellow-600 font-bold">!</div>
        <h2 className="text-2xl font-bold">Approval Pending</h2>
        <p className="text-gray-500 mt-2">A therapist must approve your account before you can see your exercises.</p>
        <button onClick={handleLogout} className="mt-6 text-blue-600 font-bold">Logout</button>
      </div>    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-20 font-sans">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex justify-between items-center">          <h1 className="text-2xl font-bold text-blue-600">Eshaa Physio</h1>
          <button onClick={handleLogout} className="text-red-500"><LogOut size={20}/></button>
        </div>

        <div className="bg-blue-600 text-white p-6 rounded-3xl shadow-lg">
          <h2 className="text-xl font-bold">Welcome, {profile?.full_name}</h2>
          <p className="opacity-80 text-sm">Condition: {profile?.condition}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => setShowBooking(true)} className="bg-white p-5 rounded-2xl shadow-sm border flex flex-col items-center">
            <Calendar className="text-blue-500 mb-2" size={24}/>
            <span className="text-xs font-bold">Book Appt</span>
          </button>
          <button className="bg-white p-5 rounded-2xl shadow-sm border flex flex-col items-center">
            <CreditCard className="text-green-500 mb-2" size={24}/>
            <span className="text-xs font-bold">Billing</span>
          </button>
        </div>

        <h3 className="font-bold text-gray-800 text-lg flex items-center">
          <Activity className="mr-2 text-blue-600" size={18}/> My Program
        </h3>

        <div className="space-y-3">
          {exercises.map(ex => (
            <div key={ex.id} className="bg-white p-4 rounded-2xl shadow-sm border flex justify-between items-center">              <div>
                <h4 className="font-bold text-gray-900">{ex.name}</h4>
                <p className="text-xs text-gray-500">{ex.sets} Sets • {ex.reps} Reps • {ex.duration}</p>
              </div>
              <CheckCircle className="text-blue-100" size={24} />
            </div>
          ))}
          {exercises.length === 0 && <p className="text-center text-gray-400 py-10 italic">No exercises assigned yet.</p>}
        </div>
      </div>
       <h3 className="font-bold text-gray-800 text-lg mt-8 flex items-center">

{/* Header Card */}
<div className="bg-green-800 text-white p-6 rounded-3xl shadow-xl">
  <h2 className="text-2xl font-bold">Hello, {profile?.full_name}</h2></div>

{/* Buttons */}
<button onClick={() => setShowBooking(true)} className="bg-yellow-400 text-green-900 p-5 rounded-2xl shadow-sm border-none flex flex-col items-center">
  <Calendar className="mb-2" size={24}/>
  <span className="text-xs font-bold">Book Appt</span>
</button>



  <CreditCard className="mr-2 text-green-600" size={18}/> Payment History
</h3>
<div className="space-y-3 mt-3">
  {payments.map(p => (
    <div key={p.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">      <div>
        <p className="font-bold text-gray-900">Session Fee</p>
        <p className="text-[10px] text-gray-500">{p.date}</p>
      </div>
      <div className="text-right">
        <p className="font-bold text-gray-900">₹{p.amount}</p>
        <span className={`text-[10px] font-black ${p.status === 'Paid' ? 'text-green-500' : 'text-red-500'}`}>
          {p.status.toUpperCase()}
        </span>
      </div>
    </div>
  ))}
</div>


      {showBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <form onSubmit={handleBooking} className="bg-white p-6 rounded-3xl w-full max-w-md space-y-4 relative">
            <button type="button" onClick={() => setShowBooking(false)} className="absolute top-4 right-4 text-gray-400"><X/></button>
            <h3 className="font-bold text-xl">Schedule Session</h3>            <input type="datetime-local" className="w-full p-4 bg-gray-50 rounded-2xl border-none" onChange={e => setApptDate(e.target.value)} required />
            <button type="submit" className="w-full bg-blue-600 text-white p-4 rounded-2xl font-bold">Confirm Booking</button>
          </form>
        </div>      )}
    </div>
  );
}