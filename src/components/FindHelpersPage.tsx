import { useState, useEffect, useCallback } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Star, MapPin, Clock, DollarSign, Search, ArrowLeft, Check, Heart, MessageSquare, Shield } from "lucide-react";
import { useUser } from "../contexts/UserContext";
import { toast } from "sonner";
import { api } from "../lib/api";
import type { User } from "../contexts/UserContext";

interface FindHelpersPageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

// Backend User type for helpers
interface HelperUser extends User {
  _id: string;
  createdAt?: string;
  helperRating?: number;
  ownerRating?: number;
}

// UI Helper interface for display
interface Helper {
  _id: string;
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
  const [favorites, setFavorites] = useState<string[]>([]); // Changed to string[] for _id
  const [helpers, setHelpers] = useState<Helper[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useUser();

  const filters = [
    { id: "all", label: "All Services" },
    { id: "walking", label: "Dog Walking" },
    { id: "sitting", label: "Pet Sitting" },
    { id: "boarding", label: "Pet Boarding" },
    { id: "feeding", label: "Cat Feeding" },
    { id: "training", label: "Training" },
  ];

  // Load helpers from backend
  useEffect(() => {
    loadHelpers();
  }, []);

  const loadHelpers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get<HelperUser[]>('/users/helpers');
      if (response.success && response.data) {
        const helperUsers = Array.isArray(response.data) ? response.data : [];
        // Map backend User data to UI Helper format
        const mappedHelpers: Helper[] = helperUsers.map((user) => {
          // Calculate experience from createdAt
          const yearsSinceJoin = user.createdAt
            ? Math.floor((new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 365))
            : 0;
          const experience = yearsSinceJoin > 0 ? `${yearsSinceJoin} year${yearsSinceJoin > 1 ? 's' : ''}` : 'New helper';

          // Default services based on available task types (could be enhanced)
          const defaultServices = ["Dog Walking", "Pet Sitting", "Pet Boarding"];
          
          // Use profilePhoto or default image
          const image = user.profilePhoto || 'https://images.unsplash.com/photo-1565069859254-6248c5a4bc67?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080';

          // Debug: log user data to check helperRating
          console.log(`FindHelpersPage - User ${user.name}:`, {
            helperRating: user.helperRating,
            ownerRating: user.ownerRating,
            fullUser: user
          });

          return {
            _id: user._id,
            name: user.name,
            image,
            rating: (user.helperRating !== undefined && user.helperRating !== null && user.helperRating > 0) ? user.helperRating : 0, // Use actual helperRating from backend
            reviewCount: 0, // Default - can be fetched from reviews in future
            location: "", // Default - could be added to user model later
            services: defaultServices, // Default - could be derived from task types
            hourlyRate: "$20-25", // Default - could be added to user model
            experience,
            availability: "Flexible", // Default - could be added to user model
            verified: false, // Default - could be based on account verification
            responseTime: "< 2 hours", // Default - could be calculated from response times
            completedTasks: 0, // Default - could be calculated from tasks
            bio: user.bio || "No bio added yet.",
            specialties: [], // Default - could be added to user model
          };
        });
        setHelpers(mappedHelpers);
      } else {
        toast.error(response.message || "Failed to load helpers");
        setHelpers([]);
      }
    } catch (error) {
      console.error('Failed to load helpers:', error);
      toast.error("Failed to load helpers. Please try again.");
      setHelpers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredHelpers = helpers.filter((helper) => {
    const matchesSearch = helper.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         helper.bio.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === "all" || 
                         helper.services.some(s => s.toLowerCase().includes(selectedFilter));
    return matchesSearch && matchesFilter;
  });

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(fav => fav !== id) : [...prev, id]
    );
  };

  const handleViewProfile = (helperId: string) => {
    if (!isAuthenticated) {
      toast.error("Please log in to view profiles.");
      onNavigate("auth");
      return;
    }
    // Navigate to public helper profile with helperId
    onNavigate("helper-public-profile", { helperId });
  };

  const handleContact = (helperId: string) => {
    if (!isAuthenticated) {
      toast.error("Please log in to contact helpers.");
      onNavigate("auth");
      return;
    }
    onNavigate("messages", { selectedUserId: helperId });
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
        <div className="mb-6">
          <p className="text-muted-foreground">
            Showing <span className="text-foreground">{filteredHelpers.length}</span> helpers
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <Card className="p-12 text-center">
            <div className="text-muted-foreground">Loading helpers...</div>
          </Card>
        ) : filteredHelpers.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mb-4 mx-auto">
              <Search className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-primary mb-2" style={{ fontWeight: 600, fontSize: '20px' }}>
              No helpers found
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {helpers.length === 0
                ? "No helpers are currently available. Check back later!"
                : "Try adjusting your search or filters to find the perfect helper for your pet"}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredHelpers.map((helper) => (
              <Card
                key={helper._id}
                className="overflow-hidden hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/30 cursor-pointer group"
                onClick={() => handleViewProfile(helper._id)}
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
                            <span style={{ fontWeight: 600 }}>
                              {helper.rating && helper.rating > 0 ? helper.rating.toFixed(1) : '—'}
                            </span>
                            {helper.reviewCount > 0 && (
                              <span className="text-muted-foreground text-sm">
                                ({helper.reviewCount} reviews)
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                            e.stopPropagation();
                            toggleFavorite(helper._id);
                          }}
                          className="hover:bg-primary/10 transition-colors flex-shrink-0"
                        >
                          <Heart
                            className={`w-5 h-5 transition-all ${
                              favorites.includes(helper._id)
                                ? "fill-red-500 text-red-500"
                                : "text-muted-foreground hover:text-red-500"
                            }`}
                          />
                        </Button>
                      </div>

                      {helper.location && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <MapPin className="w-4 h-4" />
                          <span>{helper.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {helper.bio}
                  </p>

                  {/* Services Tags */}
                  {helper.services.length > 0 && (
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
                  )}

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
                  {helper.availability && (
                    <div className="mb-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-primary" />
                        <span className="text-sm text-primary" style={{ fontWeight: 600 }}>
                          Available
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{helper.availability}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg transition-all"
                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                        e.stopPropagation();
                        handleContact(helper._id);
                      }}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Contact
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 hover:bg-primary/10 hover:text-primary hover:border-primary transition-all"
                      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                        e.stopPropagation();
                        handleViewProfile(helper._id);
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
