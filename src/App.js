import {useState, useEffect} from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import Login from './Login';
import SignUp from './SignUp'
import Dashboard from './Dashboard'
import Missing from './Missing';
import Chat from './Chat';

function App() {
  const navigate = useNavigate();
  const [signupMessage, setSignupMessage] = useState('')
  const [loginUser, setLoginUser] = useState(localStorage.getItem('loginUser') || '');
  console.log(loginUser);


  // Save loginUser to localStorage whenever it changes
  useEffect(() => {
    if (loginUser) {
      localStorage.setItem('loginUser', loginUser);
    } else {
      localStorage.removeItem('loginUser');
    }
  }, [loginUser]);

  // Logout function
  const logout = () => {
    setLoginUser(''); // Clear loginUser state
    localStorage.removeItem('loginUser'); // Remove user from localStorage
    navigate('/login'); // Redirect to the homepage or login
    localStorage.removeItem('currentChat');
    localStorage.removeItem('storedAllUsers');
    localStorage.removeItem('storedUserToChat');
  };


  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<SignUp navigate={navigate} signupMessage={signupMessage} setLoginUser={setLoginUser} />} />
        <Route path="/signup" element={<SignUp navigate={navigate} signupMessage={signupMessage} setLoginUser={setLoginUser} />} />
        <Route path="/login" element={<Login navigate={navigate} signupMessage={signupMessage} setLoginUser={setLoginUser} />} />
        <Route path="/dashboard" element={<Dashboard navigate={navigate} setSignupMessage={setSignupMessage} loginUser={loginUser} logout={logout} />} />
        <Route path="/chat" element={<Chat navigate={navigate} />} />
        <Route path='*' element={<Missing />} />
      </Routes>
    </div>
  );
}

export default App;