import backgroundImage from '../assets/gif.gif';
import './welcomePage.css';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function WelcomePage() {
  const navigate = useNavigate();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/home');
    }, 2500);
    
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="welcome-container" style={{backgroundImage: `url(${backgroundImage})`}}>
      <div className="pixel-screen">
        <div className="book-container">
        </div>
      </div>
    </div>
  );
}

export default WelcomePage;