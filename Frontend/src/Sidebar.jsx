import "./Sidebar.css";
import { useContext, useEffect, useState } from "react";
import { MyContext } from "./MyContext.jsx";
import {v1 as uuidv1} from "uuid";
import ConfirmDialog from "./ConfirmDialog.jsx";
import config from "./config.js";

function Sidebar() {
    const {allThreads, setAllThreads, currThreadId, setNewChat, setPrompt, setReply, setCurrThreadId, setPrevChats, user, isSidebarOpen, setIsSidebarOpen} = useContext(MyContext);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, threadId: null });

    const getAllThreads = async () => {
        if (!user) return;
        
        try {
            const userId = user.email || user.guestId || 'anonymous';
            const response = await fetch(`${config.API_URL}/api/thread?userId=${encodeURIComponent(userId)}`);
            const res = await response.json();
            const filteredData = res.map(thread => ({threadId: thread.threadId, title: thread.title}));
            setAllThreads(filteredData);
        } catch(err) {
            console.log('Error fetching threads:', err);
        }
    };

    useEffect(() => {
        getAllThreads();
    }, [currThreadId, user]) // Add user dependency to reload threads when user changes


    const createNewChat = () => {
        setNewChat(true);
        setPrompt("");
        setReply(null);
        setCurrThreadId(uuidv1());
        setPrevChats([]);
        setIsSidebarOpen(false); // Close sidebar on mobile after creating new chat
    }

    const changeThread = async (newThreadId) => {
        setCurrThreadId(newThreadId);
        setIsSidebarOpen(false); // Close sidebar on mobile after selecting thread

        if (!user) {
            console.log('No user found, cannot change thread');
            return;
        }

        try {
            const userId = user.email || user.guestId || 'anonymous';
            const response = await fetch(`${config.API_URL}/api/thread/${newThreadId}?userId=${encodeURIComponent(userId)}`);
            const res = await response.json();
            setPrevChats(res);
            setNewChat(false);
            setReply(null);
        } catch(err) {
            console.log('Error changing thread:', err);
        }
    }   

    const handleDeleteClick = (threadId) => {
        setConfirmDialog({ isOpen: true, threadId });
    };

    const deleteThread = async (threadId) => {
        if (!user) return;
        
        try {
            const userId = user.email || user.guestId || 'anonymous';
            const response = await fetch(`${config.API_URL}/api/thread/${threadId}?userId=${encodeURIComponent(userId)}`, {
                method: "DELETE"
            });

            if (response.ok) {
                // Remove the thread from local state
                setAllThreads(prevThreads => prevThreads.filter(thread => thread.threadId !== threadId));
                
                // If the deleted thread was the current one, create a new chat
                if (threadId === currThreadId) {
                    createNewChat();
                }
            } else {
                console.error("Failed to delete thread");
            }
        } catch(err) {
            console.log(err);
        }
    };

    const handleConfirmDelete = async () => {
        const threadId = confirmDialog.threadId;
        setConfirmDialog({ isOpen: false, threadId: null });
        await deleteThread(threadId);
    };

    const handleCancelDelete = () => {
        setConfirmDialog({ isOpen: false, threadId: null });
    };

    return (
        <>
            {/* Mobile overlay */}
            {isSidebarOpen && (
                <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>
            )}
            
            <section className={`sidebar ${isSidebarOpen ? 'sidebar-open' : ''}`}>
                <button className="new-chat-button" onClick={createNewChat}>
                    <img src="/novamind-logo.png" alt="NovaMind logo" className="logo"></img>
                    <span>New Chat</span>
                </button>

                <div className="sidebar-content">
                    <ul className="history">
                    {
                        allThreads?.map((thread, idx) => (
                            <li key={idx} 
                                onClick={(e) => changeThread(thread.threadId)}
                                className={thread.threadId === currThreadId ? "highlighted": " "}
                            >
                                {thread.title}
                                <i className="fa-solid fa-trash"
                                    onClick={(e) => {
                                        e.stopPropagation(); //stop event bubbling
                                        handleDeleteClick(thread.threadId);
                                    }}
                                ></i>
                            </li>
                        ))
                    }
                    </ul>
                </div>
    
                <div className="sign">
                    <p>NovaMind AI &copy; 2025</p>
                    <p className="developer-credit">Developed by shreyas.me</p>
                </div>

                <ConfirmDialog
                    isOpen={confirmDialog.isOpen}
                    title="Delete Chat"
                    message="Are you sure you want to delete this chat? This action cannot be undone."
                    onConfirm={handleConfirmDelete}
                    onCancel={handleCancelDelete}
                />
            </section>
        </>
    )
}

export default Sidebar;