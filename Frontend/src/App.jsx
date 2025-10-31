import './App.css';
import Sidebar from "./Sidebar.jsx";
import ChatWindow from "./ChatWindow.jsx";
import Auth from "./Auth.jsx";
import {MyContext} from "./MyContext.jsx";
import { useState, useEffect } from 'react';
import {v1 as uuidv1} from "uuid";

function App() {
  const [user, setUser] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState(null);
  const [currThreadId, setCurrThreadId] = useState(uuidv1());
  const [prevChats, setPrevChats] = useState([]); //stores all chats of curr threads
  const [newChat, setNewChat] = useState(true);
  const [allThreads, setAllThreads] = useState([]);

  // Check if user is already logged in
  useEffect(() => {
    const storedUser = localStorage.getItem('novamind_user');
    const isLoggedIn = localStorage.getItem('novamind_logged_in');
    if (storedUser && isLoggedIn === 'true') {
      const userData = JSON.parse(storedUser);
      setUser(userData);
    }
  }, []);

  const handleLogin = (userData) => {
    // Force clear any existing user data first
    localStorage.removeItem('novamind_user');
    localStorage.setItem('novamind_logged_in', 'false');
    
    // Set new user data
    setUser(userData);
    localStorage.setItem('novamind_logged_in', 'true');
    localStorage.setItem('novamind_user', JSON.stringify(userData));
    
    // Clear previous user's data completely
    setPrevChats([]);
    setAllThreads([]);
    setCurrThreadId(uuidv1());
    setNewChat(true);
    setPrompt("");
    setReply(null);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.setItem('novamind_logged_in', 'false');
    localStorage.removeItem('novamind_user');
    // Clear chat data on logout
    setPrevChats([]);
    setAllThreads([]);
    setCurrThreadId(uuidv1());
    setNewChat(true);
    setPrompt("");
    setReply(null);
  };

  const providerValues = {
    prompt, setPrompt,
    reply, setReply,
    currThreadId, setCurrThreadId,
    newChat, setNewChat,
    prevChats, setPrevChats,
    allThreads, setAllThreads,
    user, 
    handleLogout
  }; 

  // Show auth screen if not logged in
  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className='app'>
      <MyContext.Provider value={providerValues}>
          <Sidebar></Sidebar>
          <ChatWindow></ChatWindow>
        </MyContext.Provider>
    </div>
  )
}

export default App
