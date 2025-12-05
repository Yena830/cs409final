import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Star, MapPin, Clock, DollarSign, Leaf, Sparkles } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { HowItWorks } from "./HowItWorks";
import { OnboardingModal } from "./OnboardingModal";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "./ui/carousel";
import { api } from "../lib/api";

interface LandingPageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

interface Task {
  _id: string;
  title: string;
  type: string;
  location: string;
  reward?: string;
  budget?: number;
  time?: string;
  date?: string;
  pet?: {
    _id: string;
    name: string;
    type: string;
    photos?: string[];
  };
  status: string;
}

export function LandingPage({ onNavigate }: LandingPageProps) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [featuredTasks, setFeaturedTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  useEffect(() => {
    loadFeaturedTasks();
  }, []);

  const loadFeaturedTasks = async () => {
    setLoadingTasks(true);
    try {
      const response = await api.get<Task[]>("/tasks");
      if (response.success && response.data) {
        // Filter for open tasks only and take first 3
        const openTasks = response.data
          .filter(task => task.status === 'open')
          .slice(0, 3);
        setFeaturedTasks(openTasks);
      }
    } catch (error) {
      console.error('Failed to load featured tasks:', error);
    } finally {
      setLoadingTasks(false);
    }
  };

  return (
    <div className="min-h-screen">
      {showOnboarding && <OnboardingModal onClose={() => setShowOnboarding(false)} />}
      
      {/* Hero Section */}
      <div className="relative bg-secondary/30 min-h-screen flex items-center px-4 overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-10 left-10 opacity-10">
          <Leaf className="w-24 h-24 text-primary rotate-12" />
        </div>
        <div className="absolute bottom-10 right-10 opacity-10">
          <Leaf className="w-32 h-32 text-primary -rotate-45" />
        </div>
        
        <div className="max-w-[1200px] mx-auto w-full py-20">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="space-y-6 text-center md:text-left">
              <h1 className="leading-tight text-4xl md:text-5xl lg:text-6xl" style={{ fontWeight: 700 }}>
                Local pet lovers<br />
                <span className="text-primary">you can trust</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
                For every walk, feed, and cuddle. Connect with verified helpers in your neighborhood for safe, loving pet care.
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap gap-4 justify-center md:justify-start">
                <Button 
                  size="lg"
                  onClick={() => onNavigate('post-task')}
                  className="bg-primary hover:bg-primary/90 text-white px-8 shadow-lg hover:shadow-xl transition-all hover:scale-105 w-full sm:w-auto"
                  style={{ fontSize: '18px' }}
                >
                  Post a Task
                </Button>
                <Button 
                  size="lg"
                  variant="outline"
                  onClick={() => onNavigate('tasks')}
                  className="border-2 border-primary text-primary hover:bg-primary hover:text-white hover:shadow-md transition-all w-full sm:w-auto"
                  style={{ fontSize: '18px' }}
                >
                  Find Helpers
                </Button>
              </div>
            </div>

            <div className="relative">
              {/* Floating paw prints animation */}
              <div className="absolute -top-4 -left-4 w-8 h-8 text-primary/30 animate-bounce" style={{ animationDelay: '0s', animationDuration: '2s' }}>
                🐾
              </div>
              <div className="absolute top-1/4 -right-4 w-8 h-8 text-primary/30 animate-bounce" style={{ animationDelay: '0.5s', animationDuration: '2.5s' }}>
                🐾
              </div>
              <div className="absolute bottom-1/4 -left-6 w-8 h-8 text-primary/30 animate-bounce" style={{ animationDelay: '1s', animationDuration: '3s' }}>
                🐾
              </div>
              
              <div className="rounded-3xl overflow-hidden shadow-2xl transform transition-transform duration-500 hover:scale-105">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1759073178653-b09ba19fa1f3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXQlMjBvd25lciUyMHdhbGtpbmclMjBkb2d8ZW58MXx8fHwxNzYwMzkzMTM0fDA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Person walking dog"
                  className="w-full h-[400px] object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Popular Tasks Section */}
      <div className="bg-secondary/20 min-h-screen flex items-center py-20 px-4">
        <div className="max-w-[1200px] mx-auto w-full">
          <div className="text-center mb-12">
            <h2 className="text-primary mb-4" style={{ fontWeight: 700, fontSize: '40px' }}>Popular Tasks</h2>
            <p className="text-muted-foreground">
              Popular pet care tasks in your area
            </p>
          </div>

          {loadingTasks ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground">Loading popular tasks...</div>
            </div>
          ) : featuredTasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground">No popular tasks available at the moment.</div>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-6">
              {featuredTasks.map((task, index) => {
                const imageUrl = task?.pet?.photos?.[0] ?? "https://placehold.co/600x400?text=No+Pet+Photo";
                const rewardDisplay = task.reward || (task.budget ? `$${task.budget}` : '$0');
                const timeDisplay = task.time || (task.date ? new Date(task.date).toLocaleDateString() : 'Flexible');
                
                return (
                  <Card 
                    key={task._id}
                    className="group overflow-hidden hover:shadow-2xl transition-all cursor-pointer border-0 shadow-md hover:-translate-y-2 duration-300"
                    onClick={() => onNavigate('task-detail', { taskId: task._id })}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="aspect-square relative overflow-hidden">
                      <ImageWithFallback
                        src={imageUrl}
                        alt={task.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1 shadow-md">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm" style={{ fontWeight: 600 }}>4.8</span>
                      </div>
                    </div>
                    <div className="p-5 space-y-3 bg-white">
                      <h3 style={{ fontWeight: 600 }} className="group-hover:text-primary transition-colors">{task.title}</h3>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-primary" />
                          {task.location}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary" />
                          {timeDisplay}
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-border">
                          <span className="text-primary" style={{ fontWeight: 700, fontSize: '18px' }}>{rewardDisplay}</span>
                          <div className="text-xs text-muted-foreground">per task</div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          <div className="text-center mt-12">
            <Button 
              size="lg"
              onClick={() => onNavigate('tasks')}
              className="bg-primary hover:bg-primary/90 text-white px-8 shadow-lg hover:shadow-xl transition-all hover:scale-105"
              style={{ fontSize: '18px' }}
            >
              View All Tasks
            </Button>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <HowItWorks />

      {/* Testimonials Section */}
      <div className="bg-secondary/20 min-h-screen flex items-center py-20 px-4">
        <div className="max-w-[1200px] mx-auto w-full">
          <div className="text-center mb-12">
            <h2 className="text-primary mb-4" style={{ fontWeight: 700, fontSize: '40px' }}>Community Testimonials</h2>
            <p className="text-muted-foreground">See what our happy pet owners and helpers have to say</p>
          </div>

          <Carousel 
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full max-w-5xl mx-auto"
          >
            <CarouselContent>
              {[
                {
                  name: "Sarah M.",
                  role: "Pet Owner",
                  text: "Found a wonderful dog walker through PawfectMatch. My pup loves her morning walks now!",
                  avatar: "SM",
                  location: "Brooklyn, NY"
                },
                {
                  name: "Jake T.",
                  role: "Pet Helper",
                  text: "Great way to spend time with pets while earning extra income. The community is amazing!",
                  avatar: "JT",
                  location: "Manhattan, NY"
                },
                {
                  name: "Emily R.",
                  role: "Pet Owner",
                  text: "Peace of mind knowing my cat is well cared for when I travel. Highly recommend!",
                  avatar: "ER",
                  location: "Queens, NY"
                },
                {
                  name: "Michael P.",
                  role: "Pet Helper",
                  text: "I've met so many wonderful pets and owners. This platform makes connecting safe and easy!",
                  avatar: "MP",
                  location: "Bronx, NY"
                },
                {
                  name: "Lisa K.",
                  role: "Pet Owner",
                  text: "The verification process gave me confidence. Found a perfect sitter for my senior dog!",
                  avatar: "LK",
                  location: "Staten Island, NY"
                },
              ].map((testimonial, i) => (
                <CarouselItem key={i} className="md:basis-1/2 lg:basis-1/3">
                  <Card className="p-6 bg-white border-2 border-border shadow-lg h-full hover:shadow-xl hover:border-primary/30 transition-all">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      ))}
                    </div>
                    <p className="mb-4 text-muted-foreground leading-relaxed">{testimonial.text}</p>
                    <div className="flex items-center gap-3 mt-auto">
                      <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center" style={{ fontWeight: 600 }}>
                        {testimonial.avatar}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{testimonial.name}</div>
                        <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                        <div className="text-xs text-muted-foreground">{testimonial.location}</div>
                      </div>
                    </div>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>
        </div>
      </div>

      {/* Footer Section */}
      <div className="bg-[#C7BBA9]/30 py-16 px-4">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <h3 className="text-primary" style={{ fontWeight: 700 }}>PawfectMatch</h3>
              <p className="text-sm text-muted-foreground">
                Connecting pet owners with trusted local helpers for safe, loving pet care.
              </p>
            </div>
            
            <div className="space-y-3">
              <h4 style={{ fontWeight: 600 }}>For Pet Owners</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => onNavigate('post-task')} className="hover:text-primary transition-colors">Post a Task</button></li>
                <li><button onClick={() => onNavigate('tasks')} className="hover:text-primary transition-colors">Find Helpers</button></li>
                <li><button className="hover:text-primary transition-colors">How It Works</button></li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 style={{ fontWeight: 600 }}>For Helpers</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button onClick={() => onNavigate('tasks')} className="hover:text-primary transition-colors">Browse Tasks</button></li>
                <li><button className="hover:text-primary transition-colors">Become a Helper</button></li>
                <li><button className="hover:text-primary transition-colors">Safety Guidelines</button></li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 style={{ fontWeight: 600 }}>Community</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><button className="hover:text-primary transition-colors">About Us</button></li>
                <li><button className="hover:text-primary transition-colors">Support</button></li>
                <li><button className="hover:text-primary transition-colors">Contact</button></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border pt-8 mt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
              <p>© 2025 PawfectMatch. All rights reserved.</p>
              <div className="flex gap-6">
                <button className="hover:text-primary transition-colors">Privacy Policy</button>
                <button className="hover:text-primary transition-colors">Terms of Service</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}