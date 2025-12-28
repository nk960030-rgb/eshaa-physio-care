import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, doc, updateDoc, addDoc, Timestamp } from 'firebase/firestore';
import { LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Users, LogOut, PlusCircle, Calendar, CreditCard, Video, X } from 'lucide-react';

export default function TherapistDashboard() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [realIncome, setRealIncome] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showBillModal, setShowBillModal] = useState(false);
  const [exerciseForm, setExerciseForm] = useState({ name: '', sets: '', reps: '', duration: '', videoUrl: '' });
  const [billForm, setBillForm] = useState({ amount: '', status: 'Pending' });

  const fetchData = async () => {
    // Fetch Patients
    const pSnap = await getDocs(query(collection(db, "profiles"), where("role", "==", "patient")));
    setPatients(pSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    // Fetch Appointments
    const aSnap = await getDocs(collection(db, "appointments"));
    setAppointments(aSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    // Fetch Real Payments for Chart
    const paySnap = await getDocs(collection(db, "payments"));
    const payList = paySnap.docs.map(doc => doc.data());
    const monthlyData = payList.reduce((acc, curr) => {      const date = curr.date.split('-')[1]; // Get month
      acc[date] = (acc[date] || 0) + Number(curr.amount);
      return acc;
    }, {});
    setRealIncome(Object.keys(monthlyData).map(k => ({ month: k, total: monthlyData[k] })));
  };

  useEffect(() => { fetchData(); }, []);

  const handleAssignExercise = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, "exercises"), { ...exerciseForm, patient_id: selectedPatient.id });
    alert("Exercise & Video Assigned!");
    setSelectedPatient(null);
  };

  const handleAddBill = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, "payments"), { 
      ...billForm,       patient_id: selectedPatient.id, 
      date: new Date().toISOString().split('T')[0] 
    });
    alert("Bill Generated!");
    setShowBillModal(false);
    setSelectedPatient(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8 font-sans max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-green-100">
        <h1 className="text-2xl font-black text-green-800 tracking-tight">Therapist Console</h1>
        <button onClick={() => signOut(auth).then(() => navigate('/'))} className="bg-red-50 text-red-500 p-3 rounded-2xl"><LogOut size={20}/></button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border h-64">
          <h3 className="text-[10px] font-black text-gray-400 mb-4 uppercase">Real Income Growth</h3>
          <ResponsiveContainer width="100%" height="80%">
            <LineChart data={realIncome}><Line type="monotone" dataKey="total" stroke="#166534" strokeWidth={4} dot={true}/></LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border flex flex-col justify-center items-center">
          <p className="text-3xl font-black text-green-800">{patients.length}</p>
          <p className="text-gray-500 font-bold uppercase text-xs">Total Patients</p>        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
        <div className="p-6 border-b font-bold flex justify-between items-center">Patient Directory <Users size={18}/></div>
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-400 uppercase text-[10px] font-black">
            <tr><th className="p-4">Name</th><th className="p-4">Status</th><th className="p-4">Actions</th></tr>
          </thead>
          <tbody className="divide-y">
            {patients.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="p-4 font-bold">{p.full_name}</td>
                <td className="p-4"><span className={`px-2 py-1 rounded-lg text-[10px] font-black ${p.is_approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{p.is_approved ? 'APPROVED' : 'PENDING'}</span></td>
                <td className="p-4 space-x-3">
                  <button onClick={() => setSelectedPatient(p)} className="text-blue-600 font-bold text-xs flex items-center inline-flex"><Video size={14} className="mr-1"/> Exercise</button>
                  <button onClick={() => {setSelectedPatient(p); setShowBillModal(true);}} className="text-green-700 font-bold text-xs flex items-center inline-flex"><CreditCard size={14} className="mr-1"/> Bill</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Exercise & Video Modal */}
      {selectedPatient && !showBillModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <form onSubmit={handleAssignExercise} className="bg-white p-8 rounded-3xl w-full max-w-md space-y-4">
            <h3 className="font-bold text-xl">Assign Video & Plan: {selectedPatient.full_name}</h3>
            <input required placeholder="Exercise Name" className="w-full p-4 bg-gray-50 rounded-2xl border-none" onChange={e => setExerciseForm({...exerciseForm, name: e.target.value})} />
            <input placeholder="YouTube Video URL" className="w-full p-4 bg-gray-50 rounded-2xl border-none" onChange={e => setExerciseForm({...exerciseForm, videoUrl: e.target.value})} />
            <div className="grid grid-cols-2 gap-4">
              <input required placeholder="Sets" type="number" className="p-4 bg-gray-50 rounded-2xl border-none" onChange={e => setExerciseForm({...exerciseForm, sets: e.target.value})} />
              <input required placeholder="Reps" type="number" className="p-4 bg-gray-50 rounded-2xl border-none" onChange={e => setExerciseForm({...exerciseForm, reps: e.target.value})} />
            </div>
            <button type="submit" className="w-full bg-green-800 text-white p-4 rounded-2xl font-bold">Save Plan</button>
            <button type="button" onClick={() => setSelectedPatient(null)} className="w-full text-gray-400">Cancel</button>
          </form>
        </div>
      )}

      {/* Billing Modal */}
      {showBillModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <form onSubmit={handleAddBill} className="bg-white p-8 rounded-3xl w-full max-w-md space-y-4">
            <h3 className="font-bold text-xl">Generate Bill: {selectedPatient.full_name}</h3>
            <input required placeholder="Amount (₹)" type="number" className="w-full p-4 bg-gray-50 rounded-2xl border-none" onChange={e => setBillForm({...billForm, amount: e.target.value})} />
            <select className="w-full p-4 bg-gray-50 rounded-2xl border-none" onChange={e => setBillForm({...billForm, status: e.target.value})}>
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
            </select>
            <button type="submit" className="w-full bg-yellow-400 text-green-900 p-4 rounded-2xl font-bold">Create Bill</button>
            <button type="button" onClick={() => {setShowBillModal(false); setSelectedPatient(null);}} className="w-full text-gray-400">Cancel</button>
          </form>
        </div>
      )}
    </div>  );
}