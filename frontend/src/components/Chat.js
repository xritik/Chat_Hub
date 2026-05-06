import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import male from '../imgs/male.jpg';
import female from '../imgs/female.jpg';
 
const Chat = ({ HOST, navigate }) => {
    const loginUser = localStorage.getItem('loginUser');
    const userToChat = localStorage.getItem('storedUserToChat');
 
    const [isSocketReady, setIsSocketReady] = useState(false);
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
 
    // KEY FIX: always-fresh ref to currentChat._id so WS closure never goes stale
    const currentChatRef = useRef(null);
 
    // Keep the ref in sync whenever currentChat changes
    useEffect(() => {
        currentChatRef.current = currentChat;
    }, [currentChat]);
 
 
    // 1. Restore currentChat from localStorage on first mount
    useEffect(() => {
        const storedChat = localStorage.getItem('currentChat');
        if (storedChat) {
            try {
                setCurrentChat(JSON.parse(storedChat));
            } catch {}
        }
    }, []);
 
    // 2. Fetch all users
    useEffect(() => {
        const fetchUsers = async () => {
            const res = await fetch(`${HOST}/users`);
            const data = await res.json();
            setAllUsers(data.users);
        };
        fetchUsers();
    }, [HOST]);
 
    // 3. Find selected user from allUsers
    useEffect(() => {
        const matched = allUsers.find(u => u.username === userToChat);
        if (matched) {
            setUserToChatDetail(matched);
            setIsLoading(false);
        }
    }, [allUsers, userToChat]);
 
    // 4. Start (or resume) chat once we have the target user
    useEffect(() => {
        if (!userToChatDetail.username) return;
 
        const startChat = async () => {
            try {
                setErrorMessage('');
 
                const res = await fetch(`${HOST}/chat/start`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ loginUser, userToChat }),
                });
 
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.message || 'Failed to start chat');
                }
 
                const chat = await res.json();
                setCurrentChat(chat);
                localStorage.setItem('currentChat', JSON.stringify(chat));
 
            } catch (error) {
                setErrorMessage(error.message || 'Something went wrong while starting chat');
            }
        };
 
        startChat();
    }, [userToChatDetail, HOST, loginUser, userToChat]);
 
    // 5. Fetch message history whenever chatId changes
    useEffect(() => {
        if (!currentChat?._id) return;
 
        // Clear old messages immediately so stale data isn't shown
        setMessages([]);
        setIsFirstScroll(true);
 
        const fetchMessages = async () => {
            const res = await fetch(`${HOST}/chat/${currentChat._id}`);
            const data = await res.json();
 
            const formatted = data.map(msg => ({
                ...msg,
                chatId: currentChat._id,
                timestamp: msg.timestamp || new Date().toISOString(),
            }));
 
            setMessages(formatted);
        };
 
        fetchMessages();
    }, [currentChat?._id, HOST]);
 
 
    // 6. WebSocket — connect ONCE per session, never re-connect on chat switch
    //    Uses currentChatRef so onmessage always has the latest chatId.
    useEffect(() => {
        let socket;
        let destroyed = false;
 
        const connect = () => {
            socket = new WebSocket(process.env.REACT_APP_WS_URL);
            socketRef.current = socket;
            setIsSocketReady(false);
 
            socket.onopen = () => {
                if (destroyed) return;
                console.log('WS Connected');
                setIsSocketReady(true);
                socket.send(JSON.stringify({ type: 'register', userId: loginUser }));
            };
 
            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    const activeChatId = currentChatRef.current?._id;
 
                    // Only add if message belongs to the currently open chat
                    if (!data.chatId || data.chatId !== activeChatId) return;
 
                    setMessages(prev => {
                        // Deduplicate: if we already have this msgId, skip
                        if (data.msgId && prev.some(m => m.msgId === data.msgId)) {
                            return prev;
                        }
                        return [...prev, data];
                    });
                } catch (err) {
                    console.error('WS message parse error:', err);
                }
            };
 
            socket.onclose = () => {
                console.log('WS Disconnected');
                setIsSocketReady(false);
                if (!destroyed) {
                    setTimeout(connect, 2000);
                }
            };
 
            socket.onerror = () => {
                socket.close();
            };
        };
 
        connect();
 
        return () => {
            destroyed = true;
            socket?.close();
        };
    }, [loginUser]); // intentionally only loginUser — never currentChat._id
 
 
    // 7. Auto-scroll to newest message
    useEffect(() => {
        const chatContainer = chatContainerRef.current;
        if (!chatContainer) return;
 
        const isNearBottom =
            chatContainer.scrollHeight - chatContainer.scrollTop <= chatContainer.clientHeight + 50;
 
        if (isFirstScroll || isNearBottom) {
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                setIsFirstScroll(false);
            }, 100);
        }
    }, [messages, isFirstScroll]);
 
 
    // 8. Send message via WebSocket
    const sendMessage = () => {
        if (!newMessage.trim()) return;
 
        const socket = socketRef.current;
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            console.warn('Socket not ready');
            return;
        }
 
        if (!currentChat?._id) return;
 
        const messageData = {
            chatId: currentChat._id,
            sender: loginUser,
            receiverId: userToChat,
            message: newMessage,
            timestamp: new Date().toISOString(),
        };
 
        socket.send(JSON.stringify(messageData));
        setNewMessage('');
    };
 
    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

  return (
    <div>
        <nav>
            <div className='chatBrand'>RiChat</div>
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
                                            <small>{formatTime(msg.timestamp)}</small>
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
                                <span className='sendButton' disabled={!isSocketReady}><i className='bx bxs-send' type='button' onClick={sendMessage}></i></span>
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