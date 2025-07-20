import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';

// Hook to detect keyboard visibility on mobile
const useKeyboardDetection = () => {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      // Only apply keyboard detection on mobile devices
      if (window.innerWidth <= 768) {
        const currentHeight = window.innerHeight;
        const screenHeight = window.screen.height;
        
        // Calculate if keyboard is likely visible
        // Keyboard is considered visible if viewport height is significantly reduced
        const heightDifference = screenHeight - currentHeight;
        const isKeyboardOpen = heightDifference > 150; // Threshold for keyboard detection
        
        setIsKeyboardVisible(isKeyboardOpen);
        setKeyboardHeight(isKeyboardOpen ? heightDifference : 0);
      } else {
        setIsKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    };

    // Initial check
    handleResize();

    // Listen for viewport changes
    window.addEventListener('resize', handleResize);
    
    // Also listen for visual viewport changes (more accurate for mobile keyboards)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  return { isKeyboardVisible, keyboardHeight };
};

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface ChatWidgetProps {
  isVisible?: boolean;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ isVisible = true }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const lastAIMessageRef = useRef<HTMLDivElement>(null);
  const { isKeyboardVisible, keyboardHeight } = useKeyboardDetection();


  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  const scrollToLastAIMessage = () => {
    if (lastAIMessageRef.current && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const lastAIMessage = lastAIMessageRef.current;
      
      // Calculate the position to scroll to the top of the last AI message
      const scrollTop = lastAIMessage.offsetTop - container.offsetTop;
      
      container.scrollTop = scrollTop;
    }
  };
  useEffect(() => {
    // Scroll to bottom for user messages or when loading
    // For AI responses, scroll to show the top of the AI's message
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'user' || isLoading) {
        scrollToBottom();
      } else if (lastMessage.role === 'assistant') {
        // Small delay to ensure message is rendered, then scroll to AI message
        setTimeout(() => {
          scrollToLastAIMessage();
        }, 100);
      }
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen && !hasGreeted) {
      // Add greeting message when chat opens for the first time
      const greetingMessage: Message = {
        id: Date.now().toString(),
        content: "👋 Hi there! I'm your AI assistant for Inspire E-Commerce Solutions. I can help you with questions about our fulfillment services, pricing, warehousing options, or anything you see in our quote builder. What would you like to know?",
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages([greetingMessage]);
      setHasGreeted(true);
    }
  }, [isOpen, hasGreeted]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const createThread = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.openai.com/v1/threads', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to create thread: ${response.statusText}`);
      }

      const data = await response.json();
      return data.id;
    } catch (error) {
      console.error('Error creating thread:', error);
      throw error;
    }
  };

  const addMessageToThread = async (threadId: string, message: string): Promise<void> => {
    try {
      const response = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        },
        body: JSON.stringify({
          role: 'user',
          content: message
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to add message: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error adding message to thread:', error);
      throw error;
    }
  };

  const runAssistant = async (threadId: string): Promise<string> => {
    try {
      // Create a run
      const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
          'OpenAI-Beta': 'assistants=v2'
        },
        body: JSON.stringify({
          assistant_id: 'asst_im1FzfzvyezWJY0ekuFnB0NV'
        })
      });

      if (!runResponse.ok) {
        throw new Error(`Failed to create run: ${runResponse.statusText}`);
      }

      const runData = await runResponse.json();
      const runId = runData.id;

      // Poll for completion
      let runStatus = 'queued';
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds timeout

      while (runStatus !== 'completed' && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        
        const statusResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
            'OpenAI-Beta': 'assistants=v2'
          }
        });

        if (!statusResponse.ok) {
          throw new Error(`Failed to check run status: ${statusResponse.statusText}`);
        }

        const statusData = await statusResponse.json();
        runStatus = statusData.status;
        attempts++;

        if (runStatus === 'failed' || runStatus === 'cancelled' || runStatus === 'expired') {
          throw new Error(`Run failed with status: ${runStatus}`);
        }
      }

      if (runStatus !== 'completed') {
        throw new Error('Run timed out');
      }

      // Get the messages
      const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      });

      if (!messagesResponse.ok) {
        throw new Error(`Failed to get messages: ${messagesResponse.statusText}`);
      }

      const messagesData = await messagesResponse.json();
      const assistantMessages = messagesData.data.filter((msg: any) => msg.role === 'assistant');
      
      if (assistantMessages.length === 0) {
        throw new Error('No assistant response found');
      }

      // Get the latest assistant message
      const latestMessage = assistantMessages[0];
      const content = latestMessage.content[0];
      
      if (content.type === 'text') {
        return content.text.value;
      } else {
        throw new Error('Unexpected message content type');
      }
    } catch (error) {
      console.error('Error running assistant:', error);
      throw error;
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Check if we have an API key
      if (!import.meta.env.VITE_OPENAI_API_KEY) {
        throw new Error('OpenAI API key not configured. Please add your API key to the environment variables.');
      }

      // Validate assistant ID
      if (!import.meta.env.VITE_OPENAI_ASSISTANT_ID) {
        throw new Error('OpenAI Assistant ID not configured');
      }

      // Create thread if we don't have one
      let currentThreadId = threadId;
      if (!currentThreadId) {
        currentThreadId = await createThread();
        setThreadId(currentThreadId);
      }

      // Add message to thread
      await addMessageToThread(currentThreadId, userMessage.content);

      // Run assistant and get response
      const response = await runAssistant(currentThreadId);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Provide helpful error message based on the error type
      let errorContent = "I apologize for the inconvenience. ";
      
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          errorContent += "I'm currently being configured. Please contact our support team at support@inspiresolutions.asia for immediate assistance with your questions.";
        } else if (error.message.includes('Failed to fetch') || error.message.includes('network')) {
          errorContent += "I'm having trouble connecting right now. Please check your internet connection and try again, or contact support@inspiresolutions.asia.";
        } else if (error.message.includes('quota') || error.message.includes('rate limit')) {
          errorContent += "I'm experiencing high demand right now. Please try again in a moment or contact support@inspiresolutions.asia for immediate assistance.";
        } else {
          errorContent += "I'm experiencing technical difficulties. Please try again in a moment or contact our support team at support@inspiresolutions.asia for immediate assistance.";
        }
      } else {
        errorContent += "Something unexpected happened. Please try again or contact our support team at support@inspiresolutions.asia for immediate assistance.";
      }

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: errorContent,
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!isVisible) return null;

  // Calculate dynamic positioning based on keyboard visibility
  const getWidgetStyle = () => {
    if (isKeyboardVisible && window.innerWidth <= 768) {
      // On mobile with keyboard visible, position the widget above the keyboard
      const adjustedBottom = Math.max(keyboardHeight - 80, 20); // Ensure minimum 20px from bottom
      return {
        bottom: `${adjustedBottom}px`,
        transition: 'bottom 0.3s ease-in-out',
      };
    }
    
    // Default positioning
    return {
      bottom: '80px', // Moved up to avoid blocking footer text
      transition: 'bottom 0.3s ease-in-out',
    };
  };

  // Calculate chat window height based on keyboard visibility
  const getChatWindowStyle = () => {
    if (isKeyboardVisible && window.innerWidth <= 768) {
      // Reduce height when keyboard is visible to ensure it fits
      const availableHeight = window.innerHeight - keyboardHeight - 40; // 40px margin
      const maxHeight = Math.min(384, availableHeight); // 384px is default height (h-96)
      return {
        height: `${maxHeight}px`,
        maxHeight: `${maxHeight}px`,
      };
    }
    
    return {
      height: '384px', // h-96 equivalent
    };
  };

  return (
    <>
      {/* Chat Widget Button - Clean Circle Design */}
      {!isOpen && (
        <div 
          className="fixed right-6 z-50" 
          style={getWidgetStyle()}
        >
          <button
            onClick={() => setIsOpen(true)}
            className="relative w-11 h-11 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transform transition-all duration-300 hover:scale-110 group shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #1e3a8a 0%, #0d9488 50%, #06b6d4 100%)',
              boxShadow: '0 8px 32px rgba(30, 58, 138, 0.4), 0 4px 16px rgba(13, 148, 136, 0.3)',
            }}
          >
            {/* Animated pulse ring */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 opacity-75 animate-ping"></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 opacity-50 animate-pulse"></div>
            
            {/* Main icon */}
            <MessageCircle className="text-white z-10 relative" size={window.innerWidth <= 640 ? 18 : 24} />
            
            {/* Sparkle notification */}
            <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-bounce shadow-lg">
              <Sparkles className="text-white" size={window.innerWidth <= 640 ? 10 : 12} />
            </div>
            
            {/* Hover tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none">
              <span className="hidden sm:inline">Ask me anything about our services!</span>
              <span className="sm:hidden">Ask me anything!</span>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
            </div>
          </button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div 
          className="fixed right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-slide-up"
          style={{
            ...getWidgetStyle(),
            ...getChatWindowStyle(),
          }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-cyan-400 p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Bot className="text-white" size={20} />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">AI Assistant</h3>
                <p className="text-blue-100 text-xs">Inspire E-Commerce Solutions</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div 
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white chat-messages"
            style={{
              // Ensure messages area takes remaining space
              minHeight: '200px',
            }}
          >
            {messages.map((message) => (
              <div
                key={message.id}
                ref={message.role === 'assistant' ? lastAIMessageRef : null}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start space-x-2 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.role === 'user' 
                      ? 'bg-gradient-to-r from-blue-900 to-blue-700' 
                      : 'bg-gradient-to-r from-cyan-400 to-blue-600'
                  }`}>
                    {message.role === 'user' ? (
                      <User className="text-white" size={14} />
                    ) : (
                      <Bot className="text-white" size={14} />
                    )}
                  </div>
                  <div className={`rounded-2xl px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-blue-900 to-blue-700 text-white'
                      : 'bg-white border border-gray-200 text-gray-800 shadow-sm'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-start space-x-2 max-w-[80%]">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-r from-cyan-400 to-blue-600">
                    <Bot className="text-white" size={14} />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl px-4 py-2 shadow-sm">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="text-cyan-400 animate-spin" size={16} />
                      <p className="text-sm text-gray-600">Thinking...</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
            <div className="flex items-center space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-sm resize-none"
                disabled={isLoading}
                style={{
                  // Prevent zoom on iOS when focusing input
                  fontSize: window.innerWidth <= 768 ? '16px' : '14px',
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="w-10 h-10 bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-full flex items-center justify-center hover:from-blue-800 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
              >
                <Send size={16} />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Powered by AI • Ask about pricing, services, or SLA
            </p>
          </div>
        </div>
      )}
    </>
  );
};
