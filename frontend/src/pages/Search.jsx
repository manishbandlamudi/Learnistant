import React, { useState, useEffect, useContext, useRef } from 'react';
import { UserDataContext } from '../context/userContext.jsx';
import { Search, Mic, Image, Send, X, Volume2, Plus, Menu, MessageSquare, Trash2, Gamepad2, Mail, LogIn, UserPlus, BookOpen, Code, TrendingUp } from 'lucide-react';
import axios from 'axios';
import Vapi from '@vapi-ai/web';
import { useNavigate } from 'react-router-dom';

const SearchPage = () => {
  const { userData, serverUrl, setUserData } = useContext(UserDataContext);
  const fileInputRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMessages, setCurrentMessages] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [vapi, setVapi] = useState(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const VAPI_PUBLIC_KEY = import.meta.env.VITE_VAPI_PUBLIC_KEY;
  const VAPI_SEARCH_ASSISTANT_ID = import.meta.env.VITE_VAPI_SEARCH_ASSISTANT_ID;

  // Enhanced check if user is logged in - checks multiple possible fields
  const isLoggedIn = () => {
    console.log('UserData in isLoggedIn:', userData);
    const loggedIn = userData && (
      userData.id || 
      userData._id || 
      userData.email || 
      userData.name || 
      userData.username ||
      // Check if userData is not null/undefined and not an empty object
      (typeof userData === 'object' && Object.keys(userData).length > 0)
    );
    console.log('Is logged in result:', loggedIn);
    return loggedIn;
  };

  const hasCompletedSetup = () => {
    return userData?.assistantName && userData?.assistantImage;
  };

  // Debug effect to monitor userData changes
  useEffect(() => {
    console.log('UserData changed in SearchPage:', userData);
    console.log('Is user logged in:', isLoggedIn());
  }, [userData]);

  // Vapi init
  useEffect(() => {
    if (!VAPI_PUBLIC_KEY) {
      console.error("Vapi Error: VITE_VAPI_PUBLIC_KEY is not defined");
      return;
    }
    const vapiInstance = new Vapi(VAPI_PUBLIC_KEY);
    setVapi(vapiInstance);

    vapiInstance.on('call-start', () => {
      setIsConnecting(false);
      setIsVoiceActive(true);
    });
    vapiInstance.on('call-end', () => {
      setIsConnecting(false);
      setIsVoiceActive(false);
    });
    vapiInstance.on('transcript', (transcript) => {
      if (transcript.type === 'final') {
        setSearchQuery(transcript.transcript);
        setTimeout(() => handleSearch(transcript.transcript), 500);
      }
    });
    vapiInstance.on('error', (e) => {
      console.error("Vapi Search Error:", e);
      setIsConnecting(false);
      setIsVoiceActive(false);
    });

    return () => {
      vapiInstance.removeAllListeners();
    };
  }, [VAPI_PUBLIC_KEY]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  // Chat management
  const createNewChat = () => {
    const newChatId = Date.now();
    const newChat = {
      id: newChatId,
      title: 'New Chat',
      messages: [],
      createdAt: new Date()
    };
    setChatHistory(prev => {
      const updated = [newChat, ...prev];
      if (updated.length > 5) {
        updated.pop();
      }
      return updated;
    });
    setCurrentChatId(newChatId);
    setCurrentMessages([]);
    setSearchQuery('');
    removeImage();
  };

  const loadChat = (chatId) => {
    const chat = chatHistory.find(c => c.id === chatId);
    if (chat) {
      setCurrentChatId(chatId);
      setCurrentMessages(chat.messages);
      setSidebarOpen(false);
    }
  };

  const deleteChat = (chatId, e) => {
    e.stopPropagation();
    setChatHistory(prev => prev.filter(c => c.id !== chatId));
    if (currentChatId === chatId) {
      setCurrentChatId(null);
      setCurrentMessages([]);
    }
  };

  const updateChatInHistory = (chatId, messages) => {
    setChatHistory(prev =>
      prev.map(chat =>
        chat.id === chatId
          ? {
              ...chat,
              messages,
              title: messages[0]?.text
                ? messages[0].text.substring(0, 30) +
                  (messages[0].text.length > 30 ? '...' : '')
                : 'New Chat',
            }
          : chat
      )
    );
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleMicClick = () => {
    navigate('/customize');
  };

  const handleGamesClick = () => {
    try {
      navigate('/games');
      console.log('Navigating to games...');
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const handleContactClick = () => {
    console.log('Contact Us clicked');
  };

  const handleLoginClick = () => {
    navigate('/signin');
  };

  const handleStartLearning = () => {
    try {
      navigate('/languages');
      console.log('Navigating to Languages page...');
    } catch (error) {
      console.error('Navigation error to Languages:', error);
    }
  };

  const handleProgressClick = () => {
    try {
      navigate('/progress'); // Navigate to progress page
      console.log('Navigating to Progress page...');
    } catch (error) {
      console.error('Navigation error to Progress:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.get(`${serverUrl}/api/auth/logout`, { withCredentials: true });
      setUserData(null);
      navigate("/signin");
    } catch (err) {
      setUserData(null);
      console.log(err);
    }
  };

  const handleSearch = async (query = searchQuery) => {
    if (!query.trim() && !uploadedImage) return;

    // Check if user is logged in before allowing search
    if (!isLoggedIn()) {
      setShowLoginPrompt(true);
      setTimeout(() => setShowLoginPrompt(false), 5000);
      return;
    }

    let chatId = currentChatId;
    if (!chatId) {
      // Create new chat first
      const newChatId = Date.now();
      const newChat = {
        id: newChatId,
        title: 'New Chat',
        messages: [],
        createdAt: new Date()
      };
      setChatHistory(prev => {
        const updated = [newChat, ...prev];
        if (updated.length > 5) {
          updated.pop();
        }
        return updated;
      });
      setCurrentChatId(newChatId);
      chatId = newChatId;
    }

    // Clear search query and image immediately
    setSearchQuery('');
    const currentImagePreview = imagePreview;
    const currentUploadedImage = uploadedImage;
    removeImage();

    setIsLoading(true);
    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: query,
      image: currentImagePreview,
      timestamp: new Date().toLocaleTimeString()
    };
    const newMessages = [...currentMessages, userMessage];
    setCurrentMessages(newMessages);

    try {
      const formData = new FormData();
      formData.append('message', query);
      if (currentUploadedImage) {
        formData.append('image', currentUploadedImage);
      }

      const response = await axios.post(`${serverUrl}/api/search/chat`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
      });

      const aiMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        text: response.data.response,
        timestamp: new Date().toLocaleTimeString()
      };
      const finalMessages = [...newMessages, aiMessage];
      setCurrentMessages(finalMessages);
      updateChatInHistory(chatId, finalMessages);
    } catch (error) {
      console.error('Search error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        text: 'Sorry, I encountered an error while processing your request.',
        timestamp: new Date().toLocaleTimeString()
      };
      const finalMessages = [...newMessages, errorMessage];
      setCurrentMessages(finalMessages);
      updateChatInHistory(chatId, finalMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

 return (
  <div 
    className="flex h-screen relative "
    style={{ 
      background: 'radial-gradient(circle at 50% 50%, #b3c7df 0%, #7a8fa6 100%)',
      fontFamily: "'Segoe UI', 'Roboto', Arial, sans-serif"
    }}
  >
    {/* Remove or comment out the background div since we're using the gradient directly */}
    
    {/* Alternative method using img tag as fallback */}
    <img 
      src="/search.jpg" 
      alt="Background" 
      className="absolute inset-0 w-full h-full object-cover opacity-40 z-0"
      onError={(e) => {
        // Try alternative paths if main path fails
        e.target.src = './search.jpg';
        e.target.onerror = () => {
          e.target.src = './public/search.jpg';
          e.target.onerror = null;
        };
      }}
      style={{ display: 'none' }}
      onLoad={(e) => {
        // If img loads successfully, show the img (gradient will be behind it)
        e.target.style.display = 'block';
      }}
    />
    
    {/* Subtle circles on the left */}
    <div 
      className="absolute left-0 bottom-0 w-2/5 h-2/5 z-0 pointer-events-none"
      style={{
        background: `repeating-radial-gradient(
          circle,
          transparent 0px,
          transparent 24px,
          rgba(140, 170, 200, 0.15) 25px
        )`
      }}
    ></div>

    {/* Dotted grid on the right */}
    <div 
      className="absolute top-12 right-4 w-72 h-72 z-0 pointer-events-none"
      style={{
        background: 'radial-gradient(circle, rgba(150, 180, 210, 0.2) 1px, transparent 1.5px)',
        backgroundSize: '18px 18px'
      }}
    ></div>

    {/* Decorative sparkle in the bottom-right */}
    <div 
      className="absolute bottom-8 right-8 w-10 h-10 z-10 pointer-events-none opacity-40"
      style={{
        backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="38" height="38"><polygon points="19,0 24,14 38,19 24,24 19,38 14,24 0,19 14,14" fill="white"/></svg>')`,
        backgroundRepeat: 'no-repeat'
      }}
    ></div>
    
    {/* Content Overlay */}
    <div className="relative z-20 flex w-full h-full">
      
      {/* Login Prompt Modal */}
      {showLoginPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md mx-4 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4">Login Required</h3>
            <p className="text-gray-300 mb-6">
              Please log in to use the search feature and access your chat history.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => navigate('/signin')}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Login
              </button>
              <button 
                onClick={() => navigate('/signin')}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Sign Up
              </button>
              <button 
                onClick={() => setShowLoginPrompt(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 
        bg-gray-900 bg-opacity-80 backdrop-blur-md border-r border-gray-700 
        overflow-hidden flex flex-col`}>
        
        <div className="p-3">
          <button 
            onClick={createNewChat} 
            className="w-full flex items-center gap-3 px-3 py-2.5 text-white 
            rounded-lg transition-colors hover:bg-gray-800 hover:bg-opacity-80 border border-gray-700 
            disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!isLoggedIn()}
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">New chat</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto px-3">
          <div className="space-y-1">
            {isLoggedIn() && chatHistory.map((chat) => (
              <div 
                key={chat.id} 
                onClick={() => loadChat(chat.id)} 
                className={`group flex items-center justify-between px-3 py-2.5 
                  rounded-lg cursor-pointer transition-colors ${
                    currentChatId === chat.id ? 'bg-gray-800 bg-opacity-80' : 'hover:bg-gray-800 hover:bg-opacity-60'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <MessageSquare className="w-4 h-4 text-white flex-shrink-0" />
                  <span className="text-sm text-white truncate">{chat.title}</span>
                </div>
                <button 
                  onClick={(e) => deleteChat(chat.id, e)} 
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 hover:bg-opacity-80 rounded transition-opacity"
                >
                  <Trash2 className="w-3 h-3 text-white" />
                </button>
              </div>
            ))}
            {!isLoggedIn() && (
              <div className="text-center py-8">
                <p className="text-gray-300 text-sm mb-4">Login to view your chat history</p>
                <button 
                  onClick={() => navigate('/signin')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                >
                  Login Now
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="p-3 border-t border-gray-700 space-y-1">
          <button 
            onClick={()=>navigate('/contact')}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-white hover:bg-gray-800 hover:bg-opacity-60 rounded-lg transition-colors text-sm"
          >
            <Mail className="w-4 h-4" />
            Contact Us
          </button>
          {isLoggedIn() && (
            <button 
              onClick={handleLogout} 
              className="w-full flex items-center gap-3 px-3 py-2.5 text-white hover:bg-gray-800 hover:bg-opacity-60 rounded-lg transition-colors text-sm"
            >
              Logout
            </button>
          )}
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        
        {/* Header with light blue-gray background */}
        <div 
          className="p-4 border-b backdrop-blur-md flex items-center justify-between"
          style={{ 
            backgroundColor: 'rgba(179, 199, 223, 0.9)',
            borderBottomColor: 'rgba(179, 199, 223, 0.3)' 
          }}
        >
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)} 
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-800" />
            </button>
            <h1 className="text-xl font-semibold text-gray-800 drop-shadow-lg">Learnistant</h1>
          </div>
          <div className="flex items-center gap-3">
            {isLoggedIn() && (
              <button
                onClick={handleProgressClick}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-orange-700 cursor-pointer text-white rounded-lg transition-colors font-medium shadow-lg"
                title="View Your Progress"
              >
                <TrendingUp className="w-4 h-4" />
                <span className="hidden md:block" onClick={()=>navigate('/progress')}>Progress</span>
              </button>
            )}
            <button
              onClick={()=>navigate('/dsahub')}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 cursor-pointer text-white rounded-lg transition-colors font-medium shadow-lg"
              title="Start Your Learning Journey"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden md:block">Start Learning</span>
            </button>
            {!isLoggedIn() && (
              <>
                <button
                  onClick={() => navigate('/signin')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium shadow-lg"
                  title="Login"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </button>
                <button
                  onClick={() => navigate('/signin')}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium shadow-lg"
                  title="Sign Up"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Sign Up</span>
                </button>
              </>
            )}
            {isLoggedIn() && userData && (
              <div 
                className="flex items-center gap-2 px-3 py-2 backdrop-blur-md rounded-lg shadow-lg"
                style={{ backgroundColor: 'rgba(179, 199, 223, 0.8)' }}
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  {userData.name ? userData.name.charAt(0).toUpperCase() : userData.email ? userData.email.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="text-gray-800 text-sm font-medium">
                  {userData.name || userData.email || 'User'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-blue-100 bg-opacity-40 backdrop-blur-md">
          <div className="max-w-4xl mx-auto space-y-6">
            {currentMessages.length === 0 ? (
              <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="text-center bg-blue-100 bg-opacity-60 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-blue-200">
                  <h2 className="text-gray-800 text-3xl font-bold mb-4 drop-shadow-lg">
                    Welcome, {userData?.name || userData?.username || 'User'}! 👋
                  </h2>
                  <p className="text-gray-700 text-lg mb-6 max-w-2xl mx-auto leading-relaxed">
                    I'm your AI Search Assistant, ready to help you find answers, learn new things, and explore the world of knowledge.
                  </p>
                  <p className="text-gray-600 text-sm">
                    Start by typing your question in the search box below or upload an image to get started!
                  </p>
                </div>
              </div>
            ) : (
              <>
                {currentMessages.map((message) => (
              <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-3xl px-4 py-3 rounded-2xl ${
                  message.type === 'user' ? 'bg-blue-600 text-white shadow-lg' :
                  message.type === 'error' ? 'bg-red-100 border border-red-300 text-red-800' :
                  'bg-white bg-opacity-95 backdrop-blur-sm text-gray-800 border border-gray-200 shadow-lg'
                }`}>
                  {message.image && (
                    <img src={message.image} alt="Uploaded" className="max-w-sm rounded-lg mb-3" />
                  )}
                  <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
                  <div className="text-xs mt-2 opacity-70">{message.timestamp}</div>
                </div>
              </div>
            ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white bg-opacity-95 backdrop-blur-sm border border-gray-200 shadow-lg px-4 py-3 rounded-2xl">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <span className="text-gray-700 ml-2">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </div>

        {/* Input */}
        <div 
          className="p-4 border-t backdrop-blur-md"
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
            borderTopColor: 'rgba(179, 199, 223, 0.3)'
          }}
        >
          <div className="max-w-4xl mx-auto">
            {imagePreview && (
              <div className="mb-4 relative inline-block">
                <img src={imagePreview} alt="Preview" className="max-h-32 rounded-lg border border-gray-300 shadow-lg" />
                <button onClick={removeImage} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="relative flex items-center bg-white bg-opacity-95 backdrop-blur-sm rounded-xl border border-gray-300 focus-within:border-blue-400 transition-colors shadow-lg">
              <Search className="w-5 h-5 text-gray-500 ml-4" />
              <textarea
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isLoggedIn() ? "Ask me anything... (Press Enter to send)" : "Please log in to use search..."}
                className="flex-1 bg-transparent text-gray-800 placeholder-gray-500 p-4 pl-3 pr-3 rounded-xl resize-none min-h-[50px] max-h-32 outline-none"
                rows={1}
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                disabled={!isLoggedIn()}
              />
              <div className="flex items-center space-x-2 pr-2">
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md" 
                  title="Upload Image"
                  disabled={!isLoggedIn()}
                >
                  <Image className="w-5 h-5" />
                </button>
                <button 
                  onClick={handleMicClick} 
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md ${
                    hasCompletedSetup() ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`} 
                  title={hasCompletedSetup() ? "Go to Voice Assistant" : "Set Up Voice Assistant"}
                  disabled={!isLoggedIn()}
                >
                  <Mic className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => handleSearch()} 
                  disabled={(!searchQuery.trim() && !uploadedImage) || isLoading || !isLoggedIn()} 
                  className="w-10 h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-lg flex items-center justify-center cursor-pointer text-white transition-all duration-300 disabled:cursor-not-allowed shadow-md" 
                  title="Send Message"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </div>
            {isVoiceActive && (
              <div className="flex items-center justify-center gap-2 mt-3 text-red-500">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Listening... Speak now</span>
                <Volume2 className="w-4 h-4" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
);
};

export default SearchPage;