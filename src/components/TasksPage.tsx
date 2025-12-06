import React, { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Star, MapPin, Clock, DollarSign, Search, Filter, PawPrint, ArrowLeft } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { EmptyState } from "./EmptyState";
import { api } from "../lib/api";
import { toast } from "sonner";

interface TasksPageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

interface Task {
  _id: string;
  title: string;
  type: string;
  image?: string;
  pet?: {
    _id: string;
    name: string;
    type: string;
    photos?: string[];
  };
  location: string;
  time?: string;
  date?: string;
  reward?: string;
  budget?: number;
  postedBy?: {
    _id: string;
    name: string;
    profilePhoto?: string;
    ownerRating?: number;
  };
  status: string;
}

export function TasksPage({ onNavigate }: TasksPageProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const response = await api.get<Task[]>("/tasks");
      if (response.success && response.data) {
        setTasks(response.data);
      } else {
        toast.error("Failed to load tasks");
      }
    } catch (error) {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  const filters = [
    { id: "all", label: "All Tasks" },
    { id: "walk", label: "Walk" },
    { id: "feed", label: "Feed" },
    { id: "boarding", label: "Boarding" },
    { id: "sitting", label: "Sitting" },
  ];

  // Filter tasks
  let filteredTasks = tasks;
  
  // Filter by type
  if (selectedFilter !== "all") {
    filteredTasks = filteredTasks.filter(task => task.type.toLowerCase() === selectedFilter);
  }
  
  // Filter by search query
  if (searchQuery) {
    filteredTasks = filteredTasks.filter(task =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.pet?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
  
  // Only show open tasks
  filteredTasks = filteredTasks.filter(task => task.status === "open");

  // Format rating for display
  const formatRating = (rating?: number): string => {
    if (rating === undefined || rating === null || rating === 0) {
      return 'No rating';
    }
    return rating.toFixed(1);
  };

  // Format task display
  const formatTaskForDisplay = (task: Task) => {
    const petDisplay = task.pet 
      ? `${task.pet.name}${task.pet.type ? ` (${task.pet.type})` : ''}`
      : 'Pet';
    
    const imageUrl = task?.pet?.photos?.[0] ?? "https://placehold.co/600x400?text=No+Pet+Photo";
    
    // Format reward to ensure only one dollar sign
    const formatRewardDisplay = (reward?: string, budget?: number): string => {
      if (reward) {
        // Remove all $ signs and add one
        const numericValue = reward.replace(/[^0-9.]/g, '');
        return numericValue ? `$${numericValue}` : '$0';
      }
      if (budget) {
        return `$${budget}`;
      }
      return '$0';
    };
    
    const rewardDisplay = formatRewardDisplay(task.reward, task.budget);
    
    const timeDisplay = task.time || task.date 
      ? task.time || new Date(task.date || '').toLocaleDateString()
      : 'Flexible';
    
    // Capitalize first letter of type
    const typeDisplay = task.type ? task.type.charAt(0).toUpperCase() + task.type.slice(1) : 'Task';
    
    // Get owner's rating (average from reviews)
    const ownerRating = task.postedBy?.ownerRating;
    
    return {
      id: task._id,
      title: task.title,
      type: typeDisplay,
      image: imageUrl,
      pet: petDisplay,
      location: task.location,
      time: timeDisplay,
      reward: rewardDisplay,
      rating: formatRating(ownerRating),
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-24 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-muted-foreground">Loading tasks...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-24 px-4">
      <div className="max-w-[1200px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => onNavigate('landing')}
            className="mb-4 -ml-2 text-muted-foreground hover:text-primary hover:bg-primary/5"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
          </Button>
          <h1 className="text-primary mb-4" style={{ fontWeight: 700, fontSize: '40px' }}>Browse Pet Care Tasks</h1>
          <p className="text-muted-foreground">
            Find the perfect pet care opportunity in your area
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                placeholder="Search tasks by keyword or location..."
                className="pl-10 bg-white border-border"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon" className="shrink-0">
              <Filter className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <Badge
                key={filter.id}
                variant={selectedFilter === filter.id ? "default" : "outline"}
                className={`cursor-pointer px-4 py-2 ${
                  selectedFilter === filter.id 
                    ? "bg-primary text-white hover:bg-primary/90" 
                    : "hover:bg-primary/10"
                }`}
                onClick={() => setSelectedFilter(filter.id)}
              >
                {filter.label}
              </Badge>
            ))}
          </div>
        </div>

        {/* Tasks Grid */}
        {filteredTasks.length === 0 ? (
          <EmptyState
            icon={PawPrint}
            title="No tasks yet — time to find your pawfect match!"
            description="Try adjusting your filters or check back later for new pet care opportunities in your area."
            actionLabel="Clear Filters"
            onAction={() => {
              setSelectedFilter("all");
              setSearchQuery("");
            }}
          />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTasks.map((task) => {
              const displayTask = formatTaskForDisplay(task);
              return (
                <Card 
                  key={task._id}
                  className="group overflow-hidden hover:shadow-2xl transition-all cursor-pointer border-0 shadow-md hover:-translate-y-2 duration-300"
                  onClick={() => onNavigate('task-detail', { taskId: task._id })}
                >
                  <div className="aspect-square relative overflow-hidden">
                    <ImageWithFallback
                      src={displayTask.image}
                      alt={displayTask.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1 shadow-md">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm" style={{ fontWeight: 600 }}>{displayTask.rating}</span>
                    </div>
                    <div className="absolute top-3 left-3">
                      <Badge 
                        className={`text-white shadow-md ${
                          displayTask.type === 'Walk' ? 'bg-primary' : 
                          displayTask.type === 'Feed' ? 'bg-accent' : 
                          'bg-chart-5'
                        }`}
                        style={{ fontWeight: 600 }}
                      >
                        {displayTask.type}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-5 space-y-3 bg-white">
                    <div>
                      <h3 style={{ fontWeight: 600 }} className="mb-1 group-hover:text-primary transition-colors">{displayTask.title}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <PawPrint className="w-3 h-3" />
                        {displayTask.pet}
                      </p>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-4 h-4 text-primary" />
                          <span className="truncate">{displayTask.location}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4 text-primary" />
                        {displayTask.time}
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-border">
                        <span className="text-primary" style={{ fontWeight: 700, fontSize: '18px' }}>{displayTask.reward}</span>
                        <div className="text-xs text-muted-foreground">per task</div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
