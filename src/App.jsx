import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

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
      if (currentUser) {
        setUser(currentUser);
        const docRef = doc(db, "profiles", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data());
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) return <div className="h-screen flex items-center justify-center font-bold">Initializing Eshaa Physio...</div>;

  return (
    <BrowserRouter>      <Routes>
        {/* If logged in, redirect away from Home/Login pages to the correct dashboard */}        <Route path="/" element={
          !user ? <Home /> : <Navigate to={profile?.role === 'therapist' ? "/therapist-dashboard" : "/patient-dashboard"} replace />
        } />
        
        <Route path="/patient-login" element={
          !user ? <PatientLogin /> : <Navigate to="/patient-dashboard" replace />
        } />

        <Route path="/therapist-login" element={
          !user ? <TherapistLogin /> : <Navigate to="/therapist-dashboard" replace />
        } />

        {/* Strictly Protected Routes */}
        <Route path="/patient-dashboard" element={
          user && profile?.role === 'patient' ? <PatientDashboard /> : <Navigate to="/" replace />        } />

        <Route path="/therapist-dashboard" element={
          user && profile?.role === 'therapist' ? <TherapistDashboard /> : <Navigate to="/" replace />
        } />
      </Routes>
    </BrowserRouter>
  );
}