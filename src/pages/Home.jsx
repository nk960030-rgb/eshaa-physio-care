import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-50 space-y-8 p-6">
      <h1 className="text-4xl font-black text-green-800">Eshaa Physio Care</h1>
      <div className="grid gap-4 w-full max-w-xs">
        {/* Patient Portal - Mild Dark Green */}
        <Link to="/patient-login" className="bg-green-800 text-white p-4 rounded-2xl font-bold text-center shadow-lg hover:bg-green-900 transition">
          Patient Portal
        </Link>
        {/* Therapist Portal - Bold Yellow */}
        <Link to="/therapist-login" className="bg-yellow-400 text-green-900 p-4 rounded-2xl font-bold text-center shadow-lg hover:bg-yellow-300 transition">
          Therapist Portal
        </Link>
      </div>
    </div>
  );
}