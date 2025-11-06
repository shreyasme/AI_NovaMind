import "./ChatWindow.css";
import Chat from "./Chat.jsx";
import { MyContext } from "./MyContext.jsx";
import { useContext, useState, useEffect, useRef } from "react";
import {ScaleLoader} from "react-spinners";
import config from "./config.js";

function ChatWindow() {
    const {prompt, setPrompt, reply, setReply, currThreadId, setPrevChats, setNewChat, user, handleLogout} = useContext(MyContext);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [navbarVisible, setNavbarVisible] = useState(true);
    const chatContentRef = useRef(null);
    const lastScrollTop = useRef(0);
    const scrollTimeout = useRef(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef(null);
    const [isListening, setIsListening] = useState(false);
    const [recognition, setRecognition] = useState(null);

    // Initialize speech recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognitionInstance = new SpeechRecognition();
            recognitionInstance.continuous = false;
            recognitionInstance.interimResults = false;
            recognitionInstance.lang = 'en-US';

            recognitionInstance.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setPrompt(transcript);
                setIsListening(false);
            };

            recognitionInstance.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                setIsListening(false);
            };

            recognitionInstance.onend = () => {
                setIsListening(false);
            };

            setRecognition(recognitionInstance);
        }
    }, []);

    const toggleVoiceInput = () => {
        if (!recognition) {
            alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
            return;
        }

        if (isListening) {
            recognition.stop();
            setIsListening(false);
        } else {
            recognition.start();
            setIsListening(true);
        }
    };

    const getReply = async () => {
        if (!prompt && !selectedImage) return;

        setLoading(true);
        setNewChat(false);

        try {
            if (selectedImage) {
                // Handle image upload and analysis
                const userQuestion = prompt || "What's in this image? Please describe it in detail.";
                
                // Add user message immediately
                setPrevChats(prevChats => [...prevChats, {
                    role: "user",
                    content: `🖼️ [Image uploaded] ${userQuestion}`
                }]);
                
                console.log("📤 Sending image upload request...");
                console.log("Selected image:", selectedImage);
                console.log("Thread ID:", currThreadId);
                console.log("User:", user);
                
                const formData = new FormData();
                formData.append('image', selectedImage);
                formData.append('threadId', currThreadId);
                formData.append('question', userQuestion);
                formData.append('userId', user?.email || user?.guestId || 'anonymous');
                formData.append('userEmail', user?.email || 'anonymous@novamind.com');
                
                console.log("📦 FormData prepared");

                const response = await fetch(`${config.API_URL}/api/analyze-image`, {
                    method: "POST",
                    body: formData
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const res = await response.json();
                console.log("Image analysis response:", res);
                
                // Add AI response
                setPrevChats(prevChats => [...prevChats, {
                    role: "assistant",
                    content: res.reply || res.error || "Failed to analyze image"
                }]);
                
                // Clear image and prompt after sending
                setSelectedImage(null);
                setImagePreview(null);
                setPrompt("");
            } else {
                // Handle regular text message
                const options = {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        message: prompt,
                        threadId: currThreadId,
                        userId: user?.email || user?.guestId || 'anonymous',
                        userEmail: user?.email || 'anonymous@novamind.com'
                    })
                };

                const response = await fetch(`${config.API_URL}/api/chat`, options);
                const res = await response.json();
                console.log(res);
                setReply(res.reply);
            }
        } catch(err) {
            console.error("Error in getReply:", err);
            setPrevChats(prevChats => [...prevChats, {
                role: "assistant",
                content: "❌ Error: " + err.message
            }]);
        }
        setLoading(false);
    }

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    //Append new chat to prevChats
    useEffect(() => {
        if(reply) {
            // Only add user message if there was a prompt
            const newMessages = [];
            if (prompt) {
                newMessages.push({
                    role: "user",
                    content: prompt
                });
            }
            newMessages.push({
                role: "assistant",
                content: reply
            });
            
            setPrevChats(prevChats => [...prevChats, ...newMessages]);
        }

        setPrompt("");
    }, [reply]);


    const handleProfileClick = () => {
        setIsOpen(!isOpen);
    }

    // Handle scroll to hide/show navbar
    const handleScroll = (event) => {
        // Clear any pending timeout
        if (scrollTimeout.current) {
            clearTimeout(scrollTimeout.current);
        }

        // Debounce the scroll handler
        scrollTimeout.current = setTimeout(() => {
            let scrollTop = 0;
            let scrollHeight = 0;
            let clientHeight = 0;
            
            // Get scroll position from the event target (the actual scrolling element)
            if (event && event.target) {
                scrollTop = event.target.scrollTop;
                scrollHeight = event.target.scrollHeight;
                clientHeight = event.target.clientHeight;
            } else if (chatContentRef.current) {
                // Try to find the .chats element
                const chatsElement = chatContentRef.current.querySelector('.chats');
                if (chatsElement) {
                    scrollTop = chatsElement.scrollTop;
                    scrollHeight = chatsElement.scrollHeight;
                    clientHeight = chatsElement.clientHeight;
                } else {
                    scrollTop = chatContentRef.current.scrollTop;
                    scrollHeight = chatContentRef.current.scrollHeight;
                    clientHeight = chatContentRef.current.clientHeight;
                }
            } else {
                scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                scrollHeight = document.documentElement.scrollHeight;
                clientHeight = window.innerHeight;
            }
            
            // Check if we're near the bottom (within 50px)
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
            
            // Don't change navbar state if we're near the bottom to prevent flickering
            if (isNearBottom) {
                return;
            }
            
            // Only update if scroll changed by more than 10px to prevent flickering
            const scrollDiff = Math.abs(scrollTop - lastScrollTop.current);
            if (scrollDiff < 10) return;
            
            const scrollDirection = scrollTop > lastScrollTop.current ? 'down' : 'up';
            
            // Hide navbar when scrolling down, show when scrolling up
            if (scrollDirection === 'down' && scrollTop > 30) {
                setNavbarVisible(false);
                setIsOpen(false); // Close dropdown when scrolling
            } else if (scrollDirection === 'up' || scrollTop <= 30) {
                setNavbarVisible(true);
            }
            
            lastScrollTop.current = scrollTop;
        }, 50); // 50ms debounce delay
    };

    // Add scroll listener to the actual scrollable element (.chats)
    useEffect(() => {
        const setupScrollListener = () => {
            const chatContent = chatContentRef.current;
            
            if (chatContent) {
                // Find the .chats element which is the actual scrollable container
                const chatsElement = chatContent.querySelector('.chats');
                
                if (chatsElement) {
                    chatsElement.addEventListener('scroll', handleScroll, { passive: true });
                    
                    return () => {
                        chatsElement.removeEventListener('scroll', handleScroll);
                    };
                } else {
                    chatContent.addEventListener('scroll', handleScroll, { passive: true });
                    
                    return () => {
                        chatContent.removeEventListener('scroll', handleScroll);
                    };
                }
            }
        };

        // Delay setup to ensure DOM is fully rendered
        const timer = setTimeout(setupScrollListener, 500);
        
        return () => {
            clearTimeout(timer);
        };
    }, []);


    return (
        <div className="chatWindow">
            <div className={`navbar ${navbarVisible ? 'navbar-visible' : 'navbar-hidden'}`}>
                <div className="brand-name">
                    <img src="/novamind-logo.png" alt="NovaMind" className="logo" />
                    NovaMind
                </div>
                <div className="userIconDiv" onClick={handleProfileClick}>
                    <span className="userIcon"><i className="fa-solid fa-user"></i></span>
                </div>
            </div>
            {
                isOpen && 
                <div className="dropDown">
                    <div className="dropDownItem user-info">
                        <i className="fa-solid fa-user"></i>
                        <span>{user?.name || 'User'}</span>
                    </div>
                    <div className="dropDownItem"><i className="fa-solid fa-gear"></i> Settings</div>
                    <div className="dropDownItem" onClick={handleLogout}>
                        <i className="fa-solid fa-arrow-right-from-bracket"></i> Log out
                    </div>
                </div>
            }
            
            <div className="chatContent" ref={chatContentRef}>
                <Chat></Chat>
                {loading && (
                    <div className="loaderContainer">
                        <ScaleLoader color="#fff" loading={loading} />
                    </div>
                )}
            </div>
            
            <div className="chatInput">
                {imagePreview && (
                    <div className="imagePreviewContainer">
                        <div className="imagePreview">
                            <img src={imagePreview} alt="Preview" />
                            <button className="removeImageBtn" onClick={removeImage}>
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                    </div>
                )}
                <div className="inputBox">
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        accept="image/*" 
                        onChange={handleImageSelect}
                        style={{ display: 'none' }}
                    />
                    <button 
                        className="imageUploadBtn" 
                        onClick={() => fileInputRef.current?.click()}
                        title="Upload image"
                    >
                        <i className="fa-solid fa-image"></i>
                    </button>
                    <button 
                        className={`voiceInputBtn ${isListening ? 'listening' : ''}`}
                        onClick={toggleVoiceInput}
                        title={isListening ? "Stop listening" : "Voice input"}
                    >
                        <i className={`fa-solid ${isListening ? 'fa-stop' : 'fa-microphone'}`}></i>
                    </button>
                    <input placeholder={isListening ? "Listening..." : selectedImage ? "Ask about this image..." : "Ask anything"}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter'? getReply() : ''}
                        disabled={isListening}
                    >
                           
                    </input>
                    <div id="submit" onClick={getReply}><i className="fa-solid fa-paper-plane"></i></div>
                </div>
                <p className="info">
                    NovaMind can make mistakes. Consider checking important information.
                </p>
                <p className="developer">
                    Developed by Shreyas
                </p>
            </div>
        </div>
    )
}

export default ChatWindow;