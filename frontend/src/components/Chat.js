import React, {useState, useEffect, useRef} from 'react';
import { Link } from 'react-router-dom';
import male from '../imgs/male.jpg';
import female from '../imgs/female.jpg';

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
        if (storedChat && !currentChat) {
            setCurrentChat(JSON.parse(storedChat));
        }
    }, [currentChat]);

    // 1. Fetch all users
    useEffect(() => {
        const fetchUsers = async () => {
            const res = await fetch(`${HOST}/users`);
            const data = await res.json();
            setAllUsers(data.users);
        };
        fetchUsers();
    }, [HOST]);

    // 2. Find selected user
    useEffect(() => {
        const matched = allUsers.find(u => u.username === userToChat);
        if (matched){
            setUserToChatDetail(matched);
            setIsLoading(false);
        }
    }, [allUsers, userToChat]);

    // 3. Start chat
    useEffect(() => {
        if (!userToChatDetail.username) return;

        const startChat = async () => {
            try {
                setErrorMessage(""); // clear old errors if any

                const res = await fetch(`${HOST}/chat/start`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ loginUser, userToChat })
                });

                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.message || "Failed to start chat");
                }

                const chat = await res.json();
                setCurrentChat(chat);

            } catch (error) {
                setErrorMessage(error.message || "Something went wrong while starting chat");
            }
        };

        startChat();
    }, [userToChatDetail, HOST, loginUser, userToChat]);


    // ADD IT RIGHT HERE
    useEffect(() => {
        if (!currentChat) return;
        setMessages([]); // optional but safe now
    }, [currentChat]);


    // 4. Fetch old messages (ONLY ONCE)
    useEffect(() => {
        if (!currentChat?._id) return;

        const fetchMessages = async () => {
            const res = await fetch(`${HOST}/chat/${currentChat._id}`);
            const data = await res.json();

            const formatted = data.map(msg => ({
                ...msg,
                chatId: currentChat._id
            }));

            setMessages(formatted);
        };

        fetchMessages();
    }, [currentChat, HOST]);



    // 🔥 5. WebSocket with RECONNECT (CRITICAL FIX)
    useEffect(() => {
        let socket;

        const connect = () => {
            socket = new WebSocket(process.env.REACT_APP_WS_URL);
            socketRef.current = socket;

            socket.onopen = () => {
                console.log("✅ WS Connected");

                socket.send(JSON.stringify({
                    type: "register",
                    userId: loginUser
                }));
            };

            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);

                console.log("📩 Received:", data);

                // ✅ IMPORTANT FIX: use functional update + check safely
                setMessages(prev => {
                    // only push if belongs to current chat
                    if (data.chatId === currentChat?._id) {
                        return [...prev, data];
                    }
                    return prev;
                });
            };

            socket.onclose = () => {
                console.log("❌ WS Disconnected → Reconnecting...");
                setTimeout(connect, 2000);
            };

            socket.onerror = (err) => {
                console.log("WS Error:", err);
                socket.close();
            };
        };

        connect();

        return () => {
            socket?.close();
        };
    }, [loginUser, currentChat?._id]); // ❌ removed currentChat





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
    }, [messages, isFirstScroll, currentChat]);

    // 7. Send Message via WebSocket
    const sendMessage = () => {
        if (!newMessage.trim()) return;

        const socket = socketRef.current;

        if (!socket || socket.readyState !== WebSocket.OPEN) {
            console.log("❌ Socket not connected");
            return;
        }

        const messageData = {
            chatId: currentChat._id,
            sender: loginUser,
            receiverId: userToChat,
            message: newMessage
        };

        socket.send(JSON.stringify(messageData));

        // ✅ optional: optimistic UI update (instant message)
        setMessages(prev => [...prev, messageData]);

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