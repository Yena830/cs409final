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

interface MessagesPageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
  selectedUserId?: number;
}

interface Message {
  id: number;
  sender: string;
  content: string;
  time: string;
  isOwn: boolean;
  status?: "sent" | "delivered" | "read";
}

interface Conversation {
  id: number;
  name: string;
  avatar: string;
  initials: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  taskType?: string;
  messages: Message[];
}

export function MessagesPage({ onNavigate, selectedUserId }: MessagesPageProps) {
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isConversationListCollapsed, setIsConversationListCollapsed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const emojis = ["😊", "❤️", "👍", "🐕", "🐱", "🎉", "✨", "🙏", "😂", "🤗", "🌟", "🐾"];

  const conversations: Conversation[] = [
    {
      id: 1,
      name: "Sarah M.",
      avatar: "",
      initials: "SM",
      lastMessage: "Sounds great! See you tomorrow morning.",
      time: "2m ago",
      unread: 2,
      online: true,
      taskType: "Dog Walking",
      messages: [
        {
          id: 1,
          sender: "Sarah M.",
          content: "Hi! I saw your application for walking Max. Your profile looks great!",
          time: "10:30 AM",
          isOwn: false,
        },
        {
          id: 2,
          sender: "You",
          content: "Thank you! I'd love to help. I have 3 years of experience with Golden Retrievers.",
          time: "10:32 AM",
          isOwn: true,
          status: "read",
        },
        {
          id: 3,
          sender: "Sarah M.",
          content: "That's wonderful! Max is very friendly but has lots of energy. Are you available tomorrow morning at 8 AM?",
          time: "10:35 AM",
          isOwn: false,
        },
        {
          id: 4,
          sender: "You",
          content: "Yes, I'm available! I can meet you at the Central Park entrance. I'll bring some treats too! 🐕",
          time: "10:36 AM",
          isOwn: true,
          status: "read",
        },
        {
          id: 5,
          sender: "Sarah M.",
          content: "Sounds great! See you tomorrow morning.",
          time: "10:38 AM",
          isOwn: false,
        },
      ],
    },
    {
      id: 2,
      name: "John D.",
      avatar: "",
      initials: "JD",
      lastMessage: "Thanks for taking care of Luna!",
      time: "1h ago",
      unread: 0,
      online: false,
      taskType: "Cat Feeding",
      messages: [
        {
          id: 1,
          sender: "John D.",
          content: "Hi! I'm going out of town this weekend. Could you feed Luna on Saturday and Sunday?",
          time: "Yesterday",
          isOwn: false,
        },
        {
          id: 2,
          sender: "You",
          content: "Of course! I'd be happy to help. What time would work best?",
          time: "Yesterday",
          isOwn: true,
          status: "read",
        },
        {
          id: 3,
          sender: "John D.",
          content: "Around 8 AM and 6 PM would be perfect. I'll leave the key with the doorman.",
          time: "Yesterday",
          isOwn: false,
        },
        {
          id: 4,
          sender: "You",
          content: "Perfect! I'll make sure Luna is well taken care of. Any special instructions?",
          time: "Yesterday",
          isOwn: true,
          status: "read",
        },
        {
          id: 5,
          sender: "John D.",
          content: "Just give her the wet food in the fridge and make sure she has fresh water. She loves to play with the feather toy!",
          time: "9:15 AM",
          isOwn: false,
        },
        {
          id: 6,
          sender: "You",
          content: "Got it! I'll send you updates with photos 📸",
          time: "9:20 AM",
          isOwn: true,
          status: "read",
        },
        {
          id: 7,
          sender: "John D.",
          content: "Thanks for taking care of Luna!",
          time: "1h ago",
          isOwn: false,
        },
      ],
    },
    {
      id: 3,
      name: "Emily R.",
      avatar: "",
      initials: "ER",
      lastMessage: "Can we reschedule for next week?",
      time: "3h ago",
      unread: 1,
      online: true,
      taskType: "Pet Sitting",
      messages: [
        {
          id: 1,
          sender: "Emily R.",
          content: "Hi! I need someone to watch my two cats while I'm traveling. Are you available from Dec 15-20?",
          time: "2 days ago",
          isOwn: false,
        },
        {
          id: 2,
          sender: "You",
          content: "Hi Emily! I'm available for those dates. I'd love to help with your cats!",
          time: "2 days ago",
          isOwn: true,
          status: "read",
        },
        {
          id: 3,
          sender: "Emily R.",
          content: "Great! They're pretty independent but need feeding twice a day and some playtime.",
          time: "2 days ago",
          isOwn: false,
        },
        {
          id: 4,
          sender: "You",
          content: "That sounds perfect. I can stop by morning and evening. Would you like me to send daily updates?",
          time: "2 days ago",
          isOwn: true,
          status: "read",
        },
        {
          id: 5,
          sender: "Emily R.",
          content: "That would be wonderful! Actually, something came up. Can we reschedule for next week?",
          time: "3h ago",
          isOwn: false,
        },
      ],
    },
    {
      id: 4,
      name: "Mike T.",
      avatar: "",
      initials: "MT",
      lastMessage: "Perfect! I'll bring some treats.",
      time: "1d ago",
      unread: 0,
      online: false,
      taskType: "Dog Walking",
      messages: [
        {
          id: 1,
          sender: "Mike T.",
          content: "Hey! I saw you're looking for dog walking help. I walk my own dog every day and would love to help with yours too!",
          time: "3 days ago",
          isOwn: false,
        },
        {
          id: 2,
          sender: "You",
          content: "That's great! What kind of dog do you have?",
          time: "3 days ago",
          isOwn: true,
          status: "read",
        },
        {
          id: 3,
          sender: "Mike T.",
          content: "I have a Labrador named Buddy. He's super friendly and loves playing with other dogs!",
          time: "3 days ago",
          isOwn: false,
        },
        {
          id: 4,
          sender: "You",
          content: "That sounds perfect! My dog Charlie would love a walking buddy. When are you usually available?",
          time: "3 days ago",
          isOwn: true,
          status: "read",
        },
        {
          id: 5,
          sender: "Mike T.",
          content: "Perfect! I'll bring some treats.",
          time: "1d ago",
          isOwn: false,
        },
      ],
    },
    {
      id: 5,
      name: "Lisa K.",
      avatar: "",
      initials: "LK",
      lastMessage: "Your rabbit is adorable! 🐰",
      time: "2d ago",
      unread: 0,
      online: false,
      taskType: "Pet Boarding",
      messages: [
        {
          id: 1,
          sender: "Lisa K.",
          content: "Hi! I noticed you offer pet boarding. Do you have experience with rabbits?",
          time: "1 week ago",
          isOwn: false,
        },
        {
          id: 2,
          sender: "You",
          content: "Yes! I actually have a rabbit of my own. What kind do you have?",
          time: "1 week ago",
          isOwn: true,
          status: "read",
        },
        {
          id: 3,
          sender: "Lisa K.",
          content: "Your rabbit is adorable! 🐰",
          time: "2d ago",
          isOwn: false,
        },
      ],
    },
    {
      id: 6,
      name: "David P.",
      avatar: "",
      initials: "DP",
      lastMessage: "Thanks again for your help!",
      time: "5d ago",
      unread: 0,
      online: false,
      taskType: "Pet Sitting",
      messages: [
        {
          id: 1,
          sender: "David P.",
          content: "Thank you so much for watching Whiskers last week. He seemed very happy when I got back!",
          time: "5d ago",
          isOwn: false,
        },
        {
          id: 2,
          sender: "You",
          content: "It was my pleasure! Whiskers is such a sweet cat. Feel free to reach out anytime you need help!",
          time: "5d ago",
          isOwn: true,
          status: "read",
        },
        {
          id: 3,
          sender: "David P.",
          content: "Thanks again for your help!",
          time: "5d ago",
          isOwn: false,
        },
      ],
    },
  ];

  const selectedConversation = conversations.find((conv) => conv.id === selectedChat);
  const filteredConversations = conversations.filter((conv) =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedChat]);

  // Auto-select chat if selectedUserId is provided
  useEffect(() => {
    if (selectedUserId) {
      setSelectedChat(selectedUserId);
    }
  }, [selectedUserId]);

  const handleSendMessage = () => {
    if (message.trim()) {
      // Handle send message logic here
      setMessage("");
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
                    <p className="text-muted-foreground">No conversations found</p>
                  </div>
                ) : (
                  filteredConversations.map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => setSelectedChat(conv.id)}
                      className={`p-4 border-b border-border/50 cursor-pointer transition-all duration-200 ${
                        selectedChat === conv.id 
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
                            <span className="text-xs text-muted-foreground shrink-0">
                              {conv.time}
                            </span>
                          </div>
                          {conv.taskType && (
                            <Badge variant="outline" className="mb-1 text-xs border-primary/30 text-primary bg-primary/5">
                              {conv.taskType}
                            </Badge>
                          )}
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-sm truncate ${conv.unread > 0 ? 'text-foreground' : 'text-muted-foreground'}`} style={{ fontWeight: conv.unread > 0 ? 600 : 400 }}>
                              {conv.lastMessage}
                            </p>
                            {conv.unread > 0 && (
                              <Badge className="bg-primary text-white shrink-0 h-5 min-w-[20px] rounded-full px-1.5 flex items-center justify-center text-xs shadow-sm">
                                {conv.unread}
                              </Badge>
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
                      <Avatar className="w-11 h-11 border-2 border-primary/20 flex-shrink-0">
                        <AvatarImage src={selectedConversation.avatar} alt={selectedConversation.name} />
                        <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-white">
                          {selectedConversation.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <h4 style={{ fontWeight: 600 }} className="truncate">{selectedConversation.name}</h4>
                        {selectedConversation.online ? (
                          <p className="text-sm text-primary flex items-center gap-1">
                            <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
                            Online
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground">Offline</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary hidden sm:flex">
                        <Phone className="w-5 h-5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary hidden sm:flex">
                        <Video className="w-5 h-5" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="hover:bg-primary/10 hover:text-primary">
                            <MoreVertical className="w-5 h-5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onNavigate('profile')}>
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onNavigate('task-detail')}>
                            View Task Details
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            Block User
                          </DropdownMenuItem>
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
                      const showDateDivider = index > 0 && msg.time.includes("days ago") && !selectedConversation.messages[index - 1].time.includes("days ago");
                      
                      return (
                        <div key={msg.id}>
                          {showDateDivider && (
                            <div className="flex justify-center my-4">
                              <div className="bg-secondary/50 rounded-full px-4 py-1.5">
                                <p className="text-xs text-muted-foreground">{msg.time}</p>
                              </div>
                            </div>
                          )}
                          <div
                            className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                          >
                            <div
                              className={`max-w-[75%] sm:max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ${
                                msg.isOwn
                                  ? 'bg-gradient-to-br from-primary to-primary/90 text-white rounded-br-sm'
                                  : 'bg-white border border-border text-foreground rounded-bl-sm'
                              }`}
                            >
                              <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                              <div className={`flex items-center justify-end gap-1 mt-1.5 ${msg.isOwn ? 'text-white/80' : 'text-muted-foreground'}`}>
                                <p className="text-xs">
                                  {msg.time}
                                </p>
                                {msg.isOwn && msg.status && (
                                  <span>
                                    {msg.status === "read" ? (
                                      <CheckCheck className="w-3.5 h-3.5 text-white" />
                                    ) : msg.status === "delivered" ? (
                                      <CheckCheck className="w-3.5 h-3.5 text-white/60" />
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

                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="shrink-0 hover:bg-primary/10 hover:text-primary transition-all hover:scale-110"
                      >
                        <Paperclip className="w-5 h-5" />
                      </Button>

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