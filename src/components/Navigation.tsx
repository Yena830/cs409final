import React, { useState } from "react";
import { Button } from "./ui/button";
import { MessageSquare, User, Heart, Home, ChevronDown, HelpCircle, PawPrint } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { OnboardingModal } from "./OnboardingModal";

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

export function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  
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
              <DropdownMenuItem onClick={() => onNavigate('post-task')}>
                Post a Task
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onNavigate('find-helpers')}>
                Find Helpers
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onNavigate('profile', { userType: 'owner' })}>
                My Profile
              </DropdownMenuItem>
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
              <DropdownMenuItem onClick={() => onNavigate('profile', { userType: 'helper' })}>
                My Profile
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
          <Button 
            variant="ghost" 
            onClick={() => onNavigate('auth')}
          >
            Log In
          </Button>
          <Button 
            onClick={() => onNavigate('post-task')}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            Post a Task
          </Button>
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
            onClick={() => onNavigate('post-task')}
            className={`flex flex-col items-center gap-1 ${currentPage === 'post-task' ? 'text-primary' : 'text-muted-foreground'}`}
          >
            <Heart className="w-5 h-5" />
            <span className="text-xs">Post</span>
          </button>
          <button 
            onClick={() => onNavigate('messages')}
            className={`flex flex-col items-center gap-1 ${currentPage === 'messages' ? 'text-primary' : 'text-muted-foreground'}`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-xs">Messages</span>
          </button>
          <button 
            onClick={() => onNavigate('profile')}
            className={`flex flex-col items-center gap-1 ${currentPage === 'profile' ? 'text-primary' : 'text-muted-foreground'}`}
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