import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, doc, updateDoc, addDoc } from 'firebase/firestore';
import { LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell, Tooltip, XAxis } from 'recharts';
import { Users, LogOut, PlusCircle, Calendar, CheckCircle, Clock, X } from 'lucide-react';

export default function TherapistDashboard() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);  const [exerciseForm, setExerciseForm] = useState({ name: '', sets: '', reps: '', duration: '', days: 'Daily' });

  // Static Data for Charts
  const incomeData = [
    { name: 'W1', income: 4000 },
    { name: 'W2', income: 9500 },
    { name: 'W3', income: 7000 },    { name: 'W4', income: 12000 }
  ];

  const flowData = [
    { name: 'New', value: 35 },
    { name: 'Returning', value: 65 }
  ];
  const COLORS = ['#16a34a', '#e2e8f0'];

  const fetchData = async () => {
    try {
      // 1. Fetch Patients
      const pQuery = query(collection(db, "profiles"), where("role", "==", "patient"));
      const pSnap = await getDocs(pQuery);
      setPatients(pSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // 2. Fetch Appointments
      const aSnap = await getDocs(collection(db, "appointments"));
      const aList = aSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort by date closest to today
      setAppointments(aList.sort((a, b) => new Date(a.date) - new Date(b.date)));
    } catch (error) {
      console.error("Error fetching therapist data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = () => {
    signOut(auth).then(() => navigate('/', { replace: true }));
  };

  const handleApprove = async (patientId) => {
    await updateDoc(doc(db, "profiles", patientId), { is_approved: true });
    alert("Patient Approved Successfully!");
    fetchData();
  };

  const handleAssignExercise = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "exercises"), {
        ...exerciseForm,
        patient_id: selectedPatient.id,
        created_at: new Date().toISOString()
      });
      alert(`Exercise assigned to ${selectedPatient.full_name}`);
      setSelectedPatient(null);
      setExerciseForm({ name: '', sets: '', reps: '', duration: '', days: 'Daily' });
    } catch (err) {
      alert("Error assigning exercise");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
        <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-2xl font-black text-gray-800 tracking-tight">Therapist Console</h1>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Eshaa Physio Care</p>
          </div>
          <button onClick={handleLogout} className="bg-red-50 text-red-500 p-3 rounded-2xl hover:bg-red-500 hover:text-white transition-all">
            <LogOut size={20}/>
          </button>
        </div>
        
        {/* Accents and Charts */}
<Line type="monotone" dataKey="v" stroke="#166534" strokeWidth={4} dot={false}/> // Mild Dark Green
<Cell fill="#166534"/> // Green
<Cell fill="#facc15"/> // Yellow
<button className="text-green-800 font-bold">Approve</button>

        {/* Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-72">
            <h3 className="text-[10px] font-black text-gray-400 mb-6 uppercase tracking-widest flex items-center">
              <TrendingUp size={14} className="mr-2"/> Monthly Revenue (Estimate)
            </h3>
            <ResponsiveContainer width="100%" height="80%">
              <LineChart data={incomeData}>
                <Tooltip contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                <Line type="monotone" dataKey="income" stroke="#16a34a" strokeWidth={4} dot={{ r: 4, fill: '#16a34a' }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 h-72">
            <h3 className="text-[10px] font-black text-gray-400 mb-6 uppercase tracking-widest">Patient Retention Flow</h3>
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie data={flowData} innerRadius={55} outerRadius={75} paddingAngle={8} dataKey="value">
                  {flowData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Upcoming Appointments Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
            <h3 className="font-bold text-gray-800 flex items-center"><Clock size={18} className="mr-2 text-blue-500"/> Upcoming Sessions</h3>
            <span className="text-[10px] font-black bg-blue-100 text-blue-600 px-3 py-1 rounded-full uppercase">{appointments.length} Booked</span>
          </div>
          <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
            {appointments.map(appt => (
              <div key={appt.id} className="p-5 flex justify-between items-center hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-bold">{appt.patient_name[0]}</div>
                  <div>
                    <p className="font-bold text-gray-900">{appt.patient_name}</p>
                    <p className="text-[10px] text-gray-500 font-medium">{new Date(appt.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                  </div>
                </div>
                <button className="text-[10px] font-black text-blue-600 uppercase hover:underline tracking-widest">View Details</button>
              </div>
            ))}
            {appointments.length === 0 && <p className="p-10 text-center text-gray-400 italic text-sm">No appointments scheduled.</p>}
          </div>
        </div>

        {/* Patient Directory Table */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex justify-between items-center">
            <h3 className="font-bold text-gray-800 flex items-center"><Users size={18} className="mr-2 text-green-600"/> Patient Directory</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-400 uppercase text-[10px] font-black tracking-widest">
                <tr>                  <th className="p-4">Patient Name</th>
                  <th className="p-4">Condition</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-gray-700">
                {patients.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-gray-900">{p.full_name}</div>
                      <div className="text-[10px] text-gray-400">{p.age || '??'} yrs • {p.gender || 'N/A'}</div>
                    </td>
                    <td className="p-4 font-medium text-gray-500">{p.condition || 'General'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-black tracking-widest ${p.is_approved ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                        {p.is_approved ? 'APPROVED' : 'PENDING'}
                      </span>
                    </td>
                    <td className="p-4 text-right space-x-4">
                      {!p.is_approved && (
                        <button onClick={() => handleApprove(p.id)} className="text-green-600 font-black text-[10px] uppercase hover:underline">Approve</button>
                      )}
                      <button onClick={() => setSelectedPatient(p)} className="text-blue-600 font-black text-[10px] uppercase hover:underline flex items-center inline-flex">
                        <PlusCircle size={12} className="mr-1"/> Assign Exercise
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Assign Exercise Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <form onSubmit={handleAssignExercise} className="bg-white p-8 rounded-[2.5rem] w-full max-w-md space-y-5 shadow-2xl relative">
            <button type="button" onClick={() => setSelectedPatient(null)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-900">
              <X size={24}/>
            </button>
            <div className="text-center">              <h3 className="font-black text-xl text-gray-900">Assign Exercise</h3>              <p className="text-sm text-gray-500">For: {selectedPatient.full_name}</p>
            </div>
            
            <div className="space-y-4 pt-2">
              <input required placeholder="Exercise Name (e.g. Squats)" className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 ring-blue-500 outline-none font-medium" 
                onChange={e => setExerciseForm({...exerciseForm, name: e.target.value})} />
              
              <div className="grid grid-cols-2 gap-4">
                <input required type="number" placeholder="Sets" className="p-4 bg-gray-50 rounded-2xl border-none outline-none font-medium" 
                  onChange={e => setExerciseForm({...exerciseForm, sets: e.target.value})} />
                <input required type="number" placeholder="Reps" className="p-4 bg-gray-50 rounded-2xl border-none outline-none font-medium" 
                  onChange={e => setExerciseForm({...exerciseForm, reps: e.target.value})} />
              </div>

              <input required placeholder="Duration (e.g. 15 mins)" className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none font-medium" 
                onChange={e => setExerciseForm({...exerciseForm, duration: e.target.value})} />
              
              <input required placeholder="Days (e.g. Mon, Wed, Fri)" className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none font-medium" 
                onChange={e => setExerciseForm({...exerciseForm, days: e.target.value})} />
            </div>

            <button type="submit" className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all uppercase tracking-widest text-xs">
              Save Exercise Plan
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

// Simple internal helper component for charts
const TrendingUp = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);