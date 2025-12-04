import React, { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Star, MapPin, Clock, DollarSign, Search, Filter, PawPrint, ArrowLeft } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { EmptyState } from "./EmptyState";

interface TasksPageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

export function TasksPage({ onNavigate }: TasksPageProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  const tasks = [
    {
      id: 1,
      title: "Daily Dog Walking",
      type: "Walk",
      image: "https://images.unsplash.com/photo-1754318245375-5fe3699a286c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXBweSUyMGRvZyUyMG91dGRvb3JzfGVufDF8fHx8MTc2MDM5MzEzMnww&ixlib=rb-4.1.0&q=80&w=1080",
      pet: "Max (Golden Retriever)",
      location: "Central Park, NY",
      time: "Morning (8-10am)",
      reward: "$25",
      rating: 4.9,
    },
    {
      id: 2,
      title: "Cat Feeding & Play",
      type: "Feed",
      image: "https://images.unsplash.com/photo-1623963946854-6c78dd7af766?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXRlJTIwY2F0JTIwcG9ydHJhaXR8ZW58MXx8fHwxNzYwMjY4MzgyfDA&ixlib=rb-4.1.0&q=80&w=1080",
      pet: "Luna (Persian Cat)",
      location: "Brooklyn Heights",
      time: "Evening (6-8pm)",
      reward: "$20",
      rating: 5.0,
    },
    {
      id: 3,
      title: "Weekend Pet Sitting",
      type: "Boarding",
      image: "https://images.unsplash.com/photo-1633722715463-d30f4f325e24?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnb2xkZW4lMjByZXRyaWV2ZXJ8ZW58MXx8fHwxNzYwMjk2MjI1fDA&ixlib=rb-4.1.0&q=80&w=1080",
      pet: "Bella (Labrador)",
      location: "Manhattan, NY",
      time: "Sat-Sun (Full Day)",
      reward: "$120",
      rating: 4.8,
    },
    {
      id: 4,
      title: "Afternoon Dog Walk",
      type: "Walk",
      image: "https://images.unsplash.com/photo-1574144113084-b6f450cc5e0c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmllbmRseSUyMGNvcmdpfGVufDF8fHx8MTc2MDM5MzEzNHww&ixlib=rb-4.1.0&q=80&w=1080",
      pet: "Charlie (Corgi)",
      location: "Queens, NY",
      time: "Afternoon (2-4pm)",
      reward: "$22",
      rating: 4.7,
    },
    {
      id: 5,
      title: "Morning Cat Care",
      type: "Feed",
      image: "https://images.unsplash.com/photo-1589872267076-a0859175685b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0YWJieSUyMGNhdHxlbnwxfHx8fDE3NjAzNjE4OTh8MA&ixlib=rb-4.1.0&q=80&w=1080",
      pet: "Whiskers (Tabby)",
      location: "Bronx, NY",
      time: "Morning (7-9am)",
      reward: "$18",
      rating: 4.9,
    },
    {
      id: 6,
      title: "Evening Dog Walking",
      type: "Walk",
      image: "https://images.unsplash.com/photo-1754318245375-5fe3699a286c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXBweSUyMGRvZyUyMG91dGRvb3JzfGVufDF8fHx8MTc2MDM5MzEzMnww&ixlib=rb-4.1.0&q=80&w=1080",
      pet: "Rocky (German Shepherd)",
      location: "Staten Island, NY",
      time: "Evening (7-9pm)",
      reward: "$28",
      rating: 5.0,
    },
  ];

  const filters = [
    { id: "all", label: "All Tasks" },
    { id: "walk", label: "Walk" },
    { id: "feed", label: "Feed" },
    { id: "boarding", label: "Boarding" },
  ];

  const filteredTasks = selectedFilter === "all" 
    ? tasks 
    : tasks.filter(task => task.type.toLowerCase() === selectedFilter);

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
            onAction={() => setSelectedFilter("all")}
          />
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTasks.map((task) => (
              <Card 
                key={task.id}
                className="group overflow-hidden hover:shadow-2xl transition-all cursor-pointer border-0 shadow-md hover:-translate-y-2 duration-300"
                onClick={() => onNavigate('task-detail')}
              >
                <div className="aspect-square relative overflow-hidden">
                  <ImageWithFallback
                    src={task.image}
                    alt={task.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1 shadow-md">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm" style={{ fontWeight: 600 }}>{task.rating}</span>
                  </div>
                  <div className="absolute top-3 left-3">
                    <Badge 
                      className={`text-white shadow-md ${
                        task.type === 'Walk' ? 'bg-primary' : 
                        task.type === 'Feed' ? 'bg-accent' : 
                        'bg-chart-5'
                      }`}
                      style={{ fontWeight: 600 }}
                    >
                      {task.type}
                    </Badge>
                  </div>
                </div>
                <div className="p-5 space-y-3 bg-white">
                  <div>
                    <h3 style={{ fontWeight: 600 }} className="mb-1 group-hover:text-primary transition-colors">{task.title}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <PawPrint className="w-3 h-3" />
                      {task.pet}
                    </p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span className="truncate">{task.location}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4 text-primary" />
                      {task.time}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <span className="text-primary" style={{ fontWeight: 700, fontSize: '18px' }}>{task.reward}</span>
                      <div className="text-xs text-muted-foreground">per task</div>
                    </div>
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