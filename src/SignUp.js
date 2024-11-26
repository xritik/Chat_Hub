import React, {useState} from 'react'
import { Link } from 'react-router-dom';

const SignUp = ({signupMessage, setLoginUser, navigate}) => {
  const [showPassword, setShowPassword] = useState(false);

  const [fullname, setFullname] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [gender, setGender] = useState('');

  // localStorage.removeItem('loginUser')
  const signUp = async () => {
    try{
      const response = await fetch('http://localhost:8080/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({fullname, gender, username, password})
      });
      const data = await response.json()
      if(response.ok){
        setMessage(data.message)
        setLoginUser(username)
        navigate('/dashboard')
      }else{
        setMessage(data.message)
      }
    }
    catch (err){
      console.log('Error in SignIn', err);
      setMessage('An error occurred, Please try again')
    }
  }

    return (
        <div className='main'>
            <div className='login-section'>
            <h1>SignUp here!</h1>
            <form className="login-form"onSubmit={(e) => {e.preventDefault(); signUp()}}>
        
                <label>
                    Full Name:
                    <input 
                        type="text" 
                        placeholder="Enter your full-name"  
                        required
                        autoFocus
                        value={fullname}
                        onChange={(e) => setFullname(e.target.value)}
                    />
                </label>

                <label>
                    <span className="gender-options">
                    Gender:
                        <label className="circle-option">
                            <input
                                type="radio"
                                value="Male"
                                checked={gender === 'Male'}
                                onChange={(e) => setGender(e.target.value)}
                            />
                             Male
                        </label>
                        <label className="circle-option">
                            <input
                                type="radio"
                                value="Female"
                                checked={gender === 'Female'}
                                onChange={(e) => setGender(e.target.value)}
                            />
                            Female
                        </label>
                    </span>
                </label>
                <label>
                Username:
                <input 
                    type="text" 
                    placeholder="Enter username"  
                    required
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
                    <label>
                        Show Password
                    </label>
                    <input
                        type="checkbox"
                        checked={showPassword}
                        onChange={() => setShowPassword(!showPassword)}
                    />
                </div>
        
                <button type="submit" className='submitbutton'>SignUp</button>
            <div>Already exist an account? <Link to={'/login'}> Login</Link></div>
            </form>
                {message && <p style={{marginTop: '10px'}}>{message}</p>}
                {signupMessage && <p style={{marginTop: '10px'}}>{signupMessage}</p>}
            </div>
        </div>
      );
    };
    
    export default SignUp;