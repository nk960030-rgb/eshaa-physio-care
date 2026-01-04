import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, addDoc, orderBy } from 'firebase/firestore';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Users, LogOut, CreditCard, Video, Clock, Search, Calendar, Filter, Trash2 } from 'lucide-react';

export default function TherapistDashboard() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [allPayments, setAllPayments] = useState([]);
  const [realIncome, setRealIncome] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showBillModal, setShowBillModal] = useState(false);
  
  // 1. Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [dateSearch, setDateSearch] = useState(''); // For searching specific dates
  
  const [exerciseForm, setExerciseForm] = useState({ name: '', sets: '', reps: '', duration: '', videoUrl: '' });
  const [billForm, setBillForm] = useState({ 
    amount: '', 
    status: 'Paid', 
    method: 'GPay', 
    date: new Date().toISOString().split('T')[0] // Default to today
  });

  const fetchData = async () => {
    try {
      const pSnap = await getDocs(query(collection(db, "profiles"), where("role", "==", "patient")));
      setPatients(pSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const paySnap = await getDocs(query(collection(db, "payments"), orderBy("date", "desc")));
      const payList = paySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllPayments(payList);

      const monthlyData = payList.reduce((acc, curr) => {
        if (!curr.date) return acc;
        const month = curr.date.split('-')[1]; 
        acc[month] = (acc[month] || 0) + Number(curr.amount);
        return acc;
      }, {});
      setRealIncome(Object.keys(monthlyData).map(k => ({ month: k, total: monthlyData[k] })));
    } catch (err) { console.error(err); }
  };

  useEffect(() => { if (auth.currentUser) fetchData(); }, []);

  // 2. Logic: Search by Name or ID
  const filteredPatients = patients.filter(p => 
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 3. Logic: Filter Records by Date and Name
  const filteredRecords = allPayments.filter(r => {
    const matchesDate = dateSearch ? r.date === dateSearch : true;
    const matchesName = searchTerm ? r.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) : true;
    return matchesDate && matchesName;
  });

  // 4. Logic: Calculate Summary for Filtered Results
  const totalRevenue = filteredRecords.reduce((sum, r) => sum + Number(r.amount), 0);

  const handleAddBill = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, "payments"), {
      ...billForm,
      patient_id: selectedPatient.id,
      patient_name: selectedPatient.full_name,
      patient_age: selectedPatient.age,
      patient_gender: selectedPatient.gender,
      patient_condition: selectedPatient.condition
    });
    setShowBillModal(false);
    fetchData();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 lg:p-8 font-sans max-w-6xl mx-auto space-y-6">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 gap-4">
        <div className="w-full md:w-auto">
          <h1 className="text-2xl font-black text-green-900 tracking-tight">Eshaa Console</h1>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Therapist Admin</p>
        </div>
        
        {/* Search Bar (Point 3) */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-3.5 text-slate-300" size={18}/>
          <input 
            type="text" 
            placeholder="Search Patient Name or ID..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-2xl border-none focus:ring-2 ring-green-500 transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button onClick={() => signOut(auth).then(() => navigate('/'))} className="bg-red-50 text-red-500 p-3 rounded-2xl">
          <LogOut size={20}/>
        </button>
      </div>

      {/* Date Filter & Results Summary (Point 4) */}
      <div className="bg-green-800 p-6 rounded-[2rem] text-white flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="bg-white/10 p-3 rounded-2xl">
            <Calendar size={24}/>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase opacity-60 tracking-widest">Filter Records by Date</p>
            <input 
              type="date" 
              className="bg-transparent border-none text-xl font-bold focus:ring-0 cursor-pointer" 
              onChange={(e) => setDateSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-8 text-center md:text-right">
          <div>
            <p className="text-[10px] font-black uppercase opacity-60">Patients Seen</p>
            <p className="text-3xl font-black">{filteredRecords.length}</p>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase opacity-60">Revenue Collected</p>
            <p className="text-3xl font-black">₹{totalRevenue}</p>
          </div>
          {dateSearch && (
            <button onClick={() => setDateSearch('')} className="bg-white/20 p-2 rounded-xl hover:bg-white/30 transition-all">
              <Trash2 size={16}/>
            </button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Patient Directory */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden h-fit">
          <div className="p-6 font-black text-slate-800 border-b border-slate-50 flex items-center gap-2">
            <Users size={18} className="text-green-600"/> Patient Directory
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <tr>
                  <th className="p-5">Patient Details</th>
                  <th className="p-5">Clinical Note</th>
                  <th className="p-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredPatients.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-all">
                    <td className="p-5">
                      <div className="font-bold text-slate-900">{p.full_name}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">ID: {p.id.slice(0, 8)} • {p.age}Y • {p.gender}</div>
                    </td>
                    <td className="p-5">
                      <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-full uppercase">{p.condition}</span>
                    </td>
                    <td className="p-5 text-right space-x-2">
                      <button onClick={() => setSelectedPatient(p)} className="bg-slate-100 text-slate-600 p-2 rounded-xl hover:bg-green-800 hover:text-white transition-all"><Video size={16}/></button>
                      <button onClick={() => {setSelectedPatient(p); setShowBillModal(true);}} className="bg-green-50 text-green-700 p-2 rounded-xl hover:bg-green-700 hover:text-white transition-all"><CreditCard size={16}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Daily Flow Records (Point 2) */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-black text-slate-800 uppercase text-xs flex items-center gap-2">
              <Clock size={16} className="text-green-600"/> {dateSearch ? `Records for ${dateSearch}` : 'Recent Patient Flow'}
            </h3>
          </div>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
            {filteredRecords.map(record => (
              <div key={record.id} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-bold text-slate-900 text-sm">{record.patient_name}</div>
                  <div className="text-green-800 font-black">₹{record.amount}</div>
                </div>
                <div className="text-[10px] text-slate-500 font-bold uppercase mb-3">
                  {record.patient_condition} • {record.method}
                </div>
                <div className="flex justify-between items-center border-t border-slate-50 pt-2 text-[9px] font-black text-slate-400">
                  <span>{record.date}</span>
                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded uppercase">{record.status}</span>
                </div>
              </div>
            ))}
            {filteredRecords.length === 0 && (
              <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 font-bold text-sm">
                No records found for this criteria
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Improved Billing Modal (Point 1) */}
      {showBillModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-[100]">
          <form onSubmit={handleAddBill} className="bg-white p-8 rounded-[2.5rem] w-full max-w-md space-y-4 shadow-2xl animate-in zoom-in-95">
            <h3 className="font-black text-xl text-green-900">Add New Billing Record</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Patient: {selectedPatient?.full_name}</p>
            
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Consultation Date</label>
              <input 
                required 
                type="date" 
                className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold"
                value={billForm.date}
                onChange={e => setBillForm({...billForm, date: e.target.value})}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Fee Amount (₹)</label>
              <input required type="number" placeholder="500" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" onChange={e => setBillForm({...billForm, amount: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <select className="p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm" value={billForm.method} onChange={e => setBillForm({...billForm, method: e.target.value})}>
                <option value="GPay">GPay</option>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
              </select>
              <select className="p-4 bg-slate-50 rounded-2xl border-none font-bold text-sm" value={billForm.status} onChange={e => setBillForm({...billForm, status: e.target.value})}>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
              </select>
            </div>

            <button type="submit" className="w-full bg-green-800 text-white p-4 rounded-2xl font-black shadow-lg hover:bg-green-900 transition-all">Submit Entry</button>
            <button type="button" onClick={() => setShowBillModal(false)} className="w-full text-slate-400 font-bold text-sm">Go Back</button>
          </form>
        </div>
      )}

      {/* Exercise Modal remains the same */}
    </div>
  );
}