import React, { useState } from "react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { MessageSquare, User, Heart, Home, ChevronDown, HelpCircle, PawPrint, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { OnboardingModal } from "./OnboardingModal";
import { useUser } from "../contexts/UserContext";
import { toast } from "sonner";

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

export function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { user, isAuthenticated, isOwner, isHelper, logout } = useUser();
  
  const handleLogout = () => {
    logout();
    onNavigate('landing');
  };
  
  return (
    <>
      {showOnboarding && <OnboardingModal onClose={() => setShowOnboarding(false)} />}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-border">
      <div className="max-w-[1200px] mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => onNavigate('landing')}>
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
            <PawPrint className="w-5 h-5 text-white fill-white" />
          </div>
          <span 
            className="text-primary tracking-tight" 
            style={{ 
              fontWeight: 800, 
              fontSize: '22px',
              fontFamily: 'Georgia, "Times New Roman", serif',
              textShadow: '0 2px 4px rgba(139, 186, 139, 0.2)',
              letterSpacing: '-0.5px'
            }}
          >
            PawfectMatch
          </span>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <button 
            onClick={() => onNavigate('landing')}
            className={`transition-colors ${currentPage === 'landing' ? 'text-primary' : 'text-foreground hover:text-primary'}`}
          >
            Home
          </button>
         
          
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 text-foreground hover:text-primary transition-colors">
              For Owners
              <ChevronDown className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={() => {
                if (!isAuthenticated) {
                  toast.error("Please log in to continue");
                  onNavigate("auth");
                  return;
                }
                onNavigate('post-task');
              }}>
                Post a Task
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onNavigate('find-helpers')}>
                Find Helpers
              </DropdownMenuItem>
              {isAuthenticated && isOwner() && (
                <DropdownMenuItem onClick={() => {
                  onNavigate('owner-profile');
                }}>
                  My Owner Profile
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 text-foreground hover:text-primary transition-colors">
              For Helpers
              <ChevronDown className="w-4 h-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={() => onNavigate('tasks')}>
                Browse Tasks
              </DropdownMenuItem>
              {isAuthenticated && isHelper() && (
                <DropdownMenuItem onClick={() => {
                  onNavigate('helper-profile');
                }}>
                  My Helper Profile
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

 
          <button 
            onClick={() => {
              if (!isAuthenticated) {
                toast.error("Please log in to continue");
                onNavigate("auth");
                return;
              }
              onNavigate('messages');
            }}
            className={`transition-colors ${currentPage === 'messages' ? 'text-primary' : 'text-foreground hover:text-primary'}`}
          >
            Messages
          </button>

        </div>

        <div className="hidden md:flex items-center gap-3">
          <Button 
            variant="ghost"
            size="icon"
            onClick={() => setShowOnboarding(true)}
            className="hover:bg-primary/10 hover:text-primary"
          >
            <HelpCircle className="w-5 h-5" />
          </Button>
          {isAuthenticated ? (
            <>
              {isOwner() && (
                <Button 
                  onClick={() => {
                    if (!isAuthenticated) {
                      toast.error("Please log in to continue");
                      onNavigate("auth");
                      return;
                    }
                    onNavigate('post-task');
                  }}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  Post a Task
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user?.profilePhoto} alt={user?.name} />
                      <AvatarFallback className="bg-primary text-white text-sm">
                        {user?.name?.substring(0, 2).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden lg:inline">{user?.name || 'User'}</span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {isOwner() && (
                    <DropdownMenuItem onClick={() => onNavigate('owner-profile')}>
                      <User className="w-4 h-4 mr-2" />
                      My Owner Profile
                    </DropdownMenuItem>
                  )}
                  {isHelper() && (
                    <DropdownMenuItem onClick={() => onNavigate('helper-profile')}>
                      <User className="w-4 h-4 mr-2" />
                      My Helper Profile
                    </DropdownMenuItem>
                  )}
                  {(isOwner() || isHelper()) && <DropdownMenuSeparator />}
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button 
                variant="ghost" 
                onClick={() => onNavigate('auth')}
              >
                Log In
              </Button>
              <Button 
                onClick={() => {
                  if (!isAuthenticated) {
                    toast.error("Please log in to continue");
                    onNavigate("auth");
                    return;
                  }
                  onNavigate('post-task');
                }}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                Post a Task
              </Button>
            </>
          )}
        </div>

        {/* Mobile bottom navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border flex items-center justify-around py-3 px-4">
          <button 
            onClick={() => onNavigate('tasks')}
            className={`flex flex-col items-center gap-1 ${currentPage === 'tasks' ? 'text-primary' : 'text-muted-foreground'}`}
          >
            <Home className="w-5 h-5" />
            <span className="text-xs">Home</span>
          </button>
          <button 
            onClick={() => {
              if (!isAuthenticated) {
                toast.error("Please log in to continue");
                onNavigate("auth");
                return;
              }
              onNavigate('post-task');
            }}
            className={`flex flex-col items-center gap-1 ${currentPage === 'post-task' ? 'text-primary' : 'text-muted-foreground'}`}
          >
            <Heart className="w-5 h-5" />
            <span className="text-xs">Post</span>
          </button>
          <button 
            onClick={() => {
              if (!isAuthenticated) {
                toast.error("Please log in to continue");
                onNavigate("auth");
                return;
              }
              onNavigate('messages');
            }}
            className={`flex flex-col items-center gap-1 ${currentPage === 'messages' ? 'text-primary' : 'text-muted-foreground'}`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-xs">Messages</span>
          </button>
          <button 
            onClick={() => {
              if (!isAuthenticated) {
                toast.error("Please log in to continue");
                onNavigate("auth");
                return;
              }
              // Navigate to owner profile if owner, helper profile if helper, or landing if neither
              if (isOwner()) {
                onNavigate('owner-profile');
              } else if (isHelper()) {
                onNavigate('helper-profile');
              } else {
                onNavigate('landing');
              }
            }}
            className={`flex flex-col items-center gap-1 ${currentPage === 'owner-profile' || currentPage === 'helper-profile' ? 'text-primary' : 'text-muted-foreground'}`}
          >
            <User className="w-5 h-5" />
            <span className="text-xs">Profile</span>
          </button>
        </div>
      </div>
    </nav>
    </>
  );
}