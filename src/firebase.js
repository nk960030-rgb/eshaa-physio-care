import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBAGfSGMyG1aYXKqPSMoOyppr8CANGt_Ek",
  authDomain: "eshaa-physio-care.firebaseapp.com",
  projectId: "eshaa-physio-care",
  storageBucket: "eshaa-physio-care.firebasestorage.app",
  messagingSenderId: "680488978230",
  appId: "1:680488978230:web:e20607c6930381cb339597"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);