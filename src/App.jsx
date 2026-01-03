import React, { useState, useEffect } from 'react'; // Added missing imports
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

// Page Imports
import Home from "./pages/Home";
import PatientLogin from "./pages/PatientLogin";
import TherapistLogin from "./pages/TherapistLogin";
import PatientDashboard from "./pages/PatientDashboard";
import TherapistDashboard from "./pages/TherapistDashboard";

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      if (currentUser) {
        setUser(currentUser);
        try {
          const docRef = doc(db, "profiles", currentUser.uid);
          const docSnap = await getDoc(docRef);          if (docSnap.exists()) {
            setProfile(docSnap.data());
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Splash Screen while loading
  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-green-800">
       <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4"></div>
       <h1 className="text-white font-bold tracking-widest uppercase text-xs">Eshaa Physio</h1>    </div>
  );

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={!user ? <Home /> : <Navigate to={profile?.role === 'therapist' ? "/therapist-dashboard" : "/patient-dashboard"} replace />} />        <Route path="/patient-login" element={!user ? <PatientLogin /> : <Navigate to="/patient-dashboard" replace />} />
        <Route path="/therapist-login" element={!user ? <TherapistLogin /> : <Navigate to="/therapist-dashboard" replace />} />

        {/* Protected Patient Route */}
        <Route 
          path="/patient-dashboard" 
          element={user && profile?.role === 'patient' ? <PatientDashboard /> : <Navigate to="/" replace />} 
        />

        {/* Protected Therapist Route */}
        <Route 
          path="/therapist-dashboard" 
          element={user && profile?.role === 'therapist' ? <TherapistDashboard /> : <Navigate to="/" replace />} 
        />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

// Pending Screen for unapproved patients (Can also be used inside PatientDashboard)
const PendingScreen = () => (
  <div className="h-screen flex flex-col items-center justify-center text-center p-10 bg-gray-50">
    <div className="bg-yellow-100 p-6 rounded-full mb-6">⏳</div>
    <h2 className="text-2xl font-bold text-gray-800">Account Pending Approval</h2>    <p className="text-gray-500 mt-2 max-w-xs">Our therapist will review your profile and approve you shortly.</p>
    <button onClick={() => auth.signOut()} className="mt-8 text-green-800 font-bold underline">Logout</button>
  </div>
);