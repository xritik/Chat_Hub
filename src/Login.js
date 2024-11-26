import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Login = ({signupMessage, navigate, setLoginUser}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

//   localStorage.removeItem('loginUser')
  const login = async () => {
    try {
        const response = await fetch('http://localhost:8080/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
            credentials: 'include',  // Include cookies (session)
        });

        const data = await response.json();
        if (response.ok) {
            setMessage(data.message);  // Success message
            setLoginUser(username);
            navigate('/dashboard');
        } else {
            setMessage(data.message);  // Error message
        }
    } catch (error) {
        console.error("Error logging in:", error);
        setMessage('An error occurred. Please try again.');
    }
  };

  return (
    <div className='main'>
        <div className='login-section' style={{backgroundColor: 'pink'}}>
            <h1>Login here!</h1>
            <form className="login-form" onSubmit={(e) => {e.preventDefault(); login()}}>

                <label>
                    Username:
                    <input 
                        type="text" 
                        placeholder="Enter username"  
                        required
                        autoFocus
                        value={username}
                        onChange={(e) => setUsername(e.target.value.trim())}
                    />
                </label>

                <label>
                    Password:
                    <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value.trim())}
                    />
                </label>

                <div className="show-password">
                    <label>Show Password</label>
                    <input
                        type="checkbox"
                        checked={showPassword}
                        onChange={() => setShowPassword(!showPassword)}
                    />
                </div>

                <button type="submit" className='submitbutton'>Login</button>
                <div>Create new account? <Link to={'/signup'}> Sign up</Link></div>
            </form>


            {message && <p style={{marginTop: '10px'}}>{message}</p>}
            {signupMessage && <p style={{marginTop: '10px'}}>{signupMessage}</p>}
        </div>
    </div>
  );
};
    
export default Login;
