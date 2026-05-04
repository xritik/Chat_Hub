import React, {useState, useEffect, useRef} from 'react';
import { Link } from 'react-router-dom';
import male from '../imgs/male.jpg';
import female from '../imgs/female.jpg';
const socket = new WebSocket(process.env.REACT_APP_WS_URL);

const Chat = ({ HOST, navigate }) => {
    const loginUser = localStorage.getItem('loginUser');
    const userToChat = localStorage.getItem('storedUserToChat');

    // const [currentChat, setCurrentChat] = useState(() => JSON.parse(localStorage.getItem('currentChat')) || null);
    const [currentChat, setCurrentChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [userToChatDetail, setUserToChatDetail] = useState({});
    const [allUsers, setAllUsers] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [isFirstScroll, setIsFirstScroll] = useState(true);

    const socketRef = useRef(null);
    const chatContainerRef = useRef(null);
    const messagesEndRef = useRef(null);


    useEffect(() => {
        const storedChat = localStorage.getItem('currentChat');
        if (storedChat) {
            setCurrentChat(JSON.parse(storedChat));
        }
    }, []);

    // 1. Fetch all users
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await fetch(`${HOST}/users`);
                if (response.ok) {
                    const data = await response.json();
                    setAllUsers(data.users);
                    localStorage.setItem('storedAllUsers', JSON.stringify(data.users));
                } else {
                    setErrorMessage('Something went wrong!!');
                }
            } catch (err) {
                console.error(err);
                setErrorMessage('An error occurred');
            }
        };
        fetchUserData();
    }, []);

    // 2. Find selected user
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

    // 3. Start chat
    useEffect(() => {
        const showChats = async () => {
            if (!currentChat && userToChatDetail.username) {
                try {
                    const response = await fetch(`${HOST}/chat/start`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ loginUser, userToChat }),
                    });

                    if (response.ok) {
                        const chat = await response.json();
                        setCurrentChat(chat);
                        localStorage.setItem('currentChat', JSON.stringify(chat));
                    }
                } catch (error) {
                    console.error(error);
                }
            }
        };
        showChats();
    }, [userToChatDetail?.username, loginUser, userToChat]);


    // ADD IT RIGHT HERE
    useEffect(() => {
        setMessages([]);
    }, [currentChat]);


    // 4. Fetch old messages (ONLY ONCE)
    useEffect(() => {
        if (!currentChat?._id) return;

        const fetchMessages = async () => {
            try {
                console.log("Fetching old messages...");

                const response = await fetch(`${HOST}/chat/${currentChat._id}`);

                if (response.ok) {
                    const data = await response.json();
                    console.log("Old messages:", data);

                    // IMPORTANT: attach chatId to each message
                    const formattedMessages = data.map(msg => ({
                        ...msg,
                        chatId: currentChat._id
                    }));

                    setMessages(formattedMessages);
                }
            } catch (error) {
                console.error(error);
            }
        };

        fetchMessages();
    }, [currentChat]);

    // 5. WebSocket Connection
    useEffect(() => {
        if (socketRef.current) return; // prevent multiple connections

        socketRef.current = socket

        socketRef.current.onopen = () => {
            console.log("WebSocket Connected");
        };

        socketRef.current.onmessage = (event) => {
            const data = JSON.parse(event.data);

            console.log("Received:", data);

            setMessages(prev => [...prev, data]); // DON'T filter here
        };

        socketRef.current.onclose = () => {
            console.log("WebSocket Disconnected");
        };

        return () => {
            socketRef.current?.close();
            socketRef.current = null;
        };
    }, []);






    // 6. Auto Scroll
    useEffect(() => {
        const chatContainer = chatContainerRef.current;
        if (!chatContainer) return;

        const isNearBottom =
            chatContainer.scrollHeight - chatContainer.scrollTop <= chatContainer.clientHeight + 50;

        if (isFirstScroll || isNearBottom) {
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
                setIsFirstScroll(false);
            }, 300);
        }
    }, [messages]);

    // 7. Send Message via WebSocket
    const sendMessage = () => {
        if (!newMessage.trim()) return;
        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;

        const messageData = {
            chatId: currentChat._id,
            sender: loginUser,
            message: newMessage
        };

        socketRef.current.send(JSON.stringify(messageData));

        setNewMessage('');
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
                            <div ref={chatContainerRef} className="messages" id='messages'>
                                <div className="userProfile">
                                    <span className="profilePic">
                                        <img src={userToChatDetail.gender === 'Female' ? female : male} alt="profile" />
                                    </span>
                                    <span className="userName">{userToChatDetail?.fullname || 'Loading...'}</span>
                            
                                </div>
                                {errorMessage && <p className="errorMessage">{errorMessage}</p>}
                            
                                {messages
                                    .filter(msg => msg.chatId === currentChat?._id)
                                    .map((msg, index) => (
                                        <div key={index} className={`message ${msg.sender === loginUser ? 'sent' : 'received'}`}>
                                            <p className="messageContent" style={{backgroundColor: `${msg.sender === loginUser ? 'purple' : 'green'}`}}>
                                            <span>{msg.message}</span>
                                            <small>{new Date(msg.timestamp).toLocaleTimeString().slice(0, 5)}</small>
                                            </p>
                                        </div>
                                ))}
                                <div ref={messagesEndRef}></div>
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