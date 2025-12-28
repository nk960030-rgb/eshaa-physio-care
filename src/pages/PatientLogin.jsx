import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';

export default function PatientLogin() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [condition, setCondition] = useState('');
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    try {
      if (isSignUp) {
        // Create New Patient
        const res = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "profiles", res.user.uid), {
          full_name: name,
          age: age,          condition: condition,
          role: 'patient',
          is_approved: false, // Must be approved by therapist
          createdAt: new Date().toISOString()
        });
        alert("Registration Successful! Please wait for Therapist approval.");
      } else {
        // Login Existing Patient
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate("/patient-dashboard");
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-green-50 p-6">
      <form onSubmit={handleAuth} className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md space-y-4">
        <h2 className="text-2xl font-bold text-center text-green-800">
          {isSignUp ? 'New Patient Registration' : 'Patient Login'}
        </h2>        {isSignUp && (
          <>
            <input required placeholder="Full Name" className="w-full p-4 bg-gray-50 rounded-2xl border outline-none" onChange={e => setName(e.target.value)} />
            <div className="grid grid-cols-2 gap-2">
               <input required type="number" placeholder="Age" className="p-4 bg-gray-50 rounded-2xl border outline-none" onChange={e => setAge(e.target.value)} />
               <input required placeholder="Condition (e.g. Back Pain)" className="p-4 bg-gray-50 rounded-2xl border outline-none" onChange={e => setCondition(e.target.value)} />
            </div>
          </>
        )}

        <input required type="email" placeholder="Email" className="w-full p-4 bg-gray-50 rounded-2xl border outline-none" onChange={e => setEmail(e.target.value)} />
        <input required type="password" placeholder="Password" className="w-full p-4 bg-gray-50 rounded-2xl border outline-none" onChange={e => setPassword(e.target.value)} />

        <button type="submit" className="w-full p-4 bg-green-800 text-white rounded-2xl font-bold">
          {isSignUp ? 'Register Now' : 'Login'}
        </button>

        <p className="text-center text-sm text-green-800 font-bold cursor-pointer" onClick={() => setIsSignUp(!isSignUp)}>          {isSignUp ? 'Already have an account? Login' : 'New Patient? Create Account'}
        </p>
      </form>
    </div>
  );
}