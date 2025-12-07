import React, { useState, useRef, useEffect } from "react";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Send, Search, Smile, Paperclip, ArrowLeft, Check, CheckCheck, MoreVertical, Phone, Video, PanelLeftClose, PanelLeftOpen } from "lucide-react";
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
  unread: number;
  online: boolean;
  taskType?: string;
  messages: Message[];
  participantId: string;
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
          
          userConversations.push({
            _id: conv.participantId,
            name: userName,
            avatar: userAvatar,
            initials: userInitials,
            lastMessage: conv.lastMessage,
            time: new Date(conv.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            unread: conv.unread,
            online: false,
            taskType: "Pet Care",
            messages: [],
            participantId: conv.participantId
          });
        }
      }
      
      // Ensure user with selectedUserId is in conversation list
      if (selectedUserId && selectedUserId !== user._id) {
        // Check if conversation with this user already exists
        const existingConversation = userConversations.find(conv => conv.participantId === selectedUserId);
        if (!existingConversation) {
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
          
          const newConversation: Conversation = {
            _id: "selected",
            name: userName,
            avatar: userAvatar,
            initials: userInitials,
            lastMessage: "",
            time: "Just now",
            unread: 0,
            online: true,
            taskType: "Pet Care",
            messages: [],
            participantId: selectedUserId
          };
          
          // Add new conversation to the beginning of the list
          userConversations = [newConversation, ...userConversations];
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
      socketRef.current = io("http://localhost:3001", {
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
      
      
      // Join room
      socketRef.current.emit("join_room", user._id);
      
      // Listen for connection success event  
      socketRef.current.on("connect", () => {
        // Removed connection success log
      });
      
      // Listen for connection error event
      socketRef.current.on("connect_error", (error) => {
        // Removed connection error log
      });
      
      // Listen for disconnect event
      socketRef.current.on("disconnect", (reason) => {
        // Removed disconnect log
      });
      
      // Listen for receive message
      socketRef.current.on("receive_message", (message: Message) => {
        // Ensure message is not from user self
        if (message.sender._id === user._id) {
          return;
        }
        
        // Use functional update to avoid closure issue
        setConversations(prev => {
          // Check if conversation with this user already exists
          const existingIndex = prev.findIndex(conv => conv.participantId === message.sender._id);
          
          if (existingIndex >= 0) {
            // Update existing conversation 
            const updatedConversations = [...prev];
            updatedConversations[existingIndex] = {
              ...updatedConversations[existingIndex],
              lastMessage: message.content,
              time: new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              unread: updatedConversations[existingIndex].unread + 1
            };
            return updatedConversations;
          } else {
            // Create new conversation (if it doesn't exist)
            return [{
              _id: message.sender._id,
              name: message.sender.name || "Unknown User",
              avatar: message.sender.profilePhoto || "",
              initials: message.sender.name ? message.sender.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : "UU",
              lastMessage: message.content,
              time: new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              unread: 1,
              online: false,
              taskType: "Pet Care",
              messages: [],
              participantId: message.sender._id
            }, ...prev];
          }
        });
        
        // If currently viewing this conversation, add to message list 
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
        }
      });
      
      // Cleanup function
      return () => {
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    }
  }, [user?._id]);

  // Load user conversation list
  useEffect(() => {
    let isMounted = true;
    
    loadConversations().then((loadedConversations) => {
      if (!isMounted) return;
      
      // If there is selectedUserId, automatically select the corresponding conversation
      if (selectedUserId && loadedConversations.length > 0) {
        // Find the corresponding conversation
        const conversation = loadedConversations.find(conv => conv.participantId === selectedUserId);
        if (conversation) {
          setSelectedChat(conversation._id);
        } else {
          // If not found, may be because of newly added conversation, use "selected" as ID
          setSelectedChat("selected");
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

  // Load messages for the selected conversation
  useEffect(() => {
    if (!selectedChat || !user) {
      setSelectedConversation(null);
      return;
    }
    
    let isMounted = true;
    
    const loadMessages = async () => {
      try {
        // Get conversation details
        const conversation = conversations.find(c => c._id === selectedChat);
        if (!conversation || !isMounted) return;
        
        // Fetch real message history from API
        const response = await api.getConversation(conversation.participantId);
        if (response.success && response.data && isMounted) {
          // Only update state if the currently selected chat is still this conversation
          if (selectedChat === conversation._id) {
            setSelectedConversation({
              ...conversation,
              messages: response.data
            });
            
            // Mark as read
            setConversations(prev => prev.map(conv => 
              conv._id === selectedChat ? { ...conv, unread: 0 } : conv
            ));
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
        // Send message to backend via API
        const response = await api.sendMessage(selectedConversation.participantId, message);
        if (response.success && response.data) {
          const newMessage: Message = response.data;
          
          // Update local UI
          setSelectedConversation(prev => {
            if (prev) {
              return {
                ...prev,
                messages: [...prev.messages, newMessage],
                lastMessage: newMessage.content,
                time: "Just Now"
              };
            }
            return prev;
          });
          
          // Update conversation list
          setConversations(prev => prev.map(conv => 
            conv._id === selectedConversation._id ? { 
              ...conv, 
              lastMessage: newMessage.content,
              time: "Just Now"
            } : conv
          ));
          
          setMessage("");
        }
      } catch (error) {
        console.error("Failed to send message:", error);
      }
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase()) && conv.participantId !== user?._id
  );

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
            onClick={() => onNavigate("landing")}
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
                      key={`${conv._id}-${conv.participantId}`}
                      onClick={() => {
                        // Use setTimeout to ensure state update order is correct
                        setTimeout(() => {
                          setSelectedChat(conv._id);
                        }, 0);
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
                          {conv.taskType && (
                            <Badge variant="outline" className="mb-1 text-xs border-primary/30 text-primary bg-primary/5">
                              {conv.taskType}
                            </Badge>
                          )}
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground truncate">
                              {conv.lastMessage}
                            </p>
                            {conv.unread > 0 && (
                              <span className="bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                                {conv.unread}
                              </span>
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
                        {selectedConversation.taskType && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                            {selectedConversation.taskType}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {/* <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary transition-colors">
                        <Phone className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary transition-colors">
                        <Video className="w-4 h-4" />
                      </Button> */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary transition-colors">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {/* <DropdownMenuItem>
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            Mute Notifications
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            Block User
                          </DropdownMenuItem> */}
                        </DropdownMenuContent>
                      </DropdownMenu>
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
                                {msg.sender._id === user?._id && (
                                  <span>
                                    {msg.read ? (
                                      <CheckCheck className="w-3.5 h-3.5 text-white" />
                                    ) : (
                                      <Check className="w-3.5 h-3.5 text-white/60" />
                                    )}
                                  </span>
                                )}
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
