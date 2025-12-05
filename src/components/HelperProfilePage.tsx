/**
 * HelperProfilePage - Private profile page for helpers only
 * Only users with "helper" role can access this page
 */

import React, { useState, useEffect, useCallback } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Star, MapPin, Shield, Edit, MessageCircle, Calendar, CheckCircle2, TrendingUp, Clock, Briefcase, ArrowLeft, User as UserIcon, PawPrint } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { EmptyState } from "./EmptyState";
import { EditProfileDialog } from "./EditProfileDialog";
import { HelperDetailsDialog } from "./HelperDetailsDialog";
import { toast } from "sonner";
import { api } from "../lib/api";
import { useUser } from "../hooks/useUser";

interface HelperProfilePageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
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

export function HelperProfilePage({ onNavigate }: HelperProfilePageProps) {
  const { user, loading: userLoading, isHelper, isOwner, setUser } = useUser();
  const [loading, setLoading] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [activeTab, setActiveTab] = useState<'tasks' | 'reviews'>('tasks');
  const [upgradingRole, setUpgradingRole] = useState(false);

  const [assignedTasks, setAssignedTasks] = useState<Task[]>([]);
  const [helperDetails, setHelperDetails] = useState<HelperDetails>({
    experience: "",
    certifications: [],
    specialties: [],
  });

  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [helperDetailsOpen, setHelperDetailsOpen] = useState(false);

  // Role check - only helpers can access
  useEffect(() => {
    if (userLoading) return;
    
    if (!user || !isHelper()) {
      toast.error("Only helpers can access this page");
      onNavigate('landing');
      return;
    }
  }, [user, userLoading, isHelper, onNavigate]);

  // Load user data on mount
  useEffect(() => {
    if (userLoading) return;
    
    if (!user || !user._id || !isHelper()) {
      setLoading(false);
      return;
    }

    const initializeData = async () => {
      await loadTasks();
      setLoading(false);
    };

    initializeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLoading, user, isHelper]);

  // Load data when tab changes
  useEffect(() => {
    if (userLoading || loading) return;
    if (!user || !user._id || !isHelper()) return;

    if (activeTab === 'tasks') {
      if (assignedTasks.length === 0 && !loadingTasks) {
        loadTasks();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, userLoading, user, loading, isHelper]);

  const loadTasks = useCallback(async () => {
    if (!user || !user._id) return;
    
    setLoadingTasks(true);
    try {
      const response = await api.get<Task[]>('/tasks');
      if (response.success && response.data) {
        const allTasks = Array.isArray(response.data) ? response.data : [];
        
        // Filter tasks assigned to this user or applied by this user
        const assigned = allTasks.filter(task => 
          task.assignedTo?._id === user._id || 
          task.applicants?.some((applicant: { _id: string }) => applicant._id === user._id)
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

  const handleSaveHelperDetails = (data: HelperDetails) => {
    setHelperDetails(data);
    toast.success("Helper details updated successfully!");
  };

  const handleAddRole = async (role: 'owner' | 'helper') => {
    if (!user || !user._id) return;
    
    setUpgradingRole(true);
    try {
      const response = await api.post(`/users/add-role`, { role });
      
      if (response.success && response.data) {
        // Update user context with new role
        setUser(response.data);
        toast.success(`Successfully became an ${role}!`);
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

  if (userLoading || loading) {
    return (
      <div className="min-h-screen pt-24 pb-24 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-muted-foreground">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!user || !isHelper()) {
    return (
      <div className="min-h-screen pt-24 pb-24 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-muted-foreground mb-4">Access denied. Only helpers can view this page.</div>
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
                  {!isOwner() && (
                    <Button 
                      variant="outline" 
                      className="gap-2 hover:bg-accent/10 hover:border-accent hover:text-accent transition-all"
                      onClick={() => handleAddRole('owner')}
                      disabled={upgradingRole}
                    >
                      <PawPrint className="w-4 h-4" />
                      {upgradingRole ? 'Adding...' : 'Become an Owner'}
                    </Button>
                  )}
                </div>
              </div>

              <p className="text-muted-foreground mb-6">
                {user?.bio || "No bio added yet."}
              </p>

              {/* Helper Stats */}
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
            </div>
          </div>
        </Card>

        {/* Helper Professional Details Section */}
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

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'tasks' | 'reviews')} className="w-full">
          <TabsList className="grid w-full md:w-auto grid-cols-2 mb-6">
            <TabsTrigger value="tasks">My Tasks</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          {/* My Tasks Tab */}
          <TabsContent value="tasks">
            {loadingTasks ? (
              <div className="text-center py-12">
                <div className="text-muted-foreground">Loading tasks...</div>
              </div>
            ) : assignedTasks.length === 0 ? (
              <EmptyState
                icon={Briefcase}
                title="No tasks assigned yet!"
                description="Browse open tasks and apply to help pet owners in your community."
                actionLabel="Browse Tasks"
                onAction={() => onNavigate('tasks')}
              />
            ) : (
              <div className="space-y-4">
                {assignedTasks.map((task) => {
                  const petImage = task?.pet?.photos?.[0] ?? "https://placehold.co/600x400?text=No+Pet+Photo";
                  
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

          {/* Reviews Tab - Placeholder for future reviews feature */}
          <TabsContent value="reviews">
            <EmptyState
              icon={Star}
              title="No reviews yet!"
              description="Reviews will appear here once pet owners leave feedback on your completed tasks."
            />
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

      <HelperDetailsDialog
        open={helperDetailsOpen}
        onOpenChange={setHelperDetailsOpen}
        helperDetails={helperDetails}
        onSave={handleSaveHelperDetails}
      />
    </div>
  );
}

