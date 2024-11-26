import React, {useState, useEffect, useRef} from 'react';
import { Link } from 'react-router-dom';
import male from './imgs/male.jpg';
import female from './imgs/female.jpg';

const Chat = ({ navigate }) => {
    const loginUser = localStorage.getItem('loginUser');
    const userToChat = localStorage.getItem('storedUserToChat');
    const [currentChat, setCurrentChat] = useState(() => JSON.parse(localStorage.getItem('currentChat')) || null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [userToChatDetail, setUserToChatDetail] = useState({});
    const [allUsers, setAllUsers] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await fetch('http://localhost:8080/chat', {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                if (response.ok) {
                    const data = await response.json();
                    setAllUsers(data.users);
                    localStorage.setItem('storedAllUsers', JSON.stringify(data.users));
                } else {
                    setErrorMessage('Something went wrong!!');
                }
            } catch (err) {
                console.error('Error fetching user data:', err);
                setErrorMessage('An error occurred, Please try again');
            }
        };
        fetchUserData();
    }, []);

    useEffect(() => {
        const matchedUser = allUsers.find((user) => user.username === userToChat);
        if (matchedUser) {
            setUserToChatDetail(matchedUser);
            setErrorMessage('');
        } else {
            setErrorMessage('User not found!');
        }
        setIsLoading(false);
    }, [allUsers, userToChat]);

    useEffect(() => {
        const showChats = async () => {
            if (!currentChat && userToChatDetail.username) {
                try {
                    const response = await fetch('http://localhost:8080/chat/start', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ loginUser, userToChat }),
                    });
                    console.log('first')

                    if (response.ok) {
                        const chat = await response.json();
                        setCurrentChat(chat);
                        localStorage.setItem('currentChat', JSON.stringify(chat));
                    }
                } catch (error) {
                    console.error('Error opening chat:', error);
                }
            }
        };

        showChats();
    }, [userToChatDetail?.username, loginUser, userToChat]);

    useEffect(() => {
        const fetchMessages = async () => {
            if (currentChat && currentChat._id) {
                try {
                    const response = await fetch(`http://localhost:8080/api/chat/${currentChat._id}`);
                    if (response.ok) {
                        const data = await response.json();
                        setMessages(data);
                    }
                } catch (error) {
                    console.error('Error fetching messages:', error);
                }
            }
        };

        fetchMessages();
    }, [currentChat]);





    const bottomRef = useRef(null);

    useEffect(() => {
        // Scroll to the bottom when the component mounts
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);






    const sendMessage = async () => {
        try {
            const response = await fetch('http://localhost:8080/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chatId: currentChat._id, sender: loginUser, message: newMessage }),
            });

            if (response.ok) {
                const sentMessage = { sender: loginUser, message: newMessage, timestamp: new Date() };
                setMessages((prev) => [...prev, sentMessage]);
                setNewMessage('');
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };


  return (
    <div>
        <nav>
            <div className='chatBrand'>Chat.hub</div>
        </nav>
        <div>
            <div className='chat-section'>
                {isLoading && <p style={{marginTop: '10px', textAlign: 'center'}}>Loading...</p>}
                {!isLoading && (
                    <>
                        <div className="chat">
                            <div className='userId'>
                                <Link to={'/dashboard'} className='backArrow'><i className='bx bx-arrow-back' style={{fontSize: '30px', color: 'black'}}></i></Link>
                                <span className="userPic">
                                    <img src={userToChatDetail.gender === 'Female' ? female : male} alt="profile" />
                                </span>
                                <span className="chatUsername">{userToChatDetail?.fullname || 'Loading...'} <i className='bx bxs-badge-check'></i></span>
                            </div>
                            <div className="messages">
                                <div className="userProfile">
                                    <span className="profilePic">
                                        <img src={userToChatDetail.gender === 'Female' ? female : male} alt="profile" />
                                    </span>
                                    <span className="userName">{userToChatDetail?.fullname || 'Loading...'}</span>
                            
                                </div>
                                {errorMessage && <p className="errorMessage">{errorMessage}</p>}
                            
                                {messages.map((msg, index) => (
                                    <div key={index} className={`message ${msg.sender === loginUser ? 'sent' : 'received'}`}>
                                        <p className="messageContent" style={{backgroundColor: `${msg.sender === loginUser ? 'purple' : 'green'}`}}>
                                        <span>{msg.message}</span>
                                        <small>{new Date(msg.timestamp).toLocaleTimeString().slice(0, 5)}</small>
                                        </p>
                                    </div>
                                ))}
                                <div ref={bottomRef}></div>
                            </div>
                            
                            <form className='messageForm' onSubmit={(e) => {e.preventDefault(); sendMessage()}}>
                                <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                autoFocus
                                placeholder="Type your message"
                                className="messageInput"
                                />
                                {/* <button onClick={sendMessage} className="sendButton">Send</button> */}
                                <span className='sendButton'><i className='bx bxs-send' type='button' onClick={sendMessage}></i></span>
                            </form>
                            
                        </div>
                    </>                  
                )}
            </div>
        </div>
    </div>
  )
}

export default Chat