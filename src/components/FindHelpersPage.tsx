import { useState, useEffect, useCallback } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Star, MapPin, Clock, DollarSign, Search, ArrowLeft, Heart, MessageSquare, Shield, User } from "lucide-react";
import { useUser } from "../contexts/UserContext";
import { toast } from "sonner";
import { api } from "../lib/api";
import type { User as UserType } from "../contexts/UserContext";
import { FIND_HELPERS_FILTERS } from "../lib/constants";
import { EmptyState } from "./EmptyState";

interface FindHelpersPageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

// Backend User type for helpers
interface HelperUser extends UserType {
  _id: string;
  createdAt?: string;
  helperRating?: number;
  ownerRating?: number;
  specialties?: string[];
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
  availability: string;
  verified: boolean;
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

  const filters = FIND_HELPERS_FILTERS;

  // Load helpers and tasks from backend
  useEffect(() => {
    loadHelpers();
  }, []);

  const loadHelpers = useCallback(async () => {
    setLoading(true);
    try {
      // Load both helpers and tasks in parallel
      const [helpersResponse, tasksResponse] = await Promise.all([
        api.get<HelperUser[]>('/users/helpers'),
        api.get<any[]>('/tasks')
      ]);

      let tasks: any[] = [];
      if (tasksResponse.success && tasksResponse.data) {
        tasks = Array.isArray(tasksResponse.data) ? tasksResponse.data : [];
      }

      if (helpersResponse.success && helpersResponse.data) {
        const helperUsers = Array.isArray(helpersResponse.data) ? helpersResponse.data : [];
        // Map backend User data to UI Helper format (with real review counts)
        const mappedHelpers: Helper[] = await Promise.all(helperUsers.map(async (user) => {
          // Use profilePhoto or empty string (Avatar will show fallback with initials)
          const image = user.profilePhoto || '';

          // Debug: log user data to check helperRating and specialties
          console.log(`FindHelpersPage - User ${user.name}:`, {
            helperRating: user.helperRating,
            ownerRating: user.ownerRating,
            profilePhoto: user.profilePhoto,
            specialties: user.specialties,
            fullUser: user
          });

          // Fetch reviews count for helper to match profile display
          let reviewCount = 0;
          try {
            const reviewsResponse = await api.get(`/users/${user._id}/reviews?role=helper`);
            if (reviewsResponse.success && reviewsResponse.data) {
              reviewCount = Array.isArray(reviewsResponse.data) ? reviewsResponse.data.length : 0;
            }
          } catch (error) {
            console.error(`Failed to fetch reviews for helper ${user.name}:`, error);
          }

          // Calculate completed tasks: only count tasks that are actually assigned to this helper and completed
          const completedTasks = tasks.filter(task => {
            if (!task.assignedTo) return false;
            const assignedToId = task.assignedTo._id 
              ? (typeof task.assignedTo._id === 'string' ? task.assignedTo._id : String(task.assignedTo._id))
              : (typeof task.assignedTo === 'string' ? task.assignedTo : String(task.assignedTo));
            const userId = typeof user._id === 'string' ? user._id : String(user._id);
            return assignedToId === userId && task.status === 'completed';
          }).length;

          // Use specialties from user, same as HelperPublicProfilePage
          const services = (user.specialties && Array.isArray(user.specialties) && user.specialties.length > 0)
            ? user.specialties
            : [];

          return {
            _id: user._id,
            name: user.name || 'Unknown Helper',
            image,
            rating: (user.helperRating !== undefined && user.helperRating !== null && user.helperRating > 0) ? user.helperRating : 0, // Use actual helperRating from backend
            reviewCount,
            location: user.location || "", // Use actual location from user model
            services, // Use specialties from user model, same as helper profile
            hourlyRate: '—',
            availability: "Flexible", // Default - could be added to user model
            verified: false, // Default - could be based on account verification
            completedTasks, // Calculate from actual tasks
            bio: (user.bio && user.bio.trim()) || "No bio added yet.",
            specialties: user.specialties || [], // Store specialties for consistency
          };
        }));
        setHelpers(mappedHelpers);
      } else {
        toast.error(helpersResponse.message || "Failed to load helpers");
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
                         helper.services.some(s => s.toLowerCase() === selectedFilter);
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
        <div className="mb-6 flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onNavigate("landing")}
              className="hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-primary" style={{ fontWeight: 700, fontSize: '40px' }}>
              Find Helpers
            </h1>
          </div>
          <p className="text-muted-foreground">
            Connect with trusted pet care professionals in your area
          </p>
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
                className="overflow-hidden hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/30 cursor-pointer group flex flex-col"
                onClick={() => handleViewProfile(helper._id)}
              >
                <div className="p-6 flex flex-col h-full space-y-4">
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

                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2 min-h-[20px]">
                        <MapPin className={`w-4 h-4 ${helper.location ? '' : 'opacity-0'}`} />
                        <span>{helper.location || ' '}</span>
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                    {helper.bio}
                  </p>

                  {/* Services Tags */}
                  {helper.services.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
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
                  ) : (
                    <div className="h-8" />
                  )}

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-secondary/20 rounded-lg">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Star className="w-4 h-4" />
                        <span>Reviews</span>
                      </div>
                      <p style={{ fontWeight: 600 }}>{helper.reviewCount ?? '—'}</p>
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
                    <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-primary" />
                        <span className="text-sm text-primary" style={{ fontWeight: 600 }}>
                          Available
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{helper.availability}</p>
                    </div>
                  )}

                  {/* Spacer to push buttons to the bottom for consistent alignment */}
                  <div className="flex-1" />

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
