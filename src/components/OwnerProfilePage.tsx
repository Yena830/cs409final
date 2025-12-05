/**
 * OwnerProfilePage - Private profile page for owners only
 * Only users with "owner" role can access this page
 */

import React, { useState, useEffect, useCallback } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Star, MapPin, Shield, Edit, Heart, MessageCircle, Calendar, CheckCircle2, TrendingUp, Clock, PawPrint, Briefcase, ArrowLeft, Users, User as UserIcon } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { EmptyState } from "./EmptyState";
import { EditProfileDialog } from "./EditProfileDialog";
import { PetFormDialog } from "./PetFormDialog";
import { ApplicantsDialog } from "./ApplicantsDialog";
import { toast } from "sonner";
import { api } from "../lib/api";
import { useUser } from "../hooks/useUser";

interface OwnerProfilePageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
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

export function OwnerProfilePage({ onNavigate }: OwnerProfilePageProps) {
  const { user, loading: userLoading, isOwner, isHelper, setUser } = useUser();
  const [loading, setLoading] = useState(true);
  const [loadingPets, setLoadingPets] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [activeTab, setActiveTab] = useState<'pets' | 'tasks'>('tasks');
  const [upgradingRole, setUpgradingRole] = useState(false);

  const [myPets, setMyPets] = useState<Pet[]>([]);
  const [postedTasks, setPostedTasks] = useState<Task[]>([]);

  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [petFormOpen, setPetFormOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [applicantsDialogOpen, setApplicantsDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Role check - only owners can access
  useEffect(() => {
    if (userLoading) return;
    
    if (!user || !isOwner()) {
      toast.error("Only owners can access this page");
      onNavigate('landing');
      return;
    }
  }, [user, userLoading, isOwner, onNavigate]);

  // Load user data on mount
  useEffect(() => {
    if (userLoading) return;
    
    if (!user || !user._id || !isOwner()) {
      setLoading(false);
      return;
    }

    const initializeData = async () => {
      await loadTasks();
      setLoading(false);
    };

    initializeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLoading, user, isOwner]);

  // Load data when tab changes
  useEffect(() => {
    if (userLoading || loading) return;
    if (!user || !user._id || !isOwner()) return;

    if (activeTab === 'pets') {
      if (myPets.length === 0 && !loadingPets) {
        loadPets();
      }
    } else if (activeTab === 'tasks') {
      if (postedTasks.length === 0 && !loadingTasks) {
        loadTasks();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, userLoading, user, loading, isOwner]);

  const loadPets = useCallback(async () => {
    if (!user || !user._id) return;
    
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
  }, [user]);

  const loadTasks = useCallback(async () => {
    if (!user || !user._id) return;
    
    setLoadingTasks(true);
    try {
      const response = await api.get<Task[]>('/tasks');
      if (response.success && response.data) {
        const allTasks = Array.isArray(response.data) ? response.data : [];
        
        // Filter tasks posted by this user
        const posted = allTasks.filter(task => 
          task.postedBy?._id === user._id
        );
        setPostedTasks(posted);
      } else {
        toast.error(response.message || "Failed to load tasks");
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
      toast.error("Failed to load tasks. Please try again.");
    } finally {
      setLoadingTasks(false);
    }
  }, [user]);

  const getProfileData = (): ProfileData => ({
    username: user?.name || "",
    bio: user?.bio || "",
    location: "",
    profilePhoto: user?.profilePhoto || "",
  });

  const handleSaveProfile = async (data: ProfileData) => {
    toast.info("Profile update feature will be implemented with backend API");
  };

  const handleAddRole = async (role: 'owner' | 'helper') => {
    if (!user || !user._id) return;
    
    setUpgradingRole(true);
    try {
      const response = await api.post(`/users/add-role`, { role });
      
      if (response.success && response.data) {
        // Update user context with new role
        setUser(response.data);
        toast.success(`Successfully became a ${role}!`);
      } else {
        toast.error(response.message || `Failed to add ${role} role`);
      }
    } catch (error) {
      console.error('Failed to add role:', error);
      toast.error(`Failed to add ${role} role. Please try again.`);
    } finally {
      setUpgradingRole(false);
    }
  };

  const handleSavePet = async (savedPet: Pet) => {
    if (savedPet._id) {
      const existingIndex = myPets.findIndex(p => p._id === savedPet._id);
      if (existingIndex >= 0) {
        setMyPets(prev => prev.map((p, idx) => idx === existingIndex ? savedPet : p));
      } else {
        setMyPets(prev => [savedPet, ...prev]);
      }
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

  const handleViewApplicants = (task: Task) => {
    setSelectedTask(task);
    setApplicantsDialogOpen(true);
  };

  const handleViewApplicantProfile = (applicantId: string | number) => {
    // Navigate to public helper profile
    onNavigate('helper-public-profile', { userId: applicantId });
  };

  const handleConfirmHelper = async (applicantId: string | number) => {
    if (!selectedTask) return;
    
    try {
      const response = await api.post(`/tasks/${selectedTask._id}/assign`, {
        helperId: applicantId,
      });
      
      if (response.success) {
        toast.success("Helper assigned successfully!");
        await loadTasks();
        setApplicantsDialogOpen(false);
      } else {
        toast.error(response.message || "Failed to assign helper");
      }
    } catch (error) {
      toast.error("Failed to assign helper");
    }
  };

  const getApplicantsForTask = () => {
    if (!selectedTask || !selectedTask.applicants) return [];
    
    return selectedTask.applicants.map((app: { _id: string; name: string; profilePhoto?: string }) => ({
      id: app._id,
      name: app.name,
      avatar: app.profilePhoto || '',
      rating: 4.8,
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

  if (!user || !isOwner()) {
    return (
      <div className="min-h-screen pt-24 pb-24 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-muted-foreground mb-4">Access denied. Only owners can view this page.</div>
          <Button onClick={() => onNavigate('landing')}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-24 px-4">
      <div className="max-w-[1200px] mx-auto">
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
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="gap-2 hover:bg-primary/10 hover:border-primary hover:text-primary transition-all"
                    onClick={() => setEditProfileOpen(true)}
                  >
                    <Edit className="w-4 h-4" />
                    Edit Profile
                  </Button>
                  {!isHelper() && (
                    <Button 
                      variant="outline" 
                      className="gap-2 hover:bg-accent/10 hover:border-accent hover:text-accent transition-all"
                      onClick={() => handleAddRole('helper')}
                      disabled={upgradingRole}
                    >
                      <Briefcase className="w-4 h-4" />
                      {upgradingRole ? 'Adding...' : 'Become a Helper'}
                    </Button>
                  )}
                </div>
              </div>

              <p className="text-muted-foreground mb-6">
                {user?.bio || "No bio added yet."}
              </p>

              {/* Owner Stats */}
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
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'pets' | 'tasks')} className="w-full">
          <TabsList className="grid w-full md:w-auto grid-cols-2 mb-6">
            <TabsTrigger value="pets">My Pets</TabsTrigger>
            <TabsTrigger value="tasks">My Tasks</TabsTrigger>
          </TabsList>

          {/* My Pets Tab */}
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

          {/* My Tasks Tab */}
          <TabsContent value="tasks">
            {loadingTasks ? (
              <div className="text-center py-12">
                <div className="text-muted-foreground">Loading tasks...</div>
              </div>
            ) : postedTasks.length === 0 ? (
              <EmptyState
                icon={PawPrint}
                title="No tasks yet!"
                description="Start by posting a task to find helpers for your pets."
                actionLabel="Post a Task"
                onAction={() => onNavigate('post-task')}
              />
            ) : (
              <div className="space-y-4">
                {postedTasks.map((task) => {
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
                                    task.status === 'open' 
                                      ? 'bg-accent !text-white border-transparent' 
                                      : task.status === 'in_progress'
                                      ? 'bg-chart-5 !text-white border-transparent'
                                      : task.status === 'completed'
                                      ? 'bg-primary !text-white border-transparent'
                                      : 'bg-secondary !text-secondary-foreground border-transparent'
                                  }
                                >
                                  {task.status.replace('_', ' ')}
                                </Badge>
              
                              </div>
                              <button 
                                onClick={() => applicantsCount > 0 && handleViewApplicants(task)}
                                className={`text-sm text-muted-foreground flex items-center gap-2 ${
                                  applicantsCount > 0 ? 'hover:text-primary cursor-pointer' : 'cursor-default'
                                }`}
                              >
                                <Users className="w-4 h-4" />
                                {applicantsCount} application{applicantsCount !== 1 ? 's' : ''} received
                              </button>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="hover:bg-primary/10 hover:border-primary hover:text-primary"
                                onClick={() => onNavigate('task-detail', { taskId: task._id })}
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

