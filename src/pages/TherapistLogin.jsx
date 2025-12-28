import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, doc, updateDoc, addDoc } from 'firebase/firestore';import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { Users, LogOut, PlusCircle, Calendar, CreditCard, Video, Clock, CheckCircle, X } from 'lucide-react';

export default function TherapistDashboard() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [incomeStats, setIncomeStats] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showBillModal, setShowBillModal] = useState(false);
  const [exerciseForm, setExerciseForm] = useState({ name: '', sets: '', reps: '', duration: '', videoUrl: '', days: 'Daily' });
  const [billForm, setBillForm] = useState({ amount: '', status: 'Pending' });

  // 1. Fetch All Data from Firebase
  const fetchData = async () => {
    try {
      // Fetch Patients
      const pSnap = await getDocs(query(collection(db, "profiles"), where("role", "==", "patient")));
      setPatients(pSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Fetch Appointments
      const aSnap = await getDocs(collection(db, "appointments"));
      const aList = aSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAppointments(aList.sort((a, b) => new Date(a.date) - new Date(b.date)));

      // Fetch Payments and Calculate Chart Data
      const paySnap = await getDocs(collection(db, "payments"));
      const payList = paySnap.docs.map(doc => doc.data());
      const monthlyData = payList.reduce((acc, curr) => {
        const month = curr.date.split('-')[1]; // Get MM from YYYY-MM-DD
        acc[month] = (acc[month] || 0) + Number(curr.amount);
        return acc;
      }, {});
      
      const chartData = Object.keys(monthlyData).sort().map(m => ({
        month: `Month ${m}`,
        total: monthlyData[m]
      }));
      setIncomeStats(chartData.length > 0 ? chartData : [{month: 'No Data', total: 0}]);

    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 2. Actions: Approve, Assign Exercise, Add Bill
  const handleApprove = async (id) => {
    await updateDoc(doc(db, "profiles", id), { is_approved: true });
    alert("Patient Approved!");
    fetchData();
  };

  const handleAssignExercise = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, "exercises"), { 
      ...exerciseForm, 
      patient_id: selectedPatient.id,      createdAt: new Date().toISOString()
    });
    alert("Exercise Assigned!");
    setSelectedPatient(null);    setExerciseForm({ name: '', sets: '', reps: '', duration: '', videoUrl: '', days: 'Daily' });
  };

  const handleAddBill = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, "payments"), { 
      ...billForm, 
      patient_id: selectedPatient.id, 
      date: new Date().toISOString().split('T')[0] 
    });
    alert("Bill Created!");
    setShowBillModal(false);
    setSelectedPatient(null);
    fetchData();
  };

  const handleLogout = () => signOut(auth).then(() => navigate('/', { replace: true }));

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8 font-sans max-w-6xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-green-100">
        <div>
          <h1 className="text-2xl font-black text-green-800 tracking-tight">Therapist Console</h1>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Real-time Management</p>
        </div>
        <button onClick={handleLogout} className="bg-red-50 text-red-500 p-3 rounded-2xl hover:bg-red-500 hover:text-white transition-all">
          <LogOut size={20}/>
        </button>
      </div>

      {/* Analytics & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white p-6 rounded-3xl shadow-sm border h-64">
          <h3 className="text-[10px] font-black text-gray-400 mb-6 uppercase tracking-widest">Revenue Growth (₹)</h3>
          <ResponsiveContainer width="100%" height="80%">
            <LineChart data={incomeStats}>
              <XAxis dataKey="month" hide />
              <Tooltip contentStyle={{borderRadius: '15px', border: 'none'}} />
              <Line type="monotone" dataKey="total" stroke="#166534" strokeWidth={4} dot={{r: 4}} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-green-800 p-6 rounded-3xl shadow-lg flex flex-col justify-center items-center text-white text-center">
          <Users size={40} className="mb-2 opacity-50" />
          <h2 className="text-4xl font-black">{patients.length}</h2>
          <p className="text-xs font-bold uppercase tracking-widest opacity-80">Total Patients</p>
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">        <div className="p-6 border-b font-bold flex justify-between items-center bg-gray-50/50">
          <span className="flex items-center"><Clock size={18} className="mr-2 text-blue-500"/> Upcoming Sessions</span>
          <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-1 rounded-lg uppercase">{appointments.length}</span>
        </div>
        <div className="divide-y divide-gray-50 max-h-60 overflow-y-auto">
          {appointments.map(a => (
            <div key={a.id} className="p-4 flex justify-between items-center">
              <div>
                <p className="font-bold text-gray-900">{a.patient_name}</p>
                <p className="text-[10px] text-gray-500">{new Date(a.date).toLocaleString()}</p>
              </div>
              <CheckCircle size={18} className="text-green-200" />
            </div>
          ))}
          {appointments.length === 0 && <p className="p-10 text-center text-gray-400 italic text-sm">No scheduled sessions.</p>}
        </div>
      </div>

      {/* Patient Directory */}
      <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
        <div className="p-6 border-b font-bold flex justify-between items-center">Patient Directory</div>
        <div className="overflow-x-auto">          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-400 uppercase text-[10px] font-black">
              <tr><th className="p-4">Name</th><th className="p-4">Status</th><th className="p-4 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y">
              {patients.map(p => (
                <tr key={p.id} className="hover:bg-green-50/30 transition-colors">
                  <td className="p-4 font-bold">{p.full_name}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black ${p.is_approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {p.is_approved ? 'APPROVED' : 'PENDING'}
                    </span>                  </td>
                  <td className="p-4 text-right space-x-2">
                    {!p.is_approved && <button onClick={() => handleApprove(p.id)} className="text-green-600 font-bold text-[10px] uppercase">Approve</button>}
                    <button onClick={() => setSelectedPatient(p)} className="text-blue-600 font-bold text-[10px] uppercase">Exercise</button>
                    <button onClick={() => {setSelectedPatient(p); setShowBillModal(true);}} className="text-gray-900 font-bold text-[10px] uppercase">Bill</button>                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Exercise Modal */}
      {selectedPatient && !showBillModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-[100]">
          <form onSubmit={handleAssignExercise} className="bg-white p-8 rounded-[2.5rem] w-full max-w-md space-y-4 shadow-2xl relative">
            <button type="button" onClick={() => setSelectedPatient(null)} className="absolute top-6 right-6 text-gray-400"><X/></button>
            <h3 className="font-black text-xl text-green-800">Assign Plan: {selectedPatient.full_name}</h3>
            <input required placeholder="Exercise Name" className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none" onChange={e => setExerciseForm({...exerciseForm, name: e.target.value})} />
            <input placeholder="YouTube Video URL" className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none" onChange={e => setExerciseForm({...exerciseForm, videoUrl: e.target.value})} />
            <div className="grid grid-cols-2 gap-4">
              <input required placeholder="Sets" type="number" className="p-4 bg-gray-50 rounded-2xl border-none" onChange={e => setExerciseForm({...exerciseForm, sets: e.target.value})} />
              <input required placeholder="Reps" type="number" className="p-4 bg-gray-50 rounded-2xl border-none" onChange={e => setExerciseForm({...exerciseForm, reps: e.target.value})} />
            </div>
            <button type="submit" className="w-full bg-green-800 text-white p-4 rounded-2xl font-bold uppercase text-xs tracking-widest">Save Exercise</button>
          </form>
        </div>
      )}

      {/* Billing Modal */}
      {showBillModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-[100]">
          <form onSubmit={handleAddBill} className="bg-white p-8 rounded-[2.5rem] w-full max-w-md space-y-4 shadow-2xl relative">
            <button type="button" onClick={() => {setShowBillModal(false); setSelectedPatient(null);}} className="absolute top-6 right-6 text-gray-400"><X/></button>            <h3 className="font-black text-xl text-yellow-600">Create Bill: {selectedPatient.full_name}</h3>
            <input required placeholder="Amount (₹)" type="number" className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none" onChange={e => setBillForm({...billForm, amount: e.target.value})} />
            <select className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none" onChange={e => setBillForm({...billForm, status: e.target.value})}>
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
            </select>            <button type="submit" className="w-full bg-yellow-400 text-green-900 p-4 rounded-2xl font-bold uppercase text-xs tracking-widest">Generate Invoice</button>          </form>
        </div>
      )}
    </div>
  );
}