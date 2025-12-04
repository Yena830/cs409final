import React, { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Heart, User, PawPrint, ArrowLeft } from "lucide-react";

interface AuthPageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

export function AuthPage({ onNavigate }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string[]>([]);

  const toggleRole = (role: string) => {
    if (selectedRole.includes(role)) {
      setSelectedRole(selectedRole.filter(r => r !== role));
    } else {
      setSelectedRole([...selectedRole, role]);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-24">
      <div className="max-w-[1000px] w-full">
        <Card className="grid md:grid-cols-2 overflow-hidden border-0 shadow-2xl">
          {/* Left Side - Illustration */}
          <div className="bg-secondary/30 p-12 flex flex-col justify-center items-center text-center relative overflow-hidden">
            <div className="absolute top-6 left-6 opacity-20">
              <PawPrint className="w-16 h-16 text-primary rotate-12" />
            </div>
            <div className="absolute bottom-6 right-6 opacity-20">
              <PawPrint className="w-20 h-20 text-primary -rotate-12" />
            </div>
            
            <div className="relative z-10">
              <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mb-6 mx-auto">
                <Heart className="w-12 h-12 text-white fill-white" />
              </div>
              <h2 className="text-primary mb-4" style={{ fontWeight: 700, fontSize: '32px' }}>
                Welcome to<br />PawfectMatch
              </h2>
              <p className="text-muted-foreground">
                Connect with your community to provide and receive trusted pet care
              </p>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="p-12 bg-white relative">
            {/* Back Button */}
            <button
              onClick={() => onNavigate('landing')}
              className="absolute top-6 left-6 flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm" style={{ fontWeight: 500 }}>Back</span>
            </button>

            <div className="mb-8 mt-8">
              <h2 className="text-primary mb-2" style={{ fontWeight: 700, fontSize: '28px' }}>
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-muted-foreground">
                {isLogin 
                  ? 'Log in to continue to your account' 
                  : 'Sign up to get started with PawfectMatch'}
              </p>
            </div>

            <div className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name"
                    placeholder="John Doe"
                    className="bg-background"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="bg-background"
                />
              </div>

              {!isLogin && (
                <div className="space-y-3">
                  <Label>I want to be a:</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <Card
                      className={`p-4 cursor-pointer transition-all border-2 ${
                        selectedRole.includes('owner')
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => toggleRole('owner')}
                    >
                      <div className="flex flex-col items-center text-center gap-2">
                        <User className="w-8 h-8 text-primary" />
                        <div>
                          <div style={{ fontWeight: 600 }}>Pet Owner</div>
                          <div className="text-xs text-muted-foreground">Post tasks</div>
                        </div>
                      </div>
                    </Card>
                    <Card
                      className={`p-4 cursor-pointer transition-all border-2 ${
                        selectedRole.includes('helper')
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => toggleRole('helper')}
                    >
                      <div className="flex flex-col items-center text-center gap-2">
                        <Heart className="w-8 h-8 text-primary" />
                        <div>
                          <div style={{ fontWeight: 600 }}>Pet Helper</div>
                          <div className="text-xs text-muted-foreground">Find tasks</div>
                        </div>
                      </div>
                    </Card>
                  </div>
                  <p className="text-xs text-center text-muted-foreground">
                    You can select both roles
                  </p>
                </div>
              )}

              <Button 
                className="w-full bg-primary hover:bg-primary/90 text-white"
                onClick={() => onNavigate('profile')}
              >
                {isLogin ? 'Log In' : 'Create Account'}
              </Button>

              <div className="text-center text-sm">
                <span className="text-muted-foreground">
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                </span>
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-primary hover:underline"
                  style={{ fontWeight: 600 }}
                >
                  {isLogin ? 'Sign up' : 'Log in'}
                </button>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}