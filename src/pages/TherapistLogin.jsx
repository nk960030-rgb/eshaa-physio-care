import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';import { useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';

export default function TherapistLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
  e.preventDefault();
  try {
    const res = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, "profiles", res.user.uid));
    
    if (userDoc.data()?.role === 'therapist') {
      // Use replace: true to prevent "Back" button issues
      navigate("/therapist-dashboard", { replace: true });
    } else {
      alert("Unauthorized: This is for therapists only.");
      await auth.signOut();
    }
  } catch (error) {
    alert("Login failed: " + error.message);
  }
};
  return (
    <div className="h-screen flex items-center justify-center bg-gray-100 p-6">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md space-y-4">
        <h2 className="text-2xl font-bold text-center text-gray-800">Therapist Login</h2>
        <input type="email" placeholder="Email" className="w-full p-4 bg-gray-50 rounded-2xl border" onChange={e => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" className="w-full p-4 bg-gray-50 rounded-2xl border" onChange={e => setPassword(e.target.value)} required />
        <button type="submit" className="w-full p-4 bg-gray-800 text-white rounded-2xl font-bold">Login</button>
      </form>
    </div>
  );
}