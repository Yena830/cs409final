import React, { useState, useEffect } from "react";
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
import { toast } from "sonner";
import { api } from "../lib/api";
import { useUser } from "../hooks/useUser";
import { Users } from "lucide-react";
import { User as UserIcon } from "lucide-react";

interface ProfilePageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
  userType?: 'owner' | 'helper';
}

interface Pet {
  _id: string;
  name: string;
  type: string;
  breed?: string;
  height?: number;
  weight?: number;
  temperament?: string;
  photos?: string[];
  owner: string;
}

interface Task {
  _id: string;
  title: string;
  description: string;
  type: string;
  location: string;
  status: string;
  reward?: string;
  budget?: number;
  date?: string;
  time?: string;
  image?: string;
  pet?: {
    _id: string;
    name: string;
    type: string;
    photos?: string[];
  };
  postedBy?: {
    _id: string;
    name: string;
    profilePhoto?: string;
  };
  assignedTo?: {
    _id: string;
    name: string;
    profilePhoto?: string;
  };
  applicants?: Array<{
    _id: string;
    name: string;
    profilePhoto?: string;
  }>;
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

// Backend Pet interface (matching PetFormDialog)
interface BackendPet {
  _id?: string;
  name: string;
  type: string;
  breed?: string;
  height?: number;
  weight?: number;
  temperament?: string;
  photos?: string[];
  owner?: string;
}

export function ProfilePage({ onNavigate, userType = 'owner' }: ProfilePageProps) {
  const { user, loading: userLoading, setUser } = useUser();
  const [loading, setLoading] = useState(true);
  const [loadingPets, setLoadingPets] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [activeTab, setActiveTab] = useState<'pets' | 'tasks' | 'reviews'>('tasks');

  // Profile data from real user (computed for EditProfileDialog compatibility)
  const getProfileData = (): ProfileData => ({
    username: user?.name || "",
    bio: user?.bio || "",
    location: "", // Location not in user model yet
    profilePhoto: user?.profilePhoto || "",
  });

  // Helper-specific data (stored in user bio for now)
  const [helperDetails, setHelperDetails] = useState<HelperDetails>({
    experience: "",
    certifications: [],
    specialties: [],
  });

  // Pets data (for owners)
  const [myPets, setMyPets] = useState<Pet[]>([]);
  
  // Tasks data
  const [postedTasks, setPostedTasks] = useState<Task[]>([]);
  const [assignedTasks, setAssignedTasks] = useState<Task[]>([]);

  // Dialogs state
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [petFormOpen, setPetFormOpen] = useState(false);
  const [helperDetailsOpen, setHelperDetailsOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [applicantsDialogOpen, setApplicantsDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Load user data on mount
  useEffect(() => {
    // Wait for user loading to complete
    if (userLoading) return;
    
    // Check if user exists before loading data
    if (!user) {
      setLoading(false);
      return;
    }
    
    if (!user._id) {
      setLoading(false);
      return;
    }

    // Load initial data based on default tab (tasks)
    const initializeData = async () => {
      // Load tasks by default since activeTab starts as 'tasks'
      await loadTasks();
      setLoading(false);
    };

    initializeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLoading, user]);

  // Load data when tab changes
  useEffect(() => {
    // Wait for user loading to complete
    if (userLoading || loading) return;
    
    // Check if user exists before loading data
    if (!user || !user._id) return;

    if (activeTab === 'pets' && userType === 'owner') {
      // Load pets when pets tab is activated (only if not already loaded)
      if (myPets.length === 0 && !loadingPets) {
        loadPets();
      }
    } else if (activeTab === 'tasks') {
      // Load tasks when tasks tab is activated (only if not already loaded)
      if (myTasks.length === 0 && !loadingTasks) {
        loadTasks();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, userLoading, user, loading]);

  const loadPets = async () => {
    if (userType !== 'owner' || !user || !user._id) return;
    
    setLoadingPets(true);
    try {
      const response = await api.get<Pet[]>('/pets/my');
      if (response.success && response.data) {
        setMyPets(Array.isArray(response.data) ? response.data : []);
      } else {
        toast.error(response.message || "Failed to load pets");
      }
    } catch (error) {
      console.error('Failed to load pets:', error);
      toast.error("Failed to load pets. Please try again.");
    } finally {
      setLoadingPets(false);
    }
  };

  const loadTasks = async () => {
    if (!user || !user._id) return;
    
    setLoadingTasks(true);
    try {
      const response = await api.get<Task[]>('/tasks');
      if (response.success && response.data) {
        const allTasks = Array.isArray(response.data) ? response.data : [];
        
        // Filter tasks posted by this user (for owners)
        const posted = allTasks.filter(task => 
          task.postedBy?._id === user._id
        );
        setPostedTasks(posted);
        
        // Filter tasks assigned to this user (for helpers)
        const assigned = allTasks.filter(task => 
          task.assignedTo?._id === user._id || 
          task.applicants?.some(applicant => applicant._id === user._id)
        );
        setAssignedTasks(assigned);
      } else {
        toast.error(response.message || "Failed to load tasks");
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
      toast.error("Failed to load tasks. Please try again.");
    } finally {
      setLoadingTasks(false);
    }
  };

  // Determine which tasks to show based on user type
  const myTasks = userType === 'owner' ? postedTasks : assignedTasks;

  const handleSaveProfile = async (data: ProfileData) => {
    if (!user || !user._id) return;
    
    try {
      // Prepare data for update
      const updateData = {
        name: data.username,
        bio: data.bio,
        profilePhoto: data.profilePhoto
      };
      
      // Call API to update user profile
      const response = await api.put(`/users/${user._id}`, updateData);
      
      if (response.success && response.data) {
        // Update user context with new data
        setUser({
          ...user,
          name: response.data.name,
          bio: response.data.bio,
          profilePhoto: response.data.profilePhoto
        });
        
        toast.success("Profile updated successfully!");
      } else {
        toast.error(response.message || "Failed to update profile");
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error("Failed to update profile. Please try again.");
    }
  };

  const handleSavePet = async (savedPet: BackendPet) => {
    // PetFormDialog now returns the created/updated pet object from backend
    // Toast notifications are handled in PetFormDialog
    if (savedPet._id) {
      // Check if pet already exists (update) or is new (create)
      const existingIndex = myPets.findIndex(p => p._id === savedPet._id);
      if (existingIndex >= 0) {
        // Update existing pet in state
        setMyPets(prev => prev.map((p, idx) => idx === existingIndex ? savedPet as Pet : p));
      } else {
        // Add new pet to state - add to beginning of array
        setMyPets(prev => [savedPet as Pet, ...prev]);
      }
    }
  };

  const handleEditPet = (pet: Pet) => {
    // PetFormDialog now accepts backend Pet format directly
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

  const handleViewApplicants = (task: Task) => {
    setSelectedTask(task);
    setApplicantsDialogOpen(true);
  };

  const handleViewApplicantProfile = (applicantId: string | number) => {
    // Navigate to helper profile
    toast.info("Opening applicant profile...");
  };

  const handleConfirmHelper = async (applicantId: string | number) => {
    if (!selectedTask) return;
    
    try {
      const response = await api.post(`/tasks/${selectedTask._id}/assign`, {
        helperId: applicantId,
      });
      
      if (response.success) {
        toast.success("Helper assigned successfully!");
        await loadTasks(); // Reload tasks
        setApplicantsDialogOpen(false);
      } else {
        toast.error(response.message || "Failed to assign helper");
      }
    } catch (error) {
      toast.error("Failed to assign helper");
    }
  };

  // Get applicants for the selected task
  const getApplicantsForTask = () => {
    if (!selectedTask || !selectedTask.applicants) return [];
    
    return selectedTask.applicants.map((app: { _id: string; name: string; profilePhoto?: string }) => ({
      id: app._id,
      name: app.name,
      avatar: app.profilePhoto || '',
      rating: 4.8, // Default rating (not in backend yet)
      reviewCount: 0,
      location: '',
      tasksCompleted: 0,
      responseRate: 100,
      verified: false,
      experience: '',
      certifications: [],
      introduction: '',
    }));
  };

  if (userLoading || loading) {
    return (
      <div className="min-h-screen pt-24 pb-24 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-muted-foreground">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen pt-24 pb-24 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-muted-foreground mb-4">Please log in to view your profile</div>
          <Button onClick={() => onNavigate('auth')}>Log In</Button>
        </div>
      </div>
    );
  }

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
              <AvatarImage src={user?.profilePhoto || ""} alt={user?.name || ""} />
              <AvatarFallback className="bg-primary text-white text-3xl">
                {user?.name?.substring(0, 2).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-primary" style={{ fontWeight: 700, fontSize: '32px' }}>{user?.name || "User"}</h1>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>{user?.email || ""}</span>
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
                {user?.bio || "No bio added yet."}
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
                        <div className="text-primary" style={{ fontWeight: 700, fontSize: '24px' }}>
                          {assignedTasks.filter(t => t.status === 'completed').length}
                        </div>
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
                        <div className="text-accent" style={{ fontWeight: 700, fontSize: '24px' }}>
                          {assignedTasks.length > 0 ? Math.round((assignedTasks.filter(t => t.status === 'completed').length / assignedTasks.length) * 100) : 0}%
                        </div>
                        <div className="text-xs text-muted-foreground">Completion</div>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-4 border-0 bg-secondary/30 hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-chart-5/10 rounded-full flex items-center justify-center">
                        <Clock className="w-6 h-6 text-chart-5" />
                      </div>
                      <div>
                        <div className="text-chart-5" style={{ fontWeight: 700, fontSize: '24px' }}>
                          {user?.createdAt ? new Date(user.createdAt).getFullYear() : new Date().getFullYear()}
                        </div>
                        <div className="text-xs text-muted-foreground">Member Since</div>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-4 border-0 bg-secondary/30 hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center">
                        <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                      </div>
                      <div>
                        <div className="text-yellow-600" style={{ fontWeight: 700, fontSize: '24px' }}>—</div>
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
                        <div className="text-accent" style={{ fontWeight: 700, fontSize: '24px' }}>
                          {postedTasks.filter(t => t.status === 'open' || t.status === 'in_progress').length}
                        </div>
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
                        <div className="text-chart-5" style={{ fontWeight: 700, fontSize: '24px' }}>
                          {user?.createdAt ? new Date(user.createdAt).getFullYear() : new Date().getFullYear()}
                        </div>
                        <div className="text-xs text-muted-foreground">Member Since</div>
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
        <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as 'pets' | 'tasks' | 'reviews')} className="w-full">
          <TabsList className={`grid w-full md:w-auto ${userType === 'owner' ? 'grid-cols-2' : 'grid-cols-2'} mb-6`}>
            {userType === 'owner' && <TabsTrigger value="pets">My Pets</TabsTrigger>}
            <TabsTrigger value="tasks">My Tasks</TabsTrigger>
            {userType === 'helper' && <TabsTrigger value="reviews">Reviews</TabsTrigger>}
          </TabsList>

          {/* My Pets Tab (Owner only) */}
          {userType === 'owner' && (
            <TabsContent value="pets">
              {loadingPets ? (
                <div className="text-center py-12">
                  <div className="text-muted-foreground">Loading pets...</div>
                </div>
              ) : myPets.length === 0 ? (
                <EmptyState
                  icon={PawPrint}
                  title="No pets yet!"
                  description="Add your first pet to get started posting tasks."
                  actionLabel="Add Pet"
                  onAction={handleAddPet}
                />
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myPets.map((pet) => (
                    <Card key={pet._id} className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-shadow">
                      <div className="aspect-square relative overflow-hidden">
                        <ImageWithFallback
                          src={
                            pet.photos?.[0] ?? "https://placehold.co/600x400?text=No+Pet+Photo"
                          }
                          alt={pet.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-5">
                        <h3 className="mb-1" style={{ fontWeight: 600 }}>{pet.name}</h3>
                        <p className="text-sm text-muted-foreground mb-1">
                          {pet.breed || pet.type}
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground mb-3">
                          {pet.height && <span>Height: {pet.height} in</span>}
                          {pet.weight && <span>Weight: {pet.weight} lbs</span>}
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
              )}
            </TabsContent>
          )}

          {/* My Tasks Tab */}
          <TabsContent value="tasks">
            {loadingTasks ? (
              <div className="text-center py-12">
                <div className="text-muted-foreground">Loading tasks...</div>
              </div>
            ) : myTasks.length === 0 ? (
              <EmptyState
                icon={PawPrint}
                title="No tasks yet!"
                description="Start by posting a task or applying to help other pet owners in your community."
                actionLabel={userType === 'owner' ? "Post a Task" : "Browse Tasks"}
                onAction={() => onNavigate(userType === 'owner' ? 'post-task' : 'tasks')}
              />
            ) : (
              <div className="space-y-4">
                {myTasks.map((task) => {
                  const petImage = task?.pet?.photos?.[0] ?? "https://placehold.co/600x400?text=No+Pet+Photo";
                  const applicantsCount = task.applicants?.length || 0;
                  
                  return (
                    <Card key={task._id} className="p-6 border-0 shadow-md hover:shadow-xl transition-shadow">
                      <div className="flex gap-6">
                        <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0">
                          <ImageWithFallback
                            src={petImage}
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
                                    task.status === 'open' || task.status === 'in_progress'
                                      ? 'bg-primary text-white' 
                                      : task.status === 'completed'
                                      ? 'bg-green-500 text-white'
                                      : 'bg-secondary text-secondary-foreground'
                                  }
                                >
                                  {task.status.replace('_', ' ')}
                                </Badge>
                              </div>
                              {userType === 'owner' ? (
                                task.status === 'open' && (
                                  <button 
                                    onClick={() => applicantsCount > 0 && handleViewApplicants(task)}
                                    className={`text-sm text-muted-foreground flex items-center gap-2 ${
                                      applicantsCount > 0 ? 'hover:text-primary cursor-pointer' : 'cursor-default'
                                    }`}
                                  >
                                    <Users className="w-4 h-4" />
                                    {applicantsCount} application{applicantsCount !== 1 ? 's' : ''} received
                                  </button>
                                )
                              ) : (
                                <div className="text-sm text-muted-foreground space-y-1">
                                  {task.date && (
                                    <p className="flex items-center gap-2">
                                      <Calendar className="w-4 h-4" />
                                      {new Date(task.date).toLocaleDateString()}
                                    </p>
                                  )}
                                  {task.postedBy && (
                                    <p className="flex items-center gap-2">
                                      <UserIcon className="w-4 h-4" />
                                      Owner: {task.postedBy.name}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="hover:bg-primary/10 hover:border-primary hover:text-primary"
                                onClick={() => onNavigate('task-detail', { taskId: task._id, returnTo: 'profile' })}
                              >
                                View
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Reviews Tab (Helper only) - Placeholder for future reviews feature */}
          {userType === 'helper' && (
            <TabsContent value="reviews">
              <EmptyState
                icon={Star}
                title="No reviews yet!"
                description="Reviews will appear here once pet owners leave feedback on your completed tasks."
              />
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Dialogs */}
      <EditProfileDialog
        open={editProfileOpen}
        onOpenChange={setEditProfileOpen}
        profileData={getProfileData()}
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
        selectedTask={selectedTask ? {
          title: selectedTask.title,
          applications: selectedTask.applicants?.length || 0
        } : null}
        onViewProfile={handleViewApplicantProfile}
        onConfirmHelper={handleConfirmHelper}
      />
    </div>
  );
}