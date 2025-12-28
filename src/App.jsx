export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true); // Start loading whenever auth changes
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
      setLoading(false); // Only stop loading AFTER profile is fetched
    });
    return () => unsubscribe();
  }, []);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-green-800">
       <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-4"></div>
       <h1 className="text-white font-bold">Eshaa Physio Loading...</h1>
    </div>
  );

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={!user ? <Home /> : <Navigate to={profile?.role === 'therapist' ? "/therapist-dashboard" : "/patient-dashboard"} replace />} />
        
        <Route path="/patient-login" element={!user ? <PatientLogin /> : <Navigate to="/patient-dashboard" replace />} />
        <Route path="/therapist-login" element={!user ? <TherapistLogin /> : <Navigate to="/therapist-dashboard" replace />} />

        <Route path="/patient-dashboard" element={
          user && profile?.role === 'patient' ? (
            profile.is_approved ? <PatientDashboard /> : <PendingScreen />
          ) : <Navigate to="/" replace />
        } />

        <Route path="/therapist-dashboard" element={
          user && profile?.role === 'therapist' ? <TherapistDashboard /> : <Navigate to="/therapist-login" replace />
        } />
      </Routes>
    </BrowserRouter>
  );
}