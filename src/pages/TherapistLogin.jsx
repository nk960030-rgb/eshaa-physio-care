import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';export default function TherapistLogin() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Password state  const [name, setName] = useState('');
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!email || !password) {
      alert("Please enter both email and password");
      return;
    }

    try {
      if (isSignUp) {
        // REGISTRATION LOGIC
        const res = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "profiles", res.user.uid), {
          full_name: name,
          role: 'therapist',
          is_approved: true,
          createdAt: new Date().toISOString()
        });
        alert("Therapist Account Created!");
        navigate("/therapist-dashboard", { replace: true });
      } else {
        // LOGIN LOGIC - This strictly requires the password
        const res = await signInWithEmailAndPassword(auth, email, password);
        
        // Check if the user is actually a therapist in Firestore
        const userDoc = await getDoc(doc(db, "profiles", res.user.uid));
        if (userDoc.exists() && userDoc.data().role === 'therapist') {
          navigate("/therapist-dashboard", { replace: true });        } else {
          alert("Access Denied: You are not registered as a therapist.");
          await auth.signOut();
        }
      }
    } catch (err) {
      alert("Auth Error: " + err.message);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-yellow-50 p-6 font-sans">
      <form onSubmit={handleAuth} className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md space-y-4 border border-yellow-100">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-black text-yellow-600 tracking-tight">
            {isSignUp ? 'Therapist Sign Up' : 'Therapist Login'}
          </h2>          <p className="text-xs text-gray-400 font-bold uppercase mt-1">Eshaa Physio Care</p>
        </div>

        {isSignUp && (
          <input 
            required 
            placeholder="Full Name" 
            className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 ring-yellow-400" 
            onChange={e => setName(e.target.value)} 
          />
        )}

        <input 
          required 
          type="email" 
          placeholder="Email Address" 
          className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 ring-yellow-400" 
          onChange={e => setEmail(e.target.value)} 
        />

        <input 
          required 
          type="password" 
          placeholder="Password" 
          className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 ring-yellow-400" 
          onChange={e => setPassword(e.target.value)} 
        />

        <button type="submit" className="w-full p-4 bg-yellow-400 text-green-900 rounded-2xl font-black shadow-lg shadow-yellow-100 hover:bg-yellow-300 transition-all uppercase text-xs tracking-widest">
          {isSignUp ? 'Create Therapist Account' : 'Secure Login'}
        </button>

        <p className="text-center text-xs font-bold text-yellow-600 cursor-pointer hover:underline" onClick={() => setIsSignUp(!isSignUp)}>
          {isSignUp ? 'Already have an account? Login' : 'New Therapist? Register Here'}
        </p>      </form>
    </div>
  );
}