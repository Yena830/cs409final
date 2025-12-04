import React, { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Star, MapPin, Shield, Edit, Heart, MessageCircle, Calendar, CheckCircle2, TrendingUp, Clock, PawPrint, Award, Briefcase, ArrowLeft } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { EmptyState } from "./EmptyState";
import { EditProfileDialog } from "./EditProfileDialog";
import { PetFormDialog } from "./PetFormDialog";
import { HelperDetailsDialog } from "./HelperDetailsDialog";
import { ApplicantsDialog } from "./ApplicantsDialog";
import { toast } from "sonner@2.0.3";

import { Users } from "lucide-react";
import { User } from "lucide-react";

interface ProfilePageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
  userType?: 'owner' | 'helper';
}

interface Pet {
  id?: number;
  name: string;
  type: string;
  breed: string;
  age: string;
  height: string;
  weight: string;
  temperament: string;
  image: string;
}

interface ProfileData {
  username: string;
  bio: string;
  location: string;
  profilePhoto: string;
}

interface HelperDetails {
  experience: string;
  certifications: string[];
  specialties: string[];
}

export function ProfilePage({ onNavigate, userType = 'owner' }: ProfilePageProps) {
  // Profile data
  const [profileData, setProfileData] = useState<ProfileData>({
    username: "John Doe",
    bio: userType === 'owner' 
      ? "Proud owner of a wonderful Golden Retriever. Looking for reliable helpers in my local community."
      : "Pet lover with 5+ years of experience caring for dogs and cats. I'm passionate about animals and committed to providing excellent care. Available for walking, feeding, and boarding services.",
    location: "New York, NY",
    profilePhoto: "",
  });

  // Helper-specific data
  const [helperDetails, setHelperDetails] = useState<HelperDetails>({
    experience: "5+ years of professional pet care experience. I've worked with various breeds and temperaments, from energetic puppies to senior pets needing special care.",
    certifications: ["Pet First Aid Certified", "Professional Dog Walker Certification"],
    specialties: ["Dog Walking", "Cat Sitting", "Pet Boarding", "Senior Pet Care"],
  });

  // Pets data (for owners)
  const [myPets, setMyPets] = useState<Pet[]>([
    {
      id: 1,
      name: "Max",
      type: "dog",
      breed: "Golden Retriever",
      age: "3 years",
      height: "24 inches",
      weight: "65 lbs",
      temperament: "Friendly, energetic, loves playing fetch and meeting new people. Well-trained and great with children.",
      image: "https://images.unsplash.com/photo-1633722715463-d30f4f325e24?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnb2xkZW4lMjByZXRyaWV2ZXJ8ZW58MXx8fHwxNzYwMjk2MjI1fDA&ixlib=rb-4.1.0&q=80&w=1080",
    },
  ]);

  // Dialogs state
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [petFormOpen, setPetFormOpen] = useState(false);
  const [helperDetailsOpen, setHelperDetailsOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [applicantsDialogOpen, setApplicantsDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<typeof ownerTasks[0] | null>(null);

  // Mock applicants data
  const mockApplicants = [
    {
      id: 1,
      name: "Sarah Johnson",
      avatar: "",
      rating: 4.9,
      reviewCount: 24,
      location: "New York, NY",
      tasksCompleted: 38,
      responseRate: 98,
      verified: true,
      experience: "3+ years",
      certifications: ["Pet First Aid Certified", "Professional Dog Walker"],
      introduction: "I'm a passionate pet lover with over 3 years of experience caring for dogs of all sizes and breeds. I treat every pet as if they were my own and always ensure they get plenty of exercise, love, and attention."
    },
    {
      id: 2,
      name: "Mike Chen",
      avatar: "",
      rating: 4.8,
      reviewCount: 19,
      location: "Brooklyn, NY",
      tasksCompleted: 27,
      responseRate: 95,
      verified: true,
      experience: "2+ years",
      certifications: ["Pet Care Professional"],
      introduction: "Former veterinary assistant with a deep understanding of pet behavior and needs. I'm reliable, punctual, and committed to providing the best care for your furry friends."
    },
    {
      id: 3,
      name: "Emily Rodriguez",
      avatar: "",
      rating: 5.0,
      reviewCount: 31,
      location: "Manhattan, NY",
      tasksCompleted: 45,
      responseRate: 100,
      verified: true,
      experience: "5+ years",
      certifications: ["Pet First Aid Certified", "Professional Dog Walker", "Cat Behavior Specialist"],
      introduction: "Professional pet care specialist with extensive experience in both dogs and cats. I have a flexible schedule and am available for walks, feeding, and overnight stays. References available upon request."
    },
    {
      id: 4,
      name: "David Park",
      avatar: "",
      rating: 4.7,
      reviewCount: 15,
      location: "Queens, NY",
      tasksCompleted: 22,
      responseRate: 92,
      verified: false,
      experience: "1+ year",
      certifications: [],
      introduction: "Animal enthusiast and dog owner myself. I understand how important it is to find someone trustworthy to care for your pets. I'm friendly, responsible, and love spending time with animals."
    },
    {
      id: 5,
      name: "Jessica Williams",
      avatar: "",
      rating: 4.9,
      reviewCount: 28,
      location: "Brooklyn, NY",
      tasksCompleted: 41,
      responseRate: 97,
      verified: true,
      experience: "4+ years",
      certifications: ["Pet First Aid Certified", "Pet CPR Certified"],
      introduction: "Experienced pet sitter specializing in senior pets and those with special needs. I'm patient, caring, and have a calm demeanor that helps anxious pets feel comfortable and safe."
    }
  ];

  // Tasks data - different for owners and helpers
  const ownerTasks = [
    {
      id: 1,
      title: "Daily Dog Walking",
      type: "Posted",
      status: "Active",
      applications: 5,
      image: "https://images.unsplash.com/photo-1754318245375-5fe3699a286c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXBweSUyMGRvZyUyMG91dGRvb3JzfGVufDF8fHx8MTc2MDM5MzEzMnww&ixlib=rb-4.1.0&q=80&w=1080",
    },
    {
      id: 2,
      title: "Weekend Cat Sitting",
      type: "Posted",
      status: "Active",
      applications: 3,
      image: "https://images.unsplash.com/photo-1574144113084-b6f450cc5e0c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmllbmRseSUyMGNvcmdpfGVufDF8fHx8MTc2MDM5MzEzNHww&ixlib=rb-4.1.0&q=80&w=1080",
    },
    {
      id: 3,
      title: "Morning Pet Feeding",
      type: "Posted",
      status: "Completed",
      applications: 0,
      image: "https://images.unsplash.com/photo-1754318245375-5fe3699a286c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXBweSUyMGRvZyUyMG91dGRvb3JzfGVufDF8fHx8MTc2MDM5MzEzMnww&ixlib=rb-4.1.0&q=80&w=1080",
    },
  ];

  const helperTasks = [
    {
      id: 1,
      title: "Weekend Pet Sitting",
      type: "Applied",
      status: "Confirmed",
      date: "Nov 15-17",
      owner: "Sarah Johnson",
      image: "https://images.unsplash.com/photo-1574144113084-b6f450cc5e0c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmllbmRseSUyMGNvcmdpfGVufDF8fHx8MTc2MDM5MzEzNHww&ixlib=rb-4.1.0&q=80&w=1080",
    },
    {
      id: 2,
      title: "Daily Dog Walking",
      type: "Applied",
      status: "Pending",
      date: "Nov 12-30",
      owner: "Mike Chen",
      image: "https://images.unsplash.com/photo-1754318245375-5fe3699a286c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXBweSUyMGRvZyUyMG91dGRvb3JzfGVufDF8fHx8MTc2MDM5MzEzMnww&ixlib=rb-4.1.0&q=80&w=1080",
    },
    {
      id: 3,
      title: "Cat Feeding Service",
      type: "Applied",
      status: "Completed",
      date: "Nov 1-5",
      owner: "Emily Rodriguez",
      image: "https://images.unsplash.com/photo-1574144113084-b6f450cc5e0c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmllbmRseSUyMGNvcmdpfGVufDF8fHx8MTc2MDM5MzEzNHww&ixlib=rb-4.1.0&q=80&w=1080",
    },
  ];

  const myTasks = userType === 'owner' ? ownerTasks : helperTasks;

  const reviews = [
    {
      id: 1,
      author: "Emily R.",
      rating: 5,
      date: "Oct 10, 2025",
      comment: "Excellent care! Very reliable and Max loved spending time with them.",
    },
    {
      id: 2,
      author: "John D.",
      rating: 5,
      date: "Oct 5, 2025",
      comment: "Great communication and punctual. Would definitely recommend!",
    },
    {
      id: 3,
      author: "Sarah M.",
      rating: 4,
      date: "Sep 28, 2025",
      comment: "Very caring with pets. Did a wonderful job!",
    },
  ];

  const handleSaveProfile = (data: ProfileData) => {
    setProfileData(data);
  };

  const handleSavePet = (pet: Pet) => {
    if (pet.id) {
      // Update existing pet
      setMyPets(myPets.map(p => p.id === pet.id ? pet : p));
    } else {
      // Add new pet
      setMyPets([...myPets, { ...pet, id: Date.now() }]);
    }
  };

  const handleEditPet = (pet: Pet) => {
    setEditingPet(pet);
    setPetFormOpen(true);
  };

  const handleAddPet = () => {
    setEditingPet(null);
    setPetFormOpen(true);
  };

  const handleSaveHelperDetails = (data: HelperDetails) => {
    setHelperDetails(data);
  };

  const handleViewApplicants = (task: typeof ownerTasks[0]) => {
    setSelectedTask(task);
    setApplicantsDialogOpen(true);
  };

  const handleViewApplicantProfile = (applicantId: number) => {
    // Navigate to helper profile
    toast("Opening applicant profile...");
  };

  const handleConfirmHelper = (applicantId: number) => {
    const applicant = mockApplicants.find(a => a.id === applicantId);
    if (applicant) {
      toast(`✅ ${applicant.name} has been selected as your helper!`, {
        description: "They will be notified about your selection."
      });
    }
  };

  // Get applicants for the selected task
  const getApplicantsForTask = () => {
    if (!selectedTask) return [];
    
    // Return different applicants based on task id
    if (selectedTask.id === 1) {
      // Daily Dog Walking - 5 applicants
      return mockApplicants;
    } else if (selectedTask.id === 2) {
      // Weekend Cat Sitting - 3 applicants  
      return mockApplicants.slice(0, 3);
    } else {
      // Completed task - 0 applicants
      return [];
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-24 px-4">
      <div className="max-w-[1200px] mx-auto">
        {/* Back Button */}
        <button
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span>Back</span>
        </button>

        {/* Profile Header */}
        <Card className="p-8 mb-6 border-0 shadow-lg">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <Avatar className="w-32 h-32">
              <AvatarImage src={profileData.profilePhoto} alt={profileData.username} />
              <AvatarFallback className="bg-primary text-white text-3xl">
                {profileData.username.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-primary" style={{ fontWeight: 700, fontSize: '32px' }}>{profileData.username}</h1>
                  </div>
                  {userType === 'helper' && (
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                      <span style={{ fontWeight: 600 }}>4.9</span>
                      <span className="text-muted-foreground">(18 reviews)</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{profileData.location}</span>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="gap-2 hover:bg-primary/10 hover:border-primary hover:text-primary transition-all"
                  onClick={() => setEditProfileOpen(true)}
                >
                  <Edit className="w-4 h-4" />
                  Edit Profile
                </Button>
              </div>

              <p className="text-muted-foreground mb-6">
                {profileData.bio}
              </p>

              {userType === 'helper' ? (
                // Helper Stats
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="p-4 border-0 bg-secondary/30 hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="text-primary" style={{ fontWeight: 700, fontSize: '24px' }}>24</div>
                        <div className="text-xs text-muted-foreground">Tasks Done</div>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-4 border-0 bg-secondary/30 hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                        <TrendingUp className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <div className="text-accent" style={{ fontWeight: 700, fontSize: '24px' }}>98%</div>
                        <div className="text-xs text-muted-foreground">Response</div>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-4 border-0 bg-secondary/30 hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-chart-5/10 rounded-full flex items-center justify-center">
                        <Clock className="w-6 h-6 text-chart-5" />
                      </div>
                      <div>
                        <div className="text-chart-5" style={{ fontWeight: 700, fontSize: '24px' }}>2yr</div>
                        <div className="text-xs text-muted-foreground">Member</div>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-4 border-0 bg-secondary/30 hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center">
                        <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                      </div>
                      <div>
                        <div className="text-yellow-600" style={{ fontWeight: 700, fontSize: '24px' }}>4.9</div>
                        <div className="text-xs text-muted-foreground">Rating</div>
                      </div>
                    </div>
                  </Card>
                </div>
              ) : (
                // Owner Stats
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Card className="p-4 border-0 bg-secondary/30 hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <PawPrint className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="text-primary" style={{ fontWeight: 700, fontSize: '24px' }}>{myPets.length}</div>
                        <div className="text-xs text-muted-foreground">Pets</div>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-4 border-0 bg-secondary/30 hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                        <Briefcase className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <div className="text-accent" style={{ fontWeight: 700, fontSize: '24px' }}>5</div>
                        <div className="text-xs text-muted-foreground">Active Tasks</div>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-4 border-0 bg-secondary/30 hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-chart-5/10 rounded-full flex items-center justify-center">
                        <Clock className="w-6 h-6 text-chart-5" />
                      </div>
                      <div>
                        <div className="text-chart-5" style={{ fontWeight: 700, fontSize: '24px' }}>1yr</div>
                        <div className="text-xs text-muted-foreground">Member</div>
                      </div>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Helper Professional Details Section */}
        {userType === 'helper' && (
          <Card className="p-6 mb-6 border-0 shadow-lg">
            <div className="flex items-start justify-between mb-4">
              <h2 style={{ fontWeight: 600, fontSize: '20px' }}>Professional Details</h2>
              <Button 
                variant="outline" 
                size="sm"
                className="gap-2 hover:bg-primary/10 hover:border-primary hover:text-primary transition-all"
                onClick={() => setHelperDetailsOpen(true)}
              >
                <Edit className="w-4 h-4" />
                Edit
              </Button>
            </div>

            {/* Experience */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="w-5 h-5 text-primary" />
                <h3 style={{ fontWeight: 600 }}>Experience</h3>
              </div>
              <p className="text-muted-foreground ml-7">
                {helperDetails.experience || "No experience added yet"}
              </p>
            </div>

            {/* Service Specialties */}
            {helperDetails.specialties.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-5 h-5 text-primary" />
                  <h3 style={{ fontWeight: 600 }}>Service Specialties</h3>
                </div>
                <div className="flex flex-wrap gap-2 ml-7">
                  {helperDetails.specialties.map((specialty, index) => (
                    <Badge key={index} className="bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue={userType === 'owner' ? 'pets' : 'tasks'} className="w-full">
          <TabsList className={`grid w-full md:w-auto ${userType === 'owner' ? 'grid-cols-2' : 'grid-cols-2'} mb-6`}>
            {userType === 'owner' && <TabsTrigger value="pets">My Pets</TabsTrigger>}
            <TabsTrigger value="tasks">My Tasks</TabsTrigger>
            {userType === 'helper' && <TabsTrigger value="reviews">Reviews</TabsTrigger>}
          </TabsList>

          {/* My Pets Tab (Owner only) */}
          {userType === 'owner' && (
            <TabsContent value="pets">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myPets.map((pet) => (
                  <Card key={pet.id} className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-shadow">
                    <div className="aspect-square relative overflow-hidden">
                      <ImageWithFallback
                        src={pet.image}
                        alt={pet.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-5">
                      <h3 className="mb-1" style={{ fontWeight: 600 }}>{pet.name}</h3>
                      <p className="text-sm text-muted-foreground mb-1">{pet.breed}</p>
                      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-3">
                        {pet.age && <span>Age: {pet.age}</span>}
                        {pet.weight && <span>Weight: {pet.weight}</span>}
                      </div>
                      {pet.temperament && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {pet.temperament}
                        </p>
                      )}
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => handleEditPet(pet)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </div>
                  </Card>
                ))}

                {/* Add Pet Card */}
                <Card 
                  className="border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all cursor-pointer flex items-center justify-center min-h-[300px] group"
                  onClick={handleAddPet}
                >
                  <div className="text-center p-6">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                      <Heart className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="mb-2 text-primary" style={{ fontWeight: 600 }}>Add a Pet</h3>
                    <p className="text-sm text-muted-foreground">
                      Upload photos and details of your furry friend
                    </p>
                  </div>
                </Card>
              </div>
            </TabsContent>
          )}

          {/* My Tasks Tab */}
          <TabsContent value="tasks">
            {myTasks.length === 0 ? (
              <EmptyState
                icon={PawPrint}
                title="No tasks yet!"
                description="Start by posting a task or applying to help other pet owners in your community."
                actionLabel="Browse Tasks"
                onAction={() => onNavigate('tasks')}
              />
            ) : (
              <div className="space-y-4">
                {myTasks.map((task) => (
                  <Card key={task.id} className="p-6 border-0 shadow-md hover:shadow-xl transition-shadow">
                    <div className="flex gap-6">
                      <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0">
                        <ImageWithFallback
                          src={task.image}
                          alt={task.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 style={{ fontWeight: 600 }}>{task.title}</h3>
                              <Badge 
                                className={
                                  task.status === 'Active' || task.status === 'Confirmed'
                                    ? 'bg-primary text-white' 
                                    : task.status === 'Pending'
                                    ? 'bg-accent text-white'
                                    : 'bg-secondary text-secondary-foreground'
                                }
                              >
                                {task.status}
                              </Badge>
                            </div>
                            {userType === 'owner' ? (
                              <button 
                                onClick={() => task.applications > 0 && handleViewApplicants(task)}
                                className={`text-sm text-muted-foreground flex items-center gap-2 ${
                                  task.applications > 0 ? 'hover:text-primary cursor-pointer' : 'cursor-default'
                                }`}
                              >
                                <Users className="w-4 h-4" />
                                {task.applications} application{task.applications !== 1 ? 's' : ''} received
                              </button>
                            ) : (
                              <div className="text-sm text-muted-foreground space-y-1">
                                <p className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  {task.date}
                                </p>
                                {'owner' in task && (
                                  <p className="flex items-center gap-2">
                                    <User className="w-4 h-4" />
                                    Owner: {task.owner}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="hover:bg-primary/10 hover:border-primary hover:text-primary">
                              <MessageCircle className="w-4 h-4 mr-2" />
                              Messages
                            </Button>
                            <Button variant="outline" size="sm" className="hover:bg-primary/10 hover:border-primary hover:text-primary">
                              View
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Reviews Tab (Helper only) */}
          {userType === 'helper' && (
            <TabsContent value="reviews">
              <div className="grid md:grid-cols-2 gap-6">
                {reviews.map((review) => (
                  <Card key={review.id} className="p-6 border-0 shadow-md">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h4 style={{ fontWeight: 600 }}>{review.author}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {review.date}
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating
                                ? 'text-yellow-500 fill-yellow-500'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-muted-foreground">{review.comment}</p>
                  </Card>
                ))}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Dialogs */}
      <EditProfileDialog
        open={editProfileOpen}
        onOpenChange={setEditProfileOpen}
        profileData={profileData}
        onSave={handleSaveProfile}
      />

      <PetFormDialog
        open={petFormOpen}
        onOpenChange={(open) => {
          setPetFormOpen(open);
          if (!open) setEditingPet(null);
        }}
        pet={editingPet}
        onSave={handleSavePet}
      />

      <HelperDetailsDialog
        open={helperDetailsOpen}
        onOpenChange={setHelperDetailsOpen}
        helperDetails={helperDetails}
        onSave={handleSaveHelperDetails}
      />

      <ApplicantsDialog
        open={applicantsDialogOpen}
        onOpenChange={setApplicantsDialogOpen}
        applicants={getApplicantsForTask()}
        selectedTask={selectedTask}
        onViewProfile={handleViewApplicantProfile}
        onConfirmHelper={handleConfirmHelper}
      />
    </div>
  );
}