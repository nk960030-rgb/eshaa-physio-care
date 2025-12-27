import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';

export default function PatientLogin() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');  const [name, setName] = useState('');
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isSignUp) {        const res = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "profiles", res.user.uid), {
          full_name: name,
          role: 'patient',
          is_approved: false,
          condition: 'New Patient'
        });
        alert("Account created! Please wait for therapist approval.");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate("/patient-dashboard");
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-blue-50 p-6">
      <form onSubmit={handleAuth} className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md space-y-4">
        <h2 className="text-2xl font-bold text-center text-blue-600">{isSignUp ? 'Create Account' : 'Patient Login'}</h2>
        {isSignUp && <input placeholder="Full Name" className="w-full p-4 bg-gray-50 rounded-2xl border" onChange={e => setName(e.target.value)} required />}
        <input type="email" placeholder="Email" className="w-full p-4 bg-gray-50 rounded-2xl border" onChange={e => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" className="w-full p-4 bg-gray-50 rounded-2xl border" onChange={e => setPassword(e.target.value)} required />
        <button type="submit" className="w-full p-4 bg-blue-600 text-white rounded-2xl font-bold">{isSignUp ? 'Sign Up' : 'Login'}</button>
        <p className="text-center text-sm text-blue-600 cursor-pointer font-bold" onClick={() => setIsSignUp(!isSignUp)}>
          {isSignUp ? 'Already have an account? Login' : 'New Patient? Register Here'}
        </p>      </form>
    </div>
  );
}