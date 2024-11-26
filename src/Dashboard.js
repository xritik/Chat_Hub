import React, { useEffect, useState } from 'react';
import male from './imgs/male.jpg';
import female from './imgs/female.jpg';

const Dashboard = ({ navigate, setSignupMessage, loginUser, logout }) => {
    const [fullname, setFullname] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [allUsers, setAllUsers] = useState([]);
    const [gender, setGender] = useState('');
    const [isUsersLoading, setIsUsersLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [showButton, SetShowButton] = useState(true);

    const savedLoginUser = localStorage.getItem('loginUser')


    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await fetch('http://localhost:8080/dashboard', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'login-user': loginUser, // Include user ID in headers
                    },
                    credentials: 'include', // Include session cookies if used
                });
    
                if (response.ok) {
                    const data = await response.json();
                    setTimeout(() => {
                        setFullname(data.fullname); // Set fullname after 2 seconds
                        setGender(data.gender)
                        setIsLoading(false); // Stop loading
                    }, (savedLoginUser === loginUser) ? 1000 : 3500);
                } else {
                    setSignupMessage('User not logged in');
                    navigate('/login'); // Redirect to login if the user is not authenticated
                }
            } catch (err) {
                console.error('Error fetching user data:', err);
                setSignupMessage('An error occurred, Please try again');
                navigate('/login'); // Redirect to login on error
            }
        };
    
        fetchUserData();
    }, [navigate, setSignupMessage, loginUser, savedLoginUser], setTimeout(2000)); // Include all dependencies in the dependency array.


    const fetchUsers = async () => {
        localStorage.removeItem('currentChat');
        localStorage.removeItem('storedAllUsers');
        localStorage.removeItem('storedUserToChat');
        setIsUsersLoading(true);
        try {
            const response = await fetch('http://localhost:8080/dashboard', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'login-user': loginUser,
                }
            });
    
            if (response.ok) {
                const data = await response.json();
                const users = data.users || [];
                setTimeout(() => {
                    setAllUsers(users);
                    setIsUsersLoading(false);
                    SetShowButton(false);
                }, 2000); // Longer delay for first load, shorter for subsequent loads
            } else {
                setIsUsersLoading(false);
                setMessage('Users not found, Please try again!!');
                SetShowButton(true);
                setAllUsers([]);
                setTimeout(() => {
                    setMessage('');
                }, 5000);
            }
        } catch {
            setIsUsersLoading(false);
            setMessage('Something went wrong! Please try again!!');
            SetShowButton(true);
            setAllUsers([]);
            setTimeout(() => {
                setMessage('');
            }, 5000);
        }
    };    

    const handleToChat = (userToChat) => {
        localStorage.setItem('storedUserToChat', userToChat);
        // console.log(localStorage.getItem('storedUserToChat'));
        // setTimeout(() => {
            navigate('/chat')
        // }, 2000);
    }


    return (
        <div>
            <nav>
                <div className='appname'>Chat.hub</div>
                <div className='welcomeuser' style={{width: '80%'}}>
                    {isLoading ? 'Loading user info...' : `Welcome ${(gender === 'Female' ? 'Mrs.'  : 'Mr.')} ${fullname}!`}
                </div>
                <div className='part2'>
                    <button className='submitbutton logoutbutton' onClick={logout}>
                        Logout
                    </button>
                </div>
            </nav>
            <div className='dashboard-section'>
                {isLoading && <p className='loading'>Loading...</p>}
                {!isLoading && (
                    <>
                        <p className='para' style={{paddingTop: '30px'}}>This desktop application serves as a user-friendly chatting platform designed for registered users to connect and communicate with one another.</p>
                        <p className='para' style={{marginTop: '-7px'}}>So just click on '<b>Chat with others</b>' and get some registered sweet people like you to chat.</p>
                        {showButton && <div className='button-div'><button className='dashboard-button' onClick={fetchUsers}>Chat with others</button></div>}
                        {message && <p style={{marginTop: '15px', textAlign: 'center'}}>{message}</p>}
                        {isUsersLoading && <p style={{marginTop: '10px', textAlign: 'center'}}>Loading Users...</p>}
                        {(allUsers.length !== 0) && 
                            <div className="all-users">
                                <h2>All Registered Users</h2>
                                    {allUsers.length <= 1 && <p style={{marginTop: '10px', textAlign: 'center'}}>No user found!!</p>}
                                <ul>
                                    {allUsers.filter((user) => user.username !== loginUser).map((user, index) => (
                                        <li key={index} className="user-item">
                                            <div className="user-details">
                                                <span className="logo">
                                                    <img src={(user.gender === 'Female') ? female : male} alt="img" />
                                                </span>
                                                <div className="user-info">
                                                    <span className="fullname">{user.fullname} {user.username === 'ritik' && (<p style={{display: 'inline', color: 'grey'}}>(Admin)</p>)}  <i className='bx bxs-badge-check'></i></span>
                                                    <span className="username"><i>{user.username}</i></span>
                                                </div>
                                            </div>
                                            <button className="chat-button" onClick={() => handleToChat(user.username)}>Chat</button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        
                        }
                    </>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
