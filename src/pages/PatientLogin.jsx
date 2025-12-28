import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';import { doc, getDoc } from 'firebase/firestore';

export default function PatientLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, "profiles", res.user.uid));
      if (userDoc.data()?.role === 'patient') {
        navigate("/patient-dashboard", { replace: true });
      } else {
        alert("Access Denied: Please use the Therapist Portal.");
        await auth.signOut();
      }
    } catch (err) { alert("Invalid Credentials"); }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-green-50 p-6">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md space-y-4">
        <h2 className="text-2xl font-bold text-center text-green-800">Patient Login</h2>
        <input type="email" placeholder="Email" className="w-full p-4 bg-gray-50 rounded-2xl border focus:border-green-800 outline-none" onChange={e => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" className="w-full p-4 bg-gray-50 rounded-2xl border focus:border-green-800 outline-none" onChange={e => setPassword(e.target.value)} required />
        <button type="submit" className="w-full p-4 bg-green-800 text-white rounded-2xl font-bold hover:bg-green-900 transition">Login</button>
      </form>
    </div>
  );
}