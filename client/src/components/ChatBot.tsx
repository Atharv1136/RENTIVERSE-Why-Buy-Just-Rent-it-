import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send } from "lucide-react";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [messages, setMessages] = useState<Message[]>(() => {
    // Load messages from localStorage if available
    try {
      const saved = localStorage.getItem('rentiverse-chat-messages');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
      }
    } catch (error) {
      console.error('Error loading chat messages:', error);
    }
    
    return [
      {
        id: "1",
        text: "Hi! I'm here to help you with your rental needs. How can I assist you today?",
        isUser: false,
        timestamp: new Date(),
      },
    ];
  });
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => {
    // Get or create session ID
    let saved = localStorage.getItem('rentiverse-chat-session');
    if (!saved) {
      saved = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('rentiverse-chat-session', saved);
    }
    return saved;
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fallback response generator for when webhook is unavailable
  const generateFallbackResponse = (userMessage: string, history: Array<{role: string, content: string}>) => {
    const message = userMessage.toLowerCase();
    
    // Check if user is asking about Rentiverse
    if (message.includes('rentiverse') || message.includes('what is') || message.includes('about')) {
      return "Rentiverse is a comprehensive rental management platform that helps you rent equipment and products easily. You can browse our catalog, book items, make payments, and track your rentals all in one place. How can I help you get started?";
    }
    
    // Check for greetings
    if (message.includes('hi') || message.includes('hello') || message.includes('hey')) {
      return "Hello! Welcome to Rentiverse! I'm here to help you with your rental needs. You can ask me about our products, how to place orders, payment options, or any other questions about our rental services.";
    }
    
    // Check for product-related queries
    if (message.includes('product') || message.includes('rent') || message.includes('item')) {
      return "I can help you find the perfect rental items! We have various categories including electronics, furniture, tools, and more. You can browse our catalog, check availability, and book items directly through the platform. What type of items are you looking to rent?";
    }
    
    // Check for booking/order queries
    if (message.includes('book') || message.includes('order') || message.includes('reserve')) {
      return "Booking with Rentiverse is easy! You can browse products, select your rental period, add items to cart, and complete payment. You'll receive confirmation and can track your order status. Would you like me to guide you through the booking process?";
    }
    
    // Check for payment queries
    if (message.includes('payment') || message.includes('pay') || message.includes('cost')) {
      return "We offer secure payment options through Razorpay for your convenience. Pricing varies by item and rental duration. You can see exact costs in your cart before confirming. Need help with payment or pricing for specific items?";
    }
    
    // Default response that acknowledges the conversation
    const hasHistory = history.length > 1;
    if (hasHistory) {
      return "I understand you're asking about that. While I'm having trouble accessing my full knowledge right now, I'm here to help with Rentiverse rental services. Could you rephrase your question or ask about products, bookings, or payments?";
    }
    
    return "Thanks for reaching out! I'm the Rentiverse assistant and I'm here to help with your rental needs. You can ask me about our products, how to book items, payments, or any other questions about our rental platform. How can I assist you today?";
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    try {
      localStorage.setItem('rentiverse-chat-messages', JSON.stringify(messages));
    } catch (error) {
      console.error('Error saving chat messages:', error);
    }
  }, [messages]);

  // Auto-focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const currentMessage = inputMessage;
    const userMessage: Message = {
      id: Date.now().toString(),
      text: currentMessage,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Get conversation history for context (last 5 messages)
      const conversationHistory = messages
        .slice(-5)
        .map(msg => ({
          role: msg.isUser ? 'user' : 'assistant',
          content: msg.text
        }));

      console.log('Sending request to webhook:', {
        message: currentMessage,
        sessionId: sessionId,
        conversationHistory: conversationHistory
      });

      const response = await fetch(
        "https://snehachavan123.app.n8n.cloud/webhook/2e980536-fc2e-44ce-b9be-4c0ca4b57682",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: currentMessage,
            sessionId: sessionId,
            conversationHistory: conversationHistory,
            timestamp: new Date().toISOString(),
            source: "rentiverse-chat",
            context: {
              platform: "Rentiverse Rental Management",
              userType: "customer",
              features: ["product rental", "booking", "payment", "support"]
            }
          }),
        },
      );

      console.log('Webhook response status:', response.status);

      let botResponse =
        "Sorry, I'm having trouble connecting right now. Please try again later.";

      if (response.ok) {
        const data = await response.json();
        console.log('Webhook response data:', data);
        botResponse =
          data.response ||
          data.message ||
          data.reply ||
          data.answer ||
          data.text ||
          "Thank you for your message! How else can I help you with your rental needs?";
      } else {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error("API response error:", response.status, response.statusText, errorText);
        
        // Provide contextual fallback responses based on conversation history
        botResponse = generateFallbackResponse(currentMessage, conversationHistory);
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      
      // Generate fallback response even on network errors
      const conversationHistory = messages
        .slice(-5)
        .map(msg => ({
          role: msg.isUser ? 'user' : 'assistant',
          content: msg.text
        }));
      
      const fallbackResponse = generateFallbackResponse(currentMessage, conversationHistory);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: fallbackResponse,
        isUser: false,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-renti-teal hover:bg-renti-teal/90 shadow-lg"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 z-50 w-80 h-[500px] flex flex-col shadow-2xl border-2">
          <CardHeader className="bg-renti-teal text-white p-4 flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Rentiverse Assistant</CardTitle>
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setMessages([
                    {
                      id: "1",
                      text: "Hi! I'm here to help you with your rental needs. How can I assist you today?",
                      isUser: false,
                      timestamp: new Date(),
                    },
                  ]);
                  localStorage.removeItem('rentiverse-chat-messages');
                  const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                  localStorage.setItem('rentiverse-chat-session', newSessionId);
                }}
                className="text-white hover:bg-white/20 h-8 w-8"
                title="Clear Chat"
              >
                <span className="text-xs">🗑️</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.isUser
                        ? "bg-renti-teal text-white"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    <p className="text-sm">{message.text}</p>
                    <p className="text-xs opacity-75 mt-1">
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}



              <div ref={messagesEndRef} />
            </div>

            {/* Input Area - Always visible and fixed at bottom */}
            <div className="border-t p-3 bg-white flex-shrink-0">
              <div className="flex space-x-2 mb-2">
                <Input
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={isLoading}
                  className="flex-1 text-sm"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  size="sm"
                  className="bg-renti-teal hover:bg-renti-teal/90 px-3"
                >
                  <Send className="h-3 w-3" />
                </Button>
              </div>
              {isLoading && (
                <div className="text-xs text-gray-500 flex items-center">
                  <div className="flex space-x-1 mr-2">
                    <div className="w-1 h-1 bg-renti-teal rounded-full animate-bounce"></div>
                    <div className="w-1 h-1 bg-renti-teal rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                    <div className="w-1 h-1 bg-renti-teal rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  </div>
                  Assistant is typing...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
