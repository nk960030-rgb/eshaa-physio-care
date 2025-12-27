
import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-50 space-y-8 p-6">
      <h1 className="text-4xl font-black text-blue-600">Eshaa Physio Care</h1>
      <div className="grid gap-4 w-full max-w-xs">
        <Link to="/patient-login" className="bg-blue-600 text-white p-4 rounded-2xl font-bold text-center shadow-lg hover:bg-blue-700 transition">Patient Portal</Link>
        <Link to="/therapist-login" className="bg-gray-800 text-white p-4 rounded-2xl font-bold text-center shadow-lg hover:bg-black transition">Therapist Portal</Link>
      </div>
    </div>
  );
}