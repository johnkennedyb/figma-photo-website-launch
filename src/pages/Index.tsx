
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const Index = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to welcome page
    navigate('/');
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-600 to-teal-400">
      <div className="text-white text-center">
        <h1 className="text-4xl font-bold mb-4">Quluub</h1>
        <p className="text-xl">Loading counseling platform...</p>
      </div>
    </div>
  );
};

export default Index;
