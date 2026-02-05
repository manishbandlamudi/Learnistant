import React, { useState, useEffect, useContext, useRef } from 'react';
import { UserDataContext } from '../context/userContext.jsx';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Vapi from '@vapi-ai/web';
import { IoMdArrowRoundBack } from "react-icons/io";
import { FiUser, FiCpu, FiMic, FiMicOff, FiVolume2 } from "react-icons/fi";

const Home = () => {
  const { userData, serverUrl, setUserData } = useContext(UserDataContext);
  const navigate = useNavigate();

  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [vapi, setVapi] = useState(null);
  
  // Image selection state
  const [showImageSelection, setShowImageSelection] = useState(false);
  const [selectedImage, setSelectedImage] = useState('/boy.jpg'); // Default to boy image
  
  // Conversation state
  const [currentConversation, setCurrentConversation] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  
  const conversationEndRef = useRef(null);

  const VAPI_PUBLIC_KEY = import.meta.env.VITE_VAPI_PUBLIC_KEY;
  const VAPI_ASSISTANT_ID = import.meta.env.VITE_VAPI_ASSISTANT_ID;

  // Available images
  const availableImages = [
    { id: 'boy', src: '/boy.jpg', alt: 'Boy Assistant' },
    { id: 'girl', src: '/girl.jpg', alt: 'Girl Assistant' }
  ];

  // Handle image selection
  const handleImageSelect = (imageSrc) => {
    setSelectedImage(imageSrc);
    setShowImageSelection(false);
    
    // Update user data context
    const updatedUserData = {
      ...userData,
      assistantImage: imageSrc
    };
    setUserData(updatedUserData);
    
    // Optional: Save to backend
    // axios.post(`${serverUrl}/api/user/update-assistant-image`, {
    //   assistantImage: imageSrc
    // }, { withCredentials: true }).catch(err => console.error('Error saving image:', err));
  };

  // Initialize selected image from userData or default
  useEffect(() => {
    if (userData?.assistantImage) {
      setSelectedImage(userData.assistantImage);
    }
  }, [userData]);

  // Auto-scroll to bottom of conversation
  const scrollToBottom = () => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentConversation]);

  // Add message to current conversation
  const addMessageToConversation = (message, isUser = false, audioData = null) => {
    const newMessage = {
      id: Date.now() + Math.random(),
      text: message,
      isUser,
      timestamp: new Date().toLocaleTimeString(),
      audioData: audioData
    };
    
    setCurrentConversation(prev => [...prev, newMessage]);
  };

  // Start new conversation session
  const startNewSession = () => {
    const sessionId = Date.now().toString();
    console.log("Starting new session:", sessionId);
    setCurrentSessionId(sessionId);
    setCurrentConversation([]);
    setIsRecording(true);
  };

  // Calculate session duration
  const calculateSessionDuration = (startTime) => {
    const duration = Date.now() - startTime;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  // Handles assistant tool calls and directly opens links/apps
  const handleAssistantResponse = (message) => {
    console.log("Incoming Vapi message:", message);

    if (message.type === 'speech-update' && message.speech) {
      addMessageToConversation(message.speech, true);
    }

    if (message.type === 'transcript' && message.transcript) {
      addMessageToConversation(message.transcript, false);
    }

    if (message.type === 'function-call' || (message.toolCalls && message.toolCalls[0])) {
      const toolCall = message.toolCalls?.[0] || message;
      const { name: type, arguments: parameters } = toolCall.function || toolCall;
      const toolCallId = toolCall.id;

      let toolResult = { toolCallId, result: `Successfully executed ${type}.` };

      switch (type) {
        case 'google_search':
        case 'youtube_search': {
          const query = encodeURIComponent(parameters.query || "");
          if (!query) {
            toolResult.result = "No query provided";
            break;
          }
          const searchUrl =
            type === 'google_search'
              ? `https://www.google.com/search?q=${query}`
              : `https://www.youtube.com/results?search_query=${query}`;

          console.log("Opening search URL:", searchUrl);
          addMessageToConversation(`Opening ${type.replace('_', ' ')} for: ${parameters.query}`, false);

          const newTab = window.open(searchUrl, "_blank", "noopener,noreferrer");
          if (!newTab) console.warn("Popup blocked. Enable popups for this site.");
          break;
        }

        case 'open_app': {
          const appName = parameters.app_name?.toLowerCase();
          let appUrl = "";
          switch (appName) {
            case 'instagram': appUrl = 'https://www.instagram.com'; break;
            case 'facebook':  appUrl = 'https://www.facebook.com'; break;
            case 'youtube':   appUrl = 'https://www.youtube.com'; break;
            case 'twitter':   appUrl = 'https://www.twitter.com'; break;
            case 'linkedin':  appUrl = 'https://www.linkedin.com'; break;
            case 'github':    
            case 'git hub':   appUrl = 'https://github.com'; break;
            case 'whatsapp':  
            case 'whats app': appUrl = 'https://web.whatsapp.com/'; break;
            default:
              console.warn(`Unknown app: ${appName}`);
              toolResult.result = `Could not find an app named ${appName}.`;
          }
          if (appUrl) {
            console.log("Opening app URL:", appUrl);
            addMessageToConversation(`Opening ${appName}`, false);
            const newTab = window.open(appUrl, "_blank", "noopener,noreferrer");
            if (!newTab) console.warn("Popup blocked. Enable popups for this site.");
          }
          break;
        }

        default:
          console.log(`Unhandled function type: ${type}`);
          toolResult.result = `Function type ${type} not handled.`;
      }

      if (vapi) {
        vapi.send({ type: 'tool-call-result', ...toolResult });
      }
    }
  };

  useEffect(() => {
    if (!VAPI_PUBLIC_KEY) {
      console.error("Vapi Error: VITE_VAPI_PUBLIC_KEY is not defined in your .env file.");
      return;
    }

    const vapiInstance = new Vapi(VAPI_PUBLIC_KEY);
    setVapi(vapiInstance);

    // Event listeners
    const onCallStart = () => {
      console.log("Call started");
      setIsConnecting(false);
      setIsSessionActive(true);
      startNewSession();
      addMessageToConversation("Voice assistant started", false);
    };

    const onCallEnd = () => {
      console.log("Call ended");
      setIsConnecting(false);
      setIsSessionActive(false);
      setCurrentSessionId(null);
      setIsRecording(false);
      
      // Add end message
      setCurrentConversation(prevConversation => {
        const endMessage = {
          id: Date.now() + Math.random(),
          text: "Voice assistant ended",
          isUser: false,
          timestamp: new Date().toLocaleTimeString(),
          audioData: null
        };
        return [...prevConversation, endMessage];
      });
    };

    const onError = (e) => {
      console.error("Vapi Error:", e);
      setIsConnecting(false);
      setIsSessionActive(false);
      setIsRecording(false);
      addMessageToConversation("Error occurred in voice assistant", false);
    };

    // Attach event listeners
    vapiInstance.on('call-start', onCallStart);
    vapiInstance.on('call-end', onCallEnd);
    vapiInstance.on('error', onError);
    vapiInstance.on('message', handleAssistantResponse);

    return () => {
      // Clean up event listeners
      vapiInstance.off('call-start', onCallStart);
      vapiInstance.off('call-end', onCallEnd);
      vapiInstance.off('error', onError);
      vapiInstance.off('message', handleAssistantResponse);
      
      // Stop any active session
      if (vapiInstance) {
        try {
          vapiInstance.stop();
        } catch (err) {
          console.error("Error stopping vapi on cleanup:", err);
        }
      }
    };
  }, [VAPI_PUBLIC_KEY]);

  const toggleVapiSession = async () => {
    if (isConnecting) {
      console.log("Already connecting, ignoring click");
      return;
    }

    if (isSessionActive) {
      try {
        console.log("🔴 Stopping Vapi session...");
        setIsConnecting(true);
        
        if (vapi) {
          await vapi.stop();
        }
        
        setIsSessionActive(false);
        setIsRecording(false);
        setIsConnecting(false);
        
        console.log("Session stopped successfully");
      } catch (err) {
        console.error("Error stopping session:", err);
        setIsConnecting(false);
        setIsSessionActive(false);
        setIsRecording(false);
      }
    } else {
      if (!VAPI_ASSISTANT_ID) {
        console.error("Vapi Error: VITE_VAPI_ASSISTANT_ID is not defined in your .env file.");
        return;
      }
      
      try {
        console.log("🟢 Starting Vapi session...");
        setIsConnecting(true);
        
        if (vapi) {
          await vapi.start(VAPI_ASSISTANT_ID);
        }
      } catch (err) {
        console.error("Error starting session:", err);
        setIsConnecting(false);
      }
    }
  };

  const handleLogout = async () => {
    try {
      if (vapi && (isSessionActive || isConnecting)) {
        try {
          await vapi.stop();
        } catch (err) {
          console.error("Error stopping vapi during logout:", err);
        }
      }
      
      await axios.get(`${serverUrl}/api/auth/logout`, { withCredentials: true });
      setUserData(null);
      navigate("/signin");
    } catch (err) {
      setUserData(null);
      console.log(err);
    }
  };

  const handleBackToCustomize = async () => {
    if (vapi && (isSessionActive || isConnecting)) {
      try {
        await vapi.stop();
      } catch (err) {
        console.error("Error stopping vapi during navigation:", err);
      }
    }
    navigate("/customize");
  };

  const getButtonConfig = () => {
    if (isConnecting) {
      return { 
        text: isSessionActive ? 'Stopping...' : 'Connecting...', 
        className: 'bg-yellow-600 cursor-not-allowed', 
        icon: isSessionActive ? <FiMicOff /> : <FiMic /> 
      };
    } else if (isSessionActive) {
      return { text: 'Stop Assistant', className: 'bg-red-600 hover:bg-red-700', icon: <FiMicOff /> };
    } else {
      return { text: 'Start Voice Assistant', className: 'bg-blue-600 hover:bg-blue-700', icon: <FiMic /> };
    }
  };

  const buttonConfig = getButtonConfig();
  const assistantImage = selectedImage || '/boy.jpg'; // Use selected image or default
  const assistantName = userData?.assistantName || 'Your Assistant';
  const displayMessages = currentConversation;

  return (
    <div className='w-full h-screen bg-gradient-to-t from-[black] to-[#010131] flex flex-col'>
      <style>
        {`
          body::-webkit-scrollbar { display: none; }
          body { -ms-overflow-style: none; scrollbar-width: none; }
          html { overflow: hidden; }
          
          .chat-scroll::-webkit-scrollbar { width: 6px; }
          .chat-scroll::-webkit-scrollbar-track {
            background: rgba(55, 65, 81, 0.3);
            border-radius: 3px;
          }
          .chat-scroll::-webkit-scrollbar-thumb {
            background: rgba(156, 163, 175, 0.6);
            border-radius: 3px;
          }
          .chat-scroll::-webkit-scrollbar-thumb:hover {
            background: rgba(156, 163, 175, 0.8);
          }
          .chat-scroll {
            scrollbar-width: thin;
            scrollbar-color: rgba(156, 163, 175, 0.6) rgba(55, 65, 81, 0.3);
          }
        `}
      </style>

      {/* Header Bar */}
      <header className='w-full h-16 bg-black/30 backdrop-blur-sm border-b border-gray-800 flex items-center justify-between px-6 flex-shrink-0'>
        <h1 className='text-white text-xl font-semibold'>Learninstant</h1>
        
        <div className='flex items-center gap-3'>
          <button
            onClick={() => setShowImageSelection(true)}
            className='text-white hover:text-blue-300 transition-colors duration-200 px-3 py-1 rounded-lg border border-gray-600 hover:border-blue-400'
          >
            Change Avatar
          </button>
          <button
            onClick={handleBackToCustomize}
            className='text-white hover:text-blue-300 transition-colors duration-200 flex items-center gap-2'
          >
            <IoMdArrowRoundBack size={20} />
            <span className='hidden sm:inline'>Customize</span>
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg text-sm transition-all duration-300"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Image Selection Modal */}
      {showImageSelection && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
          <div className='bg-gradient-to-br from-[#010131] to-[black] p-8 rounded-3xl border border-gray-700 max-w-lg w-full mx-4'>
            <h2 className='text-white text-2xl font-bold text-center mb-8'>
              Select Your Assistant Image
            </h2>
            
            <div className='flex gap-6 justify-center mb-8'>
              {availableImages.map((image) => (
                <div
                  key={image.id}
                  onClick={() => handleImageSelect(image.src)}
                  className={`w-32 h-40 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 border-4 ${
                    selectedImage === image.src 
                      ? 'border-blue-500 scale-105 shadow-lg shadow-blue-500/30' 
                      : 'border-gray-600 hover:border-gray-400 hover:scale-102'
                  }`}
                >
                  <img 
                    src={image.src} 
                    alt={image.alt}
                    className='w-full h-full object-cover'
                  />
                </div>
              ))}
            </div>
            
            <div className='text-center'>
              <p className='text-gray-400 text-sm mb-4'>
                Selected: {selectedImage === '/boy.jpg' ? 'Boy Assistant' : 'Girl Assistant'}
              </p>
              <button
                onClick={() => setShowImageSelection(false)}
                className='px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200'
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className='flex-1 flex h-0'>
        
        {/* Left Side - Assistant */}
        <div className='w-1/2 flex flex-col items-center justify-center p-8 gap-6'>
          
          {/* Assistant Image */}
          <div className='w-[300px] h-[350px] flex justify-center items-center overflow-hidden rounded-3xl shadow-lg flex-shrink-0 relative'>
            <img 
              src={assistantImage} 
              alt="Assistant" 
              className='h-full w-full object-cover transition-all duration-500' 
              onError={(e) => { e.target.src = '/boy.jpg'; }}
            />
            {/* Click to change overlay */}
            <div 
              onClick={() => setShowImageSelection(true)}
              className='absolute inset-0 bg-black/0 hover:bg-black/20 transition-all duration-300 cursor-pointer flex items-center justify-center opacity-0 hover:opacity-100'
            >
              <span className='text-white text-sm font-medium bg-black/50 px-3 py-1 rounded-full'>
                Click to Change
              </span>
            </div>
          </div>
          
          <h2 className='text-white text-2xl font-bold text-center'>Your AI Assistant</h2>

          {/* Voice Assistant Button */}
          <button
            onClick={toggleVapiSession}
            disabled={isConnecting}
            className={`w-[220px] h-[60px] flex items-center justify-center gap-3 text-white font-semibold rounded-full text-[18px] cursor-pointer transition-all duration-300 flex-shrink-0 ${buttonConfig.className}`}
          >
            {buttonConfig.icon}
            {buttonConfig.text}
          </button>

          {isSessionActive && !isConnecting && (
            <div className="flex items-center gap-2 text-green-400">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Voice Assistant Active</span>
            </div>
          )}
        </div>

        {/* Right Side - Chat Interface */}
        <div className='w-1/2 h-full flex flex-col p-8'>
          <div className='bg-black/20 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-lg flex-1 flex flex-col min-h-0'>
            <div className='px-4 py-3 border-b border-gray-700/50 flex items-center justify-between flex-shrink-0'>
              <div className='flex items-center gap-2'>
                <FiVolume2 size={16} className='text-blue-400' />
                <h3 className='text-white text-sm font-medium'>
                  {isSessionActive ? 'Live Chat' : 'Chat'}
                </h3>
              </div>
              {isRecording && isSessionActive && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-red-400 text-xs">Live</span>
                </div>
              )}
            </div>
            
            <div className='flex-1 overflow-y-auto p-3 space-y-2 chat-scroll min-h-0'>
              {displayMessages.length === 0 ? (
                <div className='flex items-center justify-center h-full'>
                  <div className='text-center'>
                    <FiMic className='mx-auto mb-2 text-gray-500' size={20} />
                    <p className='text-gray-400 text-xs'>
                      {isSessionActive ? 'Voice messages will appear here' : 'No messages to display'}
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {displayMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-2 ${message.isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex gap-2 max-w-[85%] ${message.isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.isUser ? 'bg-blue-500' : 'bg-green-500'
                        }`}>
                          {message.isUser ? <FiUser size={10} /> : <FiCpu size={10} />}
                        </div>
                        <div className={`px-3 py-2 rounded-lg ${
                          message.isUser 
                            ? 'bg-blue-600 text-white rounded-br-sm' 
                            : 'bg-gray-600 text-white rounded-bl-sm'
                        }`}>
                          <p className='text-xs leading-relaxed'>{message.text}</p>
                          {message.timestamp && (
                            <p className='text-[10px] text-gray-300 mt-1 opacity-70'>{message.timestamp}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={conversationEndRef} />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;