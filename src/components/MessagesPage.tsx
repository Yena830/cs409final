import React, { useState, useRef, useEffect } from "react";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Send, Search, Smile, Paperclip, ArrowLeft, MoreVertical, Phone, Video, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Trash2 } from "lucide-react";
import { api } from "../lib/api";
import { useUser } from "../hooks/useUser";
import io, { Socket } from "socket.io-client";

interface MessagesPageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
  selectedUserId?: string; 
}

interface User {
  _id: string;
  name: string;
  profilePhoto?: string;
}

interface Message {
  _id: string;
  sender: User;
  recipient: User;
  content: string;
  timestamp: string;
  read: boolean;
}

interface Conversation {
  _id: string;
  name: string;
  avatar: string;
  initials: string;
  lastMessage: string;
  time: string;
  hasUnread: boolean;
  online: boolean;
  messages: Message[];
  participantId: string;
  timestamp: string;
}

export function MessagesPage({ onNavigate, selectedUserId }: MessagesPageProps) {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isConversationListCollapsed, setIsConversationListCollapsed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const socketRef = useRef<Socket | null>(null);
  
  const emojis = ["😊", "❤️", "👍", "🐕", "🐱", "🎉", "✨", "🙏", "😂", "🤗", "🌟", "🐾"];

  // Fetch conversation list
  const loadConversations = async () => {
    if (!user) return [];
    
    try {
      // Fetch real conversation list from API
      const response = await api.getUserConversations();
      let userConversations: Conversation[] = [];
      
      if (response.success && response.data) {
        // Convert API response to Conversation format
        const rawConversations = response.data;
        userConversations = [];
        
        // Get detailed information for each conversation participant
        for (const conv of rawConversations) {
          // Skip self
          if (conv.participantId === user._id) {
            continue;
          }
          
          let userName = "Unknown User";
          let userAvatar = "";
          let userInitials = "UU";
          
          try {
            const userResponse = await api.getUserDetails(conv.participantId);
            if (userResponse.success && userResponse.data) {
              userName = userResponse.data.name;
              userAvatar = userResponse.data.profilePhoto || "";
              userInitials = userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            }
          } catch (error) {
            console.error("Failed to get user details:", error);
          }
          
          // Check if we already have a conversation with this participant
          const existingIndex = userConversations.findIndex(c => c.participantId === conv.participantId);
          if (existingIndex >= 0) {
            // Update existing conversation if this one is newer
            if (new Date(conv.timestamp).getTime() > new Date(userConversations[existingIndex].timestamp).getTime()) {
              userConversations[existingIndex] = {
                _id: conv.participantId,
                name: userName,
                avatar: userAvatar,
                initials: userInitials,
                lastMessage: conv.lastMessage,
                time: new Date(conv.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                hasUnread: conv.hasUnread,
                online: false,
                messages: [],
                participantId: conv.participantId,
                timestamp: conv.timestamp
              };
            }
          } else {
            // Add new conversation
            userConversations.push({
              _id: conv.participantId,
              name: userName,
              avatar: userAvatar,
              initials: userInitials,
              lastMessage: conv.lastMessage,
              time: new Date(conv.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              hasUnread: conv.hasUnread,
              online: false,
              messages: [],
              participantId: conv.participantId,
              timestamp: conv.timestamp
            });
          }
        }
      }
      
      // Ensure user with selectedUserId is in conversation list
      if (selectedUserId && selectedUserId !== user._id) {
        // Check if conversation with this user already exists
        const existingConversation = userConversations.find(conv => conv.participantId === selectedUserId);
        if (!existingConversation) {
          // Also check if we already have a conversation with this _id
          const existingById = userConversations.find(conv => conv._id === selectedUserId);
          if (!existingById) {
            // Get user info from API
            let userName = "Selected Helper";
            let userAvatar = "";
            let userInitials = "SH";
            
            try {
              const response = await api.getUserDetails(selectedUserId);
              if (response.success && response.data) {
                userName = response.data.name;
                userAvatar = response.data.profilePhoto || "";
                userInitials = userName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
              }
            } catch (error) {
              console.error("Failed to get user details:", error);
            }
            
            // Check one more time if conversation already exists after API call
            const finalCheck = userConversations.find(conv => conv.participantId === selectedUserId);
            if (!finalCheck) {
              const newConversation: Conversation = {
                _id: "selected",
                name: userName,
                avatar: userAvatar,
                initials: userInitials,
                lastMessage: "",
                time: "Just now",
                hasUnread: false,
                online: true,
                messages: [],
                participantId: selectedUserId,
                timestamp: new Date().toISOString()
              };
              
              // Add new conversation to the beginning of the list
              userConversations = [newConversation, ...userConversations];
            }
          }
        }
      }
      
      setConversations(userConversations);
      return userConversations;
    } catch (error) {
      console.error("Failed to load conversation list:", error);
      // Show empty list on error
      setConversations([]);
      return [];
    }
  };

  // Initialize WebSocket connection
  useEffect(() => {
    if (user) {
      // Connect to WebSocket server
      let serverUrl;
      const viteApiUrl = (import.meta as any).env.VITE_API_URL;
      if (viteApiUrl) {
        // Use VITE_API_URL if available (for production)
        // Convert HTTP/HTTPS URL to WS/WSS URL
        if (viteApiUrl.startsWith('https://')) {
          serverUrl = viteApiUrl.replace(/^https/, 'wss').replace('/api', '');
        } else if (viteApiUrl.startsWith('http://')) {
          serverUrl = viteApiUrl.replace(/^http/, 'ws').replace('/api', '');
        } else {
          serverUrl = viteApiUrl.replace('/api', '');
        }
      } else {
        // Fallback to localhost for development
        serverUrl = 'ws://localhost:3001';
      }
      
      console.log("Connecting to WebSocket server:", serverUrl);
      
      socketRef.current = io(serverUrl, {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
      
      // Log connection events
      socketRef.current.on("connect", () => {
        console.log("WebSocket connected with ID:", socketRef.current?.id);
        // Join room after connection is established
        setTimeout(() => {
          if (user._id && socketRef.current?.connected) {
            socketRef.current?.emit("join_room", user._id);
            console.log("Joined room with user ID:", user._id);
          }
        }, 100);
      });
      
      socketRef.current.on("connect_error", (error) => {
        console.error("WebSocket connection error:", error);
        console.error("Connection error details:", {
          serverUrl,
          transports: ["websocket", "polling"],
          reconnection: true
        });
      });
      
      socketRef.current.on("disconnect", (reason) => {
        console.log("WebSocket disconnected:", reason);
      });
      
      // Listen for receive message
      socketRef.current.on("receive_message", (message: Message) => {
        console.log("Received message via WebSocket:", message);
        // Ensure message is not from user self
        if (message.sender._id === user._id) {
          console.log("Ignoring message from self");
          return;
        }
        
        // Update conversation list with new message
        setConversations(prev => {
          // Create a copy of the previous conversations
          const updatedConversations = [...prev];
          
          // Find existing conversation with this sender
          const existingConvIndex = updatedConversations.findIndex(
            conv => conv.participantId === message.sender._id
          );
          
          if (existingConvIndex !== -1) {
            // Update existing conversation
            updatedConversations[existingConvIndex] = {
              ...updatedConversations[existingConvIndex],
              lastMessage: message.content,
              time: new Date(message.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              }),
              timestamp: message.timestamp,
              hasUnread: selectedConversation?.participantId !== message.sender._id
            };
          } else {
            // Create new conversation if it doesn't exist
            updatedConversations.unshift({
              _id: message.sender._id,
              name: message.sender.name || "Unknown User",
              avatar: message.sender.profilePhoto || "",
              initials: message.sender.name 
                ? message.sender.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() 
                : "UU",
              lastMessage: message.content,
              time: new Date(message.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              }),
              hasUnread: true,
              online: false,
              messages: [],
              participantId: message.sender._id,
              timestamp: message.timestamp
            });
          }
          
          // Sort conversations by timestamp (newest first)
          return updatedConversations.sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
        });
        
        // If currently viewing this conversation, add message to chat
        if (selectedConversation && selectedConversation.participantId === message.sender._id) {
          setSelectedConversation(prev => {
            if (prev) {
              return {
                ...prev,
                messages: [...prev.messages, message]
              };
            }
            return prev;
          });
          
          // Mark as read since we're viewing the conversation
          setConversations(prev => prev.map(conv => 
            conv.participantId === message.sender._id 
              ? { ...conv, hasUnread: false } 
              : conv
          ));
        }
        
        // Scroll to bottom of messages
        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
          }
        }, 100);
      });
      
      // Listen for message sent confirmation
      socketRef.current.on("message_sent", (message: Message) => {
        console.log("Message sent confirmation received:", message);
        
        // Update the conversation in the list
        setConversations(prev => {
          const updatedConversations = [...prev];
          const convIndex = updatedConversations.findIndex(
            conv => conv.participantId === message.recipient._id
          );
          
          if (convIndex !== -1) {
            updatedConversations[convIndex] = {
              ...updatedConversations[convIndex],
              lastMessage: message.content,
              time: new Date(message.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              }),
              timestamp: message.timestamp
            };
          }
          
          // Sort conversations by timestamp (newest first)
          return updatedConversations.sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
        });
        
        // If currently viewing this conversation, add message to chat
        if (selectedConversation && selectedConversation.participantId === message.recipient._id) {
          setSelectedConversation(prev => {
            if (prev) {
              return {
                ...prev,
                messages: [...prev.messages, message]
              };
            }
            return prev;
          });
        }
        
        // Scroll to bottom of messages
        setTimeout(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
          }
        }, 100);
      });
      
      // Cleanup function
      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    }
  }, [user?._id, selectedConversation]);

  // Load user conversation list
  useEffect(() => {
    let isMounted = true;
    
    loadConversations().then(async (loadedConversations) => {
      if (!isMounted) return;
      
      // If there is selectedUserId, automatically select the corresponding conversation
      if (selectedUserId && loadedConversations.length > 0) {
        // Find the corresponding conversation
        const conversation = loadedConversations.find(conv => conv.participantId === selectedUserId);
        if (conversation) {
          setSelectedChat(conversation._id);
        } else {
          // Also check by _id in case it's the "selected" conversation
          const conversationById = loadedConversations.find(conv => conv._id === selectedUserId || conv.participantId === selectedUserId);
          if (conversationById) {
            setSelectedChat(conversationById._id);
          } else {
            // If not found, may be because of newly added conversation, use "selected" as ID
            setSelectedChat("selected");
          }
        }
      } else if (loadedConversations.length > 0) {
        // If no selectedUserId but have conversation list, select the first conversation
        setSelectedChat(loadedConversations[0]._id);
      }
    });
    
    return () => {
      isMounted = false;
    };
  }, [user, selectedUserId]);

  // Mark conversation as read when selectedChat changes
  useEffect(() => {
    if (!selectedChat || !user) return;
    
    const markAsRead = async () => {
      // Use a small delay to ensure conversations state is updated
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Get the current conversations state directly from state
      const currentConversations = [...conversations];
      const conversation = currentConversations.find(c => c._id === selectedChat);
      
      if (conversation) {
        // Mark as read locally
        setConversations(prev => prev.map(conv => 
          conv._id === selectedChat ? { ...conv, hasUnread: false } : conv
        ));
        
        // Notify server to mark messages as read
        try {
          await api.markConversationAsRead(conversation.participantId);
        } catch (error) {
          console.error("Failed to mark conversation as read on server:", error);
        }
      }
    };
    
    markAsRead();
  }, [selectedChat, user?._id]);

  // Load messages for the selected conversation
  useEffect(() => {
    if (!selectedChat || !user) {
      setSelectedConversation(null);
      return;
    }
    
    let isMounted = true;
    
    const loadMessages = async () => {
      // Use a small delay to ensure conversations state is updated
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Get the current conversations state directly from state
      const currentConversations = [...conversations];
      const conversation = currentConversations.find(c => c._id === selectedChat);
      
      if (!conversation || !isMounted) return;
      
      try {
        // Fetch real message history from API
        const response = await api.getConversation(conversation.participantId);
        if (response.success && response.data && isMounted) {
          // Only update state if the currently selected chat is still this conversation
          if (selectedChat === conversation._id) {
            setSelectedConversation({
              ...conversation,
              messages: response.data
            });
            
            // Mark as read locally
            setConversations(prev => prev.map(conv => 
              conv._id === selectedChat ? { ...conv, hasUnread: false } : conv
            ));
            
            // Notify server to mark messages as read
            try {
              await api.markConversationAsRead(conversation.participantId);
            } catch (error) {
              console.error("Failed to mark conversation as read on server:", error);
            }
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error("Failed to load messages:", error);
        }
      }
    };
    
    loadMessages();
    
    return () => {
      isMounted = false;
    };
  }, [selectedChat, user?._id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedConversation?.messages]);

  const handleSendMessage = async () => {
    if (message.trim() && user && selectedConversation) {
      try {
        // Prepare message data
        const messageData = {
          sender: user._id,
          recipient: selectedConversation.participantId,
          content: message.trim(),
          timestamp: new Date().toISOString(),
          read: false
        };
        
        // Send message through WebSocket for real-time delivery
        if (socketRef.current && socketRef.current.connected) {
          // Emit message through WebSocket
          socketRef.current.emit('send_message', messageData);
          
          // Update local UI immediately for better UX
          const newMessage: Message = {
            _id: `temp_${Date.now()}`,
            ...messageData,
            sender: {
              _id: user._id,
              name: user.name || "You",
              profilePhoto: user.profilePhoto || ""
            },
            recipient: {
              _id: selectedConversation.participantId,
              name: selectedConversation.name,
              profilePhoto: selectedConversation.avatar || ""
            }
          };
          
          // Update conversation messages
          setSelectedConversation(prev => {
            if (prev) {
              return {
                ...prev,
                messages: [...prev.messages, newMessage],
                lastMessage: newMessage.content,
                time: new Date(newMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                timestamp: newMessage.timestamp
              };
            }
            return prev;
          });
          
          // Update conversation list
          setConversations(prev => prev.map(conv => 
            conv.participantId === selectedConversation.participantId ? { 
              ...conv, 
              lastMessage: newMessage.content,
              time: new Date(newMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              timestamp: newMessage.timestamp
            } : conv
          ));
          
          // Clear input field
          setMessage("");
        } else {
          // Fallback to API if WebSocket is not connected
          console.warn("WebSocket not connected, falling back to API");
          const response = await api.sendMessage(selectedConversation.participantId, message);
          if (response.success && response.data) {
            const newMessage: Message = {
              ...response.data,
              read: false
            };
            
            // Update local UI
            setSelectedConversation(prev => {
              if (prev) {
                return {
                  ...prev,
                  messages: [...prev.messages, newMessage],
                  lastMessage: newMessage.content,
                  time: new Date(newMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  timestamp: newMessage.timestamp
                };
              }
              return prev;
            });
            
            // Update conversation list
            setConversations(prev => prev.map(conv => 
              conv._id === selectedConversation._id ? { 
                ...conv, 
                lastMessage: newMessage.content,
                time: new Date(newMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                timestamp: newMessage.timestamp
              } : conv
            ));
            
            setMessage("");
          }
        }
      } catch (error) {
        console.error("Failed to send message:", error);
      }
    }
  };

  const filteredConversations = (() => {
    // Remove duplicates by participantId
    const uniqueConversations = conversations.reduce((acc, current) => {
      const existing = acc.find(item => item.participantId === current.participantId);
      if (!existing) {
        return acc.concat([current]);
      } else {
        // If duplicate found, keep the one with newer timestamp
        if (new Date(current.timestamp).getTime() > new Date(existing.timestamp).getTime()) {
          return acc.map(item => item.participantId === current.participantId ? current : item);
        }
        return acc;
      }
    }, [] as Conversation[]);
    
    return uniqueConversations
      .filter((conv) =>
        conv.name.toLowerCase().includes(searchQuery.toLowerCase()) && conv.participantId !== user?._id
      )
      .sort((a, b) => {
        // Sort by timestamp in descending order (newest first)
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
  })();

  const handleDeleteConversation = async (participantId: string) => {
    if (!user) return;
    
    try {
      // Confirm delete operation
      if (!window.confirm("Are you sure you want to delete this conversation record? This action cannot be undone.")) {
        return;
      }
      
      // Call API to delete conversation
      const response = await api.deleteConversation(participantId);
      
      if (response.success) {
        // Remove conversation from list
        setConversations(prev => prev.filter(conv => conv.participantId !== participantId));
        
        // If current selected conversation is deleted, clear selected state
        if (selectedConversation && selectedConversation.participantId === participantId) {
          setSelectedConversation(null);
          setSelectedChat(null);
        }
        
        console.log("Conversation record deleted successfully");
      } else {
        console.error("Failed to delete conversation record:", response.message);
      }
    } catch (error) {
      console.error("Failed to delete conversation record:", error);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-24 px-4">
      <div className="max-w-[1200px] mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              // Prefer to go back if possible, otherwise default to tasks
              if (window.history.length > 1) {
                window.history.back();
              } else {
                onNavigate("tasks");
              }
            }}
            className="hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-primary" style={{ fontWeight: 700, fontSize: '40px' }}>Messages</h1>
        </div>
        <Card className="border-0 shadow-lg overflow-hidden">
          <div className="flex h-[calc(100vh-200px)] max-h-[700px]">
            {/* Conversations List */}
            <div className={`bg-gradient-to-b from-secondary/20 to-white transition-all duration-300 ease-in-out flex-shrink-0 flex-col ${
              selectedChat !== null ? 'hidden md:flex' : 'flex'
            } ${isConversationListCollapsed ? 'md:w-0 md:border-r-0' : 'md:w-[380px] md:border-r'} border-border overflow-hidden`}>
              <div className={`p-4 border-b border-border bg-white flex-shrink-0 transition-opacity duration-300 ${isConversationListCollapsed ? 'md:opacity-0' : 'md:opacity-100'}`}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-secondary/30 border-0 focus-visible:ring-primary/20"
                  />
                </div>
              </div>
              
              <div className={`overflow-y-auto flex-1 transition-opacity duration-300 ${isConversationListCollapsed ? 'md:opacity-0' : 'md:opacity-100'}`}>
                {filteredConversations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                    <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mb-3">
                      <Search className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-primary mb-2" style={{ fontWeight: 600, fontSize: '20px' }}>
                      No conversations yet
                    </h3>
                    <p className="text-muted-foreground">
                      {selectedUserId 
                        ? "Start a conversation by sending a message" 
                        : "Your conversations will appear here"}
                    </p>
                  </div>
                ) : (
                  filteredConversations.map((conv) => (
                    <div
                      key={conv.participantId}
                      onClick={() => {
                        setSelectedChat(conv._id);
                      }}
                      className={`p-4 border-b border-border/50 cursor-pointer transition-all duration-200 ${
                        selectedChat === conv._id 
                          ? 'bg-primary/10 border-l-4 border-l-primary' 
                          : 'hover:bg-secondary/30 border-l-4 border-l-transparent'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          <Avatar className="w-12 h-12 border-2 border-white shadow-sm">
                            <AvatarImage src={conv.avatar} alt={conv.name} />
                            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-white">
                              {conv.initials}
                            </AvatarFallback>
                          </Avatar>
                          {conv.online && (
                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-primary rounded-full border-2 border-white shadow-sm" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="truncate" style={{ fontWeight: 600 }}>{conv.name}</h4>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-muted-foreground shrink-0">
                                {conv.time}
                              </span>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem 
                                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                    onClick={(e: React.MouseEvent) => {
                                      e.stopPropagation();
                                      handleDeleteConversation(conv.participantId);
                                    }}
                                  >
                                    Delete conversation record
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground truncate">
                              {conv.lastMessage}
                            </p>
                            {conv.hasUnread && (
                              <span className="bg-primary text-white text-xs rounded-full w-2 h-2 flex items-center justify-center flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {/* Chat Area */}
            <div className={`flex flex-col bg-white flex-1 min-w-0 ${selectedChat === null ? 'hidden md:flex' : 'flex'}`}>
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b border-border bg-gradient-to-r from-white to-secondary/10 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => setSelectedChat(null)}
                        className="md:hidden text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsConversationListCollapsed(!isConversationListCollapsed)}
                        className="hidden md:flex hover:bg-primary/10 hover:text-primary transition-colors flex-shrink-0"
                        title={isConversationListCollapsed ? "Show conversations" : "Hide conversations"}
                      >
                        {isConversationListCollapsed ? (
                          <PanelLeftOpen className="w-5 h-5" />
                        ) : (
                          <PanelLeftClose className="w-5 h-5" />
                        )}
                      </Button>
                      <Avatar className="w-10 h-10 border-2 border-white shadow-sm">
                        <AvatarImage src={selectedConversation.avatar} alt={selectedConversation.name} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-white text-sm">
                          {selectedConversation.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 
                            className="truncate cursor-pointer hover:text-primary transition-colors" 
                            style={{ fontWeight: 600 }}
                            onClick={() => onNavigate('helper-public-profile', { userId: selectedConversation.participantId })}
                          >
                            {selectedConversation.name}
                          </h4>
                          {selectedConversation.online && (
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {/* <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary transition-colors">
                        <Phone className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary transition-colors">
                        <Video className="w-4 h-4" />
                      </Button> */}
                      {/* <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary transition-colors">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            Mute Notifications
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            Block User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu> */}
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-secondary/5 to-white">
                    <div className="flex justify-center mb-4">
                      <div className="bg-secondary/50 rounded-full px-4 py-1.5">
                        <p className="text-xs text-muted-foreground">Today</p>
                      </div>
                    </div>
                    
                    {selectedConversation.messages.map((msg, index) => {
                      const showDateDivider = index > 0 && 
                        new Date(msg.timestamp).toDateString() !== 
                        new Date(selectedConversation.messages[index - 1].timestamp).toDateString();
                      
                      return (
                        <div key={msg._id}>
                          {showDateDivider && (
                            <div className="flex justify-center my-4">
                              <div className="bg-secondary/50 rounded-full px-4 py-1.5">
                                <p className="text-xs text-muted-foreground">
                                  {new Date(msg.timestamp).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          )}
                          <div
                            className={`flex ${msg.sender._id === user?._id ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-3300`}
                          >
                            <div
                              className={`max-w-[75%] sm:max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ${
                                msg.sender._id === user?._id
                                  ? 'bg-gradient-to-br from-primary to-primary/90 text-white rounded-br-sm'
                                  : 'bg-white border border-border text-foreground rounded-bl-sm'
                              }`}
                            >
                              <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                              <div className={`flex items-center justify-end gap-1 mt-1.5 ${msg.sender._id === user?._id ? 'text-white/80' : 'text-muted-foreground'}`}>
                                <p className="text-xs">
                                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                  
                  {/* Message Input */}
                  <div className="p-4 border-t border-border bg-white flex-shrink-0">
                    <div className="flex gap-2 items-end">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="shrink-0 hover:bg-primary/10 hover:text-primary transition-all hover:scale-110"
                          >
                            <Smile className="w-5 h-5" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 p-3" align="start">
                          <div className="grid grid-cols-6 gap-1">
                            {emojis.map((emoji, i) => (
                              <button
                                key={i}
                                onClick={() => setMessage(message + emoji)}
                                className="text-2xl p-2 hover:bg-secondary/50 rounded-lg transition-colors"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>

                      {/* <Button 
                        variant="ghost" 
                        size="icon"
                        className="shrink-0 hover:bg-primary/10 hover:text-primary transition-all hover:scale-110"
                      >
                        <Paperclip className="w-5 h-5" />
                      </Button> */}
                      <Input
                        placeholder="Type your message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        className="bg-secondary/20 border-0 focus-visible:ring-primary/20 focus-visible:bg-white transition-colors"
                      />
                      <Button 
                        size="icon"
                        onClick={handleSendMessage}
                        className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white shrink-0 transition-all hover:scale-110 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!message.trim()}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 ml-20">
                      Press Enter to send • Share photos of your pets! 🐾
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-gradient-to-b from-secondary/10 to-white relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsConversationListCollapsed(!isConversationListCollapsed)}
                    className="hidden md:flex hover:bg-primary/10 hover:text-primary transition-colors absolute top-4 left-4"
                    title={isConversationListCollapsed ? "Show conversations" : "Hide conversations"}
                  >
                    {isConversationListCollapsed ? (
                      <PanelLeftOpen className="w-5 h-5" />
                    ) : (
                      <PanelLeftClose className="w-5 h-5" />
                    )}
                  </Button>
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-4 shadow-inner">
                    <Send className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-primary mb-2" style={{ fontWeight: 600, fontSize: '20px' }}>
                    Select a conversation
                  </h3>
                  <p className="text-muted-foreground max-w-sm">
                    Choose a conversation from the list to start chatting with pet owners and helpers in your community
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
