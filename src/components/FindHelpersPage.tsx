import React, { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Star, MapPin, Clock, DollarSign, Search, Filter, ArrowLeft, Check, Heart, MessageSquare, Shield } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface FindHelpersPageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

interface Helper {
  id: number;
  name: string;
  image: string;
  rating: number;
  reviewCount: number;
  location: string;
  services: string[];
  hourlyRate: string;
  experience: string;
  availability: string;
  verified: boolean;
  responseTime: string;
  completedTasks: number;
  bio: string;
  specialties: string[];
}

export function FindHelpersPage({ onNavigate }: FindHelpersPageProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<number[]>([]);

  const helpers: Helper[] = [
    {
      id: 1,
      name: "Sarah Mitchell",
      image: "https://images.unsplash.com/photo-1565069859254-6248c5a4bc67?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmllbmRseSUyMHBlcnNvbiUyMHNtaWxpbmd8ZW58MXx8fHwxNzYyODAwNjg1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      rating: 4.9,
      reviewCount: 127,
      location: "Central Park, NY",
      services: ["Dog Walking", "Pet Sitting"],
      hourlyRate: "$20-25",
      experience: "5 years",
      availability: "Mon-Fri, Mornings",
      verified: true,
      responseTime: "< 1 hour",
      completedTasks: 340,
      bio: "Passionate dog lover with 5 years of professional experience. I treat every pet like my own!",
      specialties: ["Large breeds", "Puppies", "Senior dogs"],
    },
    {
      id: 2,
      name: "James Parker",
      image: "https://images.unsplash.com/photo-1603478811096-ed294448b878?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXBweSUyMG1hbiUyMG91dGRvb3J8ZW58MXx8fHwxNzYyODAwNjg2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      rating: 5.0,
      reviewCount: 89,
      location: "Brooklyn Heights",
      services: ["Dog Walking", "Pet Boarding", "Training"],
      hourlyRate: "$25-30",
      experience: "7 years",
      availability: "Weekends, Flexible",
      verified: true,
      responseTime: "< 30 min",
      completedTasks: 256,
      bio: "Certified dog trainer specializing in positive reinforcement. Your furry friend is in great hands!",
      specialties: ["Training", "Behavioral issues", "Active dogs"],
    },
    {
      id: 3,
      name: "Emily Rodriguez",
      image: "https://images.unsplash.com/photo-1704054006064-2c5b922e7a1e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHdvbWFuJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzYyNzQ3NzQ2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      rating: 4.8,
      reviewCount: 215,
      location: "Manhattan, NY",
      services: ["Cat Feeding", "Pet Sitting", "Small Animals"],
      hourlyRate: "$18-22",
      experience: "4 years",
      availability: "Evenings, Weekends",
      verified: true,
      responseTime: "< 2 hours",
      completedTasks: 412,
      bio: "Cat enthusiast with experience caring for all types of small pets. Gentle, reliable, and loving!",
      specialties: ["Cats", "Rabbits", "Guinea pigs"],
    },
    {
      id: 4,
      name: "Michael Chen",
      image: "https://images.unsplash.com/photo-1536914307996-bcef0f608f2f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXN1YWwlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NjI2ODY4MDR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      rating: 4.9,
      reviewCount: 178,
      location: "Queens, NY",
      services: ["Pet Boarding", "Dog Walking", "Pet Sitting"],
      hourlyRate: "$22-28",
      experience: "6 years",
      availability: "Full-time",
      verified: true,
      responseTime: "< 1 hour",
      completedTasks: 521,
      bio: "Full-time pet care professional with a spacious backyard. Your pets will have the best vacation!",
      specialties: ["Multi-pet households", "Long-term boarding", "Special needs"],
    },
    {
      id: 5,
      name: "Jessica Williams",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjB3b21hbnxlbnwxfHx8fDE3NjI3MDE3ODN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      rating: 5.0,
      reviewCount: 94,
      location: "Upper East Side",
      services: ["Cat Feeding", "Pet Sitting", "Grooming"],
      hourlyRate: "$20-24",
      experience: "3 years",
      availability: "Mornings, Evenings",
      verified: true,
      responseTime: "< 30 min",
      completedTasks: 187,
      bio: "Former veterinary assistant who loves pampering pets. Experienced with medications and special care.",
      specialties: ["Medical care", "Senior pets", "Grooming"],
    },
    {
      id: 6,
      name: "David Thompson",
      image: "https://images.unsplash.com/photo-1603478811096-ed294448b878?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXBweSUyMG1hbiUyMG91dGRvb3J8ZW58MXx8fHwxNzYyODAwNjg2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
      rating: 4.7,
      reviewCount: 156,
      location: "Bronx, NY",
      services: ["Dog Walking", "Training", "Exercise"],
      hourlyRate: "$18-23",
      experience: "4 years",
      availability: "Afternoons, Weekends",
      verified: false,
      responseTime: "< 3 hours",
      completedTasks: 289,
      bio: "Active outdoor enthusiast who loves hiking with dogs. Perfect for high-energy pups!",
      specialties: ["Exercise", "Outdoor activities", "Athletic dogs"],
    },
  ];

  const filters = [
    { id: "all", label: "All Services" },
    { id: "walking", label: "Dog Walking" },
    { id: "sitting", label: "Pet Sitting" },
    { id: "boarding", label: "Pet Boarding" },
    { id: "feeding", label: "Cat Feeding" },
    { id: "training", label: "Training" },
  ];

  const filteredHelpers = helpers.filter((helper) => {
    const matchesSearch = helper.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         helper.bio.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === "all" || 
                         helper.services.some(s => s.toLowerCase().includes(selectedFilter));
    return matchesSearch && matchesFilter;
  });

  const toggleFavorite = (id: number) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(fav => fav !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen pt-24 pb-24 px-4">
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onNavigate("landing")}
            className="hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-primary" style={{ fontWeight: 700, fontSize: '40px' }}>
              Find Helpers
            </h1>
            <p className="text-muted-foreground mt-1">
              Connect with trusted pet care professionals in your area
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by name, location, or specialties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 h-12 bg-white border-2 border-border focus-visible:border-primary transition-colors"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {filters.map((filter) => (
              <Button
                key={filter.id}
                variant={selectedFilter === filter.id ? "default" : "outline"}
                onClick={() => setSelectedFilter(filter.id)}
                className={`whitespace-nowrap transition-all ${
                  selectedFilter === filter.id
                    ? "bg-primary text-white shadow-md"
                    : "hover:bg-primary/10 hover:text-primary hover:border-primary"
                }`}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6 flex items-center justify-between">
          <p className="text-muted-foreground">
            Showing <span className="text-foreground">{filteredHelpers.length}</span> helpers
          </p>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            More Filters
          </Button>
        </div>

        {/* Helpers Grid */}
        {filteredHelpers.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mb-4 mx-auto">
              <Search className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-primary mb-2" style={{ fontWeight: 600, fontSize: '20px' }}>
              No helpers found
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Try adjusting your search or filters to find the perfect helper for your pet
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredHelpers.map((helper) => (
              <Card
                key={helper.id}
                className="overflow-hidden hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/30 cursor-pointer group"
                onClick={() => onNavigate("profile")}
              >
                <div className="p-6">
                  {/* Header with Avatar and Basic Info */}
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar className="w-20 h-20 border-4 border-primary/20 shadow-md group-hover:border-primary/40 transition-colors">
                      <AvatarImage src={helper.image} alt={helper.name} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-white text-xl">
                        {helper.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-primary truncate" style={{ fontWeight: 700, fontSize: '20px' }}>
                              {helper.name}
                            </h3>
                            {helper.verified && (
                              <div className="relative group/badge">
                                <Shield className="w-5 h-5 text-primary fill-primary/20" />
                                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover/badge:opacity-100 transition-opacity pointer-events-none">
                                  Verified Helper
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mb-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span style={{ fontWeight: 600 }}>{helper.rating}</span>
                            <span className="text-muted-foreground text-sm">
                              ({helper.reviewCount} reviews)
                            </span>
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(helper.id);
                          }}
                          className="hover:bg-primary/10 transition-colors flex-shrink-0"
                        >
                          <Heart
                            className={`w-5 h-5 transition-all ${
                              favorites.includes(helper.id)
                                ? "fill-red-500 text-red-500"
                                : "text-muted-foreground hover:text-red-500"
                            }`}
                          />
                        </Button>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <MapPin className="w-4 h-4" />
                        <span>{helper.location}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {helper.bio}
                  </p>

                  {/* Services Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {helper.services.map((service, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className="border-primary/30 text-primary bg-primary/5"
                      >
                        {service}
                      </Badge>
                    ))}
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-secondary/20 rounded-lg">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <DollarSign className="w-4 h-4" />
                        <span>Hourly Rate</span>
                      </div>
                      <p style={{ fontWeight: 600 }}>{helper.hourlyRate}/hr</p>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Clock className="w-4 h-4" />
                        <span>Response Time</span>
                      </div>
                      <p style={{ fontWeight: 600 }}>{helper.responseTime}</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Check className="w-4 h-4" />
                        <span>Experience</span>
                      </div>
                      <p style={{ fontWeight: 600 }}>{helper.experience}</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Star className="w-4 h-4" />
                        <span>Tasks Done</span>
                      </div>
                      <p style={{ fontWeight: 600 }}>{helper.completedTasks}</p>
                    </div>
                  </div>

                  {/* Availability */}
                  <div className="mb-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="text-sm text-primary" style={{ fontWeight: 600 }}>
                        Available
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{helper.availability}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate("messages", { selectedUserId: helper.id });
                      }}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Contact
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 hover:bg-primary/10 hover:text-primary hover:border-primary transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate("profile");
                      }}
                    >
                      View Profile
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}