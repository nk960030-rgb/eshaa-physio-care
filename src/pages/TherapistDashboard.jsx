import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where, addDoc, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Users, LogOut, CreditCard, Search, Calendar, MessageSquare, Activity, IndianRupee, Trash2, FileText, Clock, X } from 'lucide-react';

export default function TherapistDashboard() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [allPayments, setAllPayments] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientExercises, setPatientExercises] = useState([]);
  
  const [modalType, setModalType] = useState(null); 
  const [activeReceipt, setActiveReceipt] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [dateSearch, setDateSearch] = useState(''); 
  const [progressNote, setProgressNote] = useState("");
  const [appointment, setAppointment] = useState({ date: '', time: '' });
  const [exerciseForm, setExerciseForm] = useState({ name: '', sets: '', reps: '', videoUrl: '' });
  const [billForm, setBillForm] = useState({ amount: '', status: 'Paid', method: 'GPay', date: new Date().toISOString().split('T')[0] });

  const today = new Date().toISOString().split('T')[0];

  const fetchData = async () => {
    try {
      const pSnap = await getDocs(query(collection(db, "profiles"), where("role", "==", "patient")));
      setPatients(pSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      const paySnap = await getDocs(query(collection(db, "payments"), orderBy("date", "desc")));
      setAllPayments(paySnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) { console.error("Fetch error:", err); }
  };

  useEffect(() => { if (auth.currentUser) fetchData(); }, []);

  // Helper to load exercises for a patient
  const loadExercises = async (patientId) => {
    const q = query(collection(db, "exercises"), where("patient_id", "==", patientId));
    const snap = await getDocs(q);
    setPatientExercises(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const openModal = (type, patient) => {
    setSelectedPatient(patient);
    setModalType(type);
    if (type === 'exercise') loadExercises(patient.id);
  };

  const deleteExercise = async (exId) => {
    if (!selectedPatient) return;
    try {
      await deleteDoc(doc(db, "exercises", exId));
      // Refresh the specific list after deletion
      loadExercises(selectedPatient.id);
    } catch (err) { alert("Delete failed: " + err.message); }
  };

  const handleAddBill = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;
    await addDoc(collection(db, "payments"), { 
      ...billForm, 
      patient_id: selectedPatient.id, 
      patient_name: selectedPatient.full_name,
      patient_condition: selectedPatient.condition || 'General'
    });
    setModalType(null);
    fetchData();
  };

  const handleSaveNote = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;
    await addDoc(collection(db, "notes"), { 
      patient_id: selectedPatient.id, 
      patient_name: selectedPatient.full_name, 
      note: progressNote, 
      date: today, 
      timestamp: new Date() 
    });
    setModalType(null);
    setProgressNote("");
    alert("Note saved!");
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return;
    await updateDoc(doc(db, "profiles", selectedPatient.id), {
      nextSession: { date: appointment.date, time: appointment.time }
    });
    setModalType(null);
    fetchData();
  };

  const handlePrint = (record) => { setActiveReceipt(record); setTimeout(() => { window.print(); setActiveReceipt(null); }, 500); };

  const filteredPatients = patients.filter(p => p.full_name?.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredRecords = allPayments.filter(r => (dateSearch ? r.date === dateSearch : true) && (searchTerm ? r.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) : true));

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 lg:p-8 font-sans max-w-6xl mx-auto space-y-6 print:p-0">
      
      {/* Header (Hidden on Print) */}
      <div className="print:hidden flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 gap-4">
        <h1 className="text-2xl font-black text-green-900 italic">Eshaa Console</h1>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-3.5 text-slate-300" size={18}/>
          <input type="text" placeholder="Search Patients..." className="w-full pl-12 pr-4 py-3 bg-slate-50 rounded-2xl border-none font-medium" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <button onClick={() => signOut(auth).then(() => navigate('/'))} className="text-red-500 bg-red-50 p-3 rounded-2xl"><LogOut/></button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 print:hidden">
        {/* Patient Table */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 font-black border-b text-slate-800">Patient Directory</div>
          <table className="w-full text-left">
            <tbody className="divide-y">
              {filteredPatients.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-5">
                    <div className="font-bold text-slate-900">{p.full_name}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      {p.nextSession ? `Next: ${p.nextSession.date} @ ${p.nextSession.time}` : 'No Session Set'}
                    </div>
                  </td>
                  <td className="p-5 text-right space-x-2">
                    <button onClick={() => openModal('schedule', p)} className="bg-purple-50 text-purple-600 p-2.5 rounded-xl"><Clock size={16}/></button>
                    <button onClick={() => openModal('note', p)} className="bg-orange-50 text-orange-600 p-2.5 rounded-xl"><MessageSquare size={16}/></button>
                    <button onClick={() => openModal('exercise', p)} className="bg-blue-50 text-blue-600 p-2.5 rounded-xl"><Activity size={16}/></button>
                    <button onClick={() => openModal('bill', p)} className="bg-green-50 text-green-700 p-2.5 rounded-xl"><CreditCard size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <h3 className="font-black text-xs uppercase px-2 text-slate-400">Recent Revenue</h3>
          {filteredRecords.slice(0, 6).map(record => (
            <div key={record.id} className="bg-white p-4 rounded-3xl border flex justify-between items-center shadow-sm">
              <div><p className="font-bold text-sm text-slate-900">{record.patient_name}</p><p className="text-[10px] text-slate-400 font-bold uppercase">₹{record.amount} • {record.date}</p></div>
              <button onClick={() => handlePrint(record)} className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-green-600 transition-colors"><FileText size={18}/></button>
            </div>
          ))}
        </div>
      </div>

      {/* ALL MODALS (With Safety Check) */}
      {modalType && selectedPatient && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6 z-50 print:hidden">
          <div className={`bg-white p-8 rounded-[2.5rem] w-full shadow-2xl ${modalType === 'exercise' ? 'max-w-2xl' : 'max-w-md'}`}>
            
            {/* Modal Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="font-black text-xl text-slate-800 capitalize">{modalType} Management</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Patient: {selectedPatient.full_name}</p>
              </div>
              <button onClick={() => setModalType(null)} className="p-2 bg-slate-50 rounded-full text-slate-400"><X size={20}/></button>
            </div>

            {/* Conditionally Render Content */}
            {modalType === 'exercise' && (
              <div className="grid md:grid-cols-2 gap-8">
                <form onSubmit={async (e) => { 
                  e.preventDefault(); 
                  await addDoc(collection(db, "exercises"), {...exerciseForm, patient_id: selectedPatient.id}); 
                  loadExercises(selectedPatient.id);
                  setExerciseForm({ name: '', sets: '', reps: '', videoUrl: '' });
                }} className="space-y-4">
                  <input required placeholder="Exercise Name" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-medium" value={exerciseForm.name} onChange={e => setExerciseForm({...exerciseForm, name: e.target.value})} />
                  <div className="grid grid-cols-2 gap-4">
                    <input required placeholder="Sets" className="p-4 bg-slate-50 rounded-2xl border-none font-medium" value={exerciseForm.sets} onChange={e => setExerciseForm({...exerciseForm, sets: e.target.value})} />
                    <input required placeholder="Reps" className="p-4 bg-slate-50 rounded-2xl border-none font-medium" value={exerciseForm.reps} onChange={e => setExerciseForm({...exerciseForm, reps: e.target.value})} />
                  </div>
                  <input placeholder="YouTube URL" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-medium" value={exerciseForm.videoUrl} onChange={e => setExerciseForm({...exerciseForm, videoUrl: e.target.value})} />
                  <button className="w-full bg-green-800 text-white p-4 rounded-2xl font-black shadow-lg">Assign Plan</button>
                </form>
                <div className="space-y-4 overflow-y-auto max-h-80 pr-2">
                  <h4 className="font-black text-xs uppercase text-slate-400">Currently Assigned</h4>
                  {patientExercises.map(ex => (
                    <div key={ex.id} className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center border border-slate-100">
                      <div><p className="font-bold text-sm">{ex.name}</p><p className="text-[10px] font-black text-slate-400">{ex.sets} Sets • {ex.reps} Reps</p></div>
                      <button onClick={() => deleteExercise(ex.id)} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 size={18}/></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {modalType === 'schedule' && (
              <form onSubmit={handleSchedule} className="space-y-4">
                <input required type="date" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" onChange={e => setAppointment({...appointment, date: e.target.value})} />
                <input required type="time" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" onChange={e => setAppointment({...appointment, time: e.target.value})} />
                <button className="w-full bg-purple-600 text-white p-4 rounded-2xl font-black shadow-lg">Confirm Appointment</button>
              </form>
            )}

            {modalType === 'note' && (
              <form onSubmit={handleSaveNote} className="space-y-4">
                <textarea required className="w-full h-40 p-4 bg-slate-50 rounded-2xl border-none font-medium" placeholder="Clinical progress observations..." value={progressNote} onChange={e => setProgressNote(e.target.value)} />
                <button className="w-full bg-orange-600 text-white p-4 rounded-2xl font-black shadow-lg">Save Note</button>
              </form>
            )}

            {modalType === 'bill' && (
              <form onSubmit={handleAddBill} className="space-y-4">
                <input required type="date" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold" value={billForm.date} onChange={e => setBillForm({...billForm, date: e.target.value})} />
                <input required placeholder="Amount (₹)" type="number" className="w-full p-4 bg-slate-50 rounded-2xl border-none font-bold text-lg" onChange={e => setBillForm({...billForm, amount: e.target.value})} />
                <button className="w-full bg-green-800 text-white p-4 rounded-2xl font-black shadow-lg">Generate Entry</button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* PRINT RECEIPT (Only visible during print) */}
      {activeReceipt && (
        <div className="hidden print:block p-12 text-slate-900 bg-white min-h-screen">
          <div className="flex justify-between border-b-2 pb-8 border-slate-100">
            <div><h1 className="text-3xl font-black text-green-800 italic">Eshaa Physio Care</h1><p className="text-xs font-bold text-slate-400 tracking-widest uppercase">Official Payment Receipt</p></div>
            <div className="text-right font-bold text-xs"><p>No: EPC-{activeReceipt.id?.slice(0,6).toUpperCase()}</p><p>Date: {activeReceipt.date}</p></div>
          </div>
          <div className="my-10"><p className="text-[10px] font-black uppercase text-slate-400">Bill To</p><p className="text-xl font-black">{activeReceipt.patient_name}</p><p className="text-xs font-bold text-slate-500">Condition: {activeReceipt.patient_condition}</p></div>
          <table className="w-full mt-10"><tr className="border-b text-left text-xs uppercase font-black"><th className="py-4">Service</th><th className="py-4 text-right">Amount</th></tr><tr><td className="py-8 font-black">Physiotherapy Consultation & Session</td><td className="py-8 text-right font-black text-xl">₹{activeReceipt.amount}</td></tr></table>
          <div className="mt-32 flex justify-between items-end"><p className="text-[9px] text-slate-400 italic font-medium">* Electronic computer generated receipt.</p><div className="text-right"><div className="w-32 border-b border-slate-300 ml-auto mb-2"></div><p className="text-[9px] font-black uppercase tracking-tighter">Authorized Clinic Signature</p></div></div>
        </div>
      )}
    </div>
  );
}