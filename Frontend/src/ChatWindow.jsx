import "./ChatWindow.css";
import Chat from "./Chat.jsx";
import { MyContext } from "./MyContext.jsx";
import { useContext, useState, useEffect, useRef } from "react";
import {ScaleLoader} from "react-spinners";

function ChatWindow() {
    const {prompt, setPrompt, reply, setReply, currThreadId, setPrevChats, setNewChat, user, handleLogout} = useContext(MyContext);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [navbarVisible, setNavbarVisible] = useState(true);
    const chatContentRef = useRef(null);
    const lastScrollTop = useRef(0);

    const getReply = async () => {
        setLoading(true);
        setNewChat(false);

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

        try {
            const response = await fetch("http://localhost:5000/api/chat", options);
            const res = await response.json();
            console.log(res);
            setReply(res.reply);
        } catch(err) {
            console.log(err);
        }
        setLoading(false);
    }

    //Append new chat to prevChats
    useEffect(() => {
        if(prompt && reply) {
            setPrevChats(prevChats => (
                [...prevChats, {
                    role: "user",
                    content: prompt
                },{
                    role: "assistant",
                    content: reply
                }]
            ));
        }

        setPrompt("");
    }, [reply]);


    const handleProfileClick = () => {
        setIsOpen(!isOpen);
    }

    // Handle scroll to hide/show navbar
    const handleScroll = (event) => {
        let scrollTop = 0;
        
        // Get scroll position from the event target (the actual scrolling element)
        if (event && event.target) {
            scrollTop = event.target.scrollTop;
        } else if (chatContentRef.current) {
            // Try to find the .chats element
            const chatsElement = chatContentRef.current.querySelector('.chats');
            if (chatsElement) {
                scrollTop = chatsElement.scrollTop;
            } else {
                scrollTop = chatContentRef.current.scrollTop;
            }
        } else {
            scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        }
        
        const scrollDirection = scrollTop > lastScrollTop.current ? 'down' : 'up';
        
        // Hide navbar when scrolling down, show when scrolling up
        if (scrollDirection === 'down' && scrollTop > 30) {
            setNavbarVisible(false);
            setIsOpen(false); // Close dropdown when scrolling
        } else if (scrollDirection === 'up' || scrollTop <= 30) {
            setNavbarVisible(true);
        }
        
        lastScrollTop.current = scrollTop;
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
                <div className="inputBox">
                    <input placeholder="Ask anything"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter'? getReply() : ''}
                    >
                           
                    </input>
                    <div id="submit" onClick={getReply}><i className="fa-solid fa-paper-plane"></i></div>
                </div>
                <p className="info">
                    NovaMind can make mistakes. Consider checking important information.
                </p>
            </div>
        </div>
    )
}

export default ChatWindow;