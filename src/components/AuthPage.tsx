import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Heart, User, PawPrint, ArrowLeft, Check, X } from "lucide-react";
import { api } from "../lib/api";
import { useUser } from "../hooks/useUser";
import { toast } from "sonner";

interface AuthPageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

interface PasswordValidation {
  minLength: boolean;
  hasNumber: boolean;
  hasLetter: boolean;
  hasSpecialChar: boolean;
}

export function AuthPage({ onNavigate }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string[]>(['owner']);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [passwordValidation, setPasswordValidation] = useState<PasswordValidation>({
    minLength: false,
    hasNumber: false,
    hasLetter: false,
    hasSpecialChar: false,
  });
  const { login } = useUser();

  // Password validation function
  const validatePassword = (password: string): PasswordValidation => {
    return {
      minLength: password.length >= 8,
      hasNumber: /\d/.test(password),
      hasLetter: /[a-zA-Z]/.test(password),
      hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    };
  };

  const isPasswordValid = (validation: PasswordValidation): boolean => {
    return validation.minLength && validation.hasNumber && validation.hasLetter && validation.hasSpecialChar;
  };

  const toggleRole = (role: string) => {
    if (selectedRole.includes(role)) {
      setSelectedRole(selectedRole.filter((r: string) => r !== role));
    } else {
      setSelectedRole([...selectedRole, role]);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev: { name: string; email: string; password: string }) => ({ ...prev, [field]: value }));
    
    // If password field and not in login mode, perform real-time validation
    if (field === 'password' && !isLogin) {
      const validation = validatePassword(value);
      setPasswordValidation(validation);
    }
  };

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', {
        email: formData.email,
        password: formData.password,
      });

      if (response.success && response.data) {
        const { user, token } = response.data;
        login(user, token);
        toast.success('Welcome back!');
        
        // Redirect to home page after successful login
        onNavigate('landing');
      } else {
        // More specific feedback for invalid credentials
        toast.error('Email or password is incorrect');
      }
    } catch (error) {
      // Show consistent message for invalid credentials or unregistered account
      toast.error('Email or password is incorrect');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    // Validate password strength
    const validation = validatePassword(formData.password);
    if (!isPasswordValid(validation)) {
      toast.error('Password does not meet requirements. Please check the password requirements below.');
      return;
    }

    if (selectedRole.length === 0) {
      toast.error('Please select at least one role');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        roles: selectedRole,
      });

      if (response.success && response.data) {
        const { user, token } = response.data;
        login(user, token);
        toast.success('Account created successfully!');
        
        // Redirect to home page after successful registration
        onNavigate('landing');
      } else {
        toast.error(response.message || 'Registration failed');
      }
    } catch (error) {
      toast.error('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      handleLogin();
    } else {
      handleRegister();
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

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name"
                    placeholder="John Doe"
                    className="bg-background"
                    value={formData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('name', e.target.value)}
                    required={!isLogin}
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
                  value={formData.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="bg-background"
                  value={formData.password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('password', e.target.value)}
                  required
                />
                {!isLogin && formData.password && (
                  <div className="mt-2 space-y-1.5 text-sm">
                    <p className="text-muted-foreground mb-2" style={{ fontWeight: 500 }}>
                      Password requirements:
                    </p>
                    <div className="space-y-1">
                      <div className={`flex items-center gap-2 ${passwordValidation.minLength ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {passwordValidation.minLength ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                        <span>At least 8 characters</span>
                      </div>
                      <div className={`flex items-center gap-2 ${passwordValidation.hasNumber ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {passwordValidation.hasNumber ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                        <span>At least one number</span>
                      </div>
                      <div className={`flex items-center gap-2 ${passwordValidation.hasLetter ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {passwordValidation.hasLetter ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                        <span>At least one letter</span>
                      </div>
                      <div className={`flex items-center gap-2 ${passwordValidation.hasSpecialChar ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {passwordValidation.hasSpecialChar ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                        <span>At least one special character (!@#$%^&*...)</span>
                      </div>
                    </div>
                  </div>
                )}
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
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-white"
                disabled={loading || (!isLogin && formData.password && !isPasswordValid(passwordValidation))}
              >
                {loading ? 'Loading...' : (isLogin ? 'Log In' : 'Create Account')}
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
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
