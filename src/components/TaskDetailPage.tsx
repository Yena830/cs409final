import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Star, MapPin, Clock, DollarSign, Shield, MessageCircle, ArrowLeft, Heart, Users, PawPrint } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { api } from "../lib/api";
import { useUser } from "../hooks/useUser";
import { toast } from "sonner";
import { ApplicantsDialog } from "./ApplicantsDialog";

interface TaskDetailPageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
  taskId?: string;
}

interface Task {
  _id: string;
  title: string;
  description: string;
  type: string;
  location: string;
  time?: string;
  date?: string;
  reward?: string;
  budget?: number;
  status: string;
  pet?: {
    _id: string;
    name: string;
    type: string;
    breed?: string;
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

export function TaskDetailPage({ onNavigate, taskId }: TaskDetailPageProps) {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [applicantsDialogOpen, setApplicantsDialogOpen] = useState(false);
  const { user, isOwner, isHelper, isAuthenticated } = useUser();

  useEffect(() => {
    if (taskId) {
      loadTask();
    } else {
      toast.error("Task ID not provided");
      onNavigate('tasks');
    }
  }, [taskId]);

  const loadTask = async () => {
    if (!taskId) return;
    
    setLoading(true);
    try {
      const response = await api.get<Task>(`/tasks/${taskId}`);
      if (response.success && response.data) {
        setTask(response.data);
      } else {
        toast.error("Failed to load task");
        onNavigate('tasks');
      }
    } catch (error) {
      toast.error("Failed to load task");
      onNavigate('tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!taskId || !isAuthenticated) {
      toast.error("Please log in to apply");
      onNavigate('auth');
      return;
    }

    if (!isHelper()) {
      toast.error("Only helpers can apply to tasks");
      return;
    }

    setApplying(true);
    try {
      const response = await api.post(`/tasks/${taskId}/apply`, {});
      if (response.success) {
        toast.success("Application submitted successfully!");
        loadTask(); // Reload task to update applicants
      } else {
        toast.error(response.message || "Failed to apply");
      }
    } catch (error) {
      toast.error("Failed to apply");
    } finally {
      setApplying(false);
    }
  };

  const handleAssignHelper = async (helperId: string) => {
    if (!taskId) return;

    setAssigning(true);
    try {
      const response = await api.post(`/tasks/${taskId}/assign`, { helperId });
      if (response.success) {
        toast.success("Helper assigned successfully!");
        loadTask(); // Reload task to update status
        setApplicantsDialogOpen(false);
      } else {
        toast.error(response.message || "Failed to assign helper");
      }
    } catch (error) {
      toast.error("Failed to assign helper");
    } finally {
      setAssigning(false);
    }
  };

  const handleCompleteTask = async () => {
    if (!taskId) return;

    setCompleting(true);
    try {
      const response = await api.post(`/tasks/${taskId}/complete`, {});
      if (response.success) {
        toast.success("Task marked as completed!");
        loadTask(); // Reload task to update status
      } else {
        toast.error(response.message || "Failed to complete task");
      }
    } catch (error) {
      toast.error("Failed to complete task");
    } finally {
      setCompleting(false);
    }
  };

  const isTaskOwner = task && user && task.postedBy?._id === user._id;
  const hasApplied = task?.applicants?.some(app => app._id === user?._id);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-24 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-muted-foreground">Loading task details...</div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen pt-24 pb-24 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-muted-foreground mb-4">Task not found</div>
          <Button onClick={() => onNavigate('tasks')}>Back to Tasks</Button>
        </div>
      </div>
    );
  }

  const petImage = task?.pet?.photos?.[0] ?? "https://placehold.co/600x400?text=No+Pet+Photo";

  const rewardDisplay = task.reward || (task.budget ? `$${task.budget}` : '$0');
  const timeDisplay = task.time || (task.date ? new Date(task.date).toLocaleDateString() : 'Flexible');
  const typeDisplay = task.type ? task.type.charAt(0).toUpperCase() + task.type.slice(1) : 'Task';

  // Format applicants for ApplicantsDialog
  const formattedApplicants = task.applicants?.map(app => ({
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
  })) || [];

  return (
    <div className="min-h-screen pt-24 pb-24 px-4">
      <div className="max-w-[1200px] mx-auto">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => onNavigate('tasks')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Tasks
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Header */}
            <Card className="p-6 border-0 shadow-md">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-primary" style={{ fontWeight: 700, fontSize: '32px' }}>{task.title}</h1>
                    <Badge 
                      className={`${
                        task.status === 'open' ? 'bg-green-500' :
                        task.status === 'in_progress' ? 'bg-blue-500' :
                        task.status === 'completed' ? 'bg-gray-500' :
                        'bg-primary'
                      } text-white`}
                      style={{ fontWeight: 600 }}
                    >
                      {task.status}
                    </Badge>
                  </div>
                  <Badge className="bg-primary text-white" style={{ fontWeight: 600 }}>{typeDisplay}</Badge>
                </div>
                {isTaskOwner && task.status === "open" && task.applicants && task.applicants.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={() => setApplicantsDialogOpen(true)}
                    className="flex items-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    View Applications ({task.applicants.length})
                  </Button>
                )}
              </div>

              <div className="grid sm:grid-cols-3 gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Location</div>
                    <div style={{ fontWeight: 600 }}>{task.location}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Time</div>
                    <div style={{ fontWeight: 600 }}>{timeDisplay}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Reward</div>
                    <div className="text-primary" style={{ fontWeight: 700, fontSize: '24px' }}>{rewardDisplay}</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-3" style={{ fontWeight: 600 }}>Task Description</h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {task.description || "No description provided."}
                </p>
              </div>
            </Card>

            {/* Pet Information */}
            {task.pet && (
              <Card className="p-6 border-0 shadow-md">
                <h3 className="mb-4" style={{ fontWeight: 600 }}>Pet Information</h3>
                <div className="flex gap-6">
                  <div className="w-32 h-32 rounded-2xl overflow-hidden shrink-0">
                    <ImageWithFallback
                      src={petImage}
                      alt={task.pet.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div>
                      <h4 style={{ fontWeight: 600 }}>{task.pet.name}</h4>
                      <p className="text-muted-foreground">
                        {task.pet.breed || task.pet.type}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            )}

          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Owner Info */}
            {task.postedBy && (
              <Card className="p-6 border-0 shadow-md">
                <div className="flex items-center gap-2 mb-4">
                  <Heart className="w-5 h-5 text-primary fill-primary" />
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Task Owner</h3>
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <Avatar 
                    className="w-16 h-16 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => onNavigate('helper-public-profile', { userId: task.postedBy?._id })}
                  >
                    <AvatarImage src={task.postedBy.profilePhoto} alt={task.postedBy.name} />
                    <AvatarFallback className="bg-primary text-white">
                      {task.postedBy.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 
                        style={{ fontWeight: 600 }}
                        className="cursor-pointer hover:text-primary transition-colors"
                        onClick={() => onNavigate('helper-public-profile', { userId: task.postedBy?._id })}
                      >
                        {task.postedBy.name}
                      </h4>
                      <Shield className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm" style={{ fontWeight: 600 }}>4.9</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    className="flex-1 bg-primary hover:bg-primary/90 text-white"
                    onClick={() => onNavigate('messages', { selectedUserId: task.postedBy?._id })}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                </div>
              </Card>
            )}

            {/* Helper Info - Show when task is assigned */}
            {task.assignedTo && (
              <Card className="p-6 border-0 shadow-md">
                <div className="flex items-center gap-2 mb-4">
                  <PawPrint className="w-5 h-5 text-primary" />
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Assigned Helper</h3>
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <Avatar 
                    className="w-16 h-16 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => onNavigate('helper-public-profile', { helperId: task.assignedTo?._id })}
                  >
                    <AvatarImage src={task.assignedTo.profilePhoto} alt={task.assignedTo.name} />
                    <AvatarFallback className="bg-primary text-white">
                      {task.assignedTo.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 
                        style={{ fontWeight: 600 }}
                        className="cursor-pointer hover:text-primary transition-colors"
                        onClick={() => onNavigate('helper-public-profile', { helperId: task.assignedTo?._id })}
                      >
                        {task.assignedTo.name}
                      </h4>
                      <Shield className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm" style={{ fontWeight: 600 }}>4.9</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    className="flex-1 bg-primary hover:bg-primary/90 text-white"
                    onClick={() => onNavigate('messages', { selectedUserId: task.assignedTo?._id })}
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                </div>
              </Card>
            )}

            {/* Apply Card - Show for helpers */}
            {isHelper() && !isTaskOwner && task.status === "open" && (
              <Card className="p-6 border-0 shadow-md bg-secondary/20">
                <h3 className="mb-4" style={{ fontWeight: 600 }}>Apply for this Task</h3>
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded-xl">
                    <div className="text-sm text-muted-foreground mb-1">You'll earn</div>
                    <div className="text-primary" style={{ fontWeight: 700, fontSize: '36px' }}>{rewardDisplay}</div>
                    <div className="text-sm text-muted-foreground">per session</div>
                  </div>
                  <Button 
                    size="lg" 
                    className="w-full bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
                    onClick={handleApply}
                    disabled={applying || hasApplied}
                  >
                    {applying ? 'Applying...' : hasApplied ? 'Already Applied' : 'Apply Now'}
                  </Button>
                  {hasApplied && (
                    <p className="text-xs text-center text-primary">
                      Your application has been submitted
                    </p>
                  )}
                  {!hasApplied && (
                    <p className="text-xs text-center text-muted-foreground">
                      You'll be able to chat with the owner after applying
                    </p>
                  )}
                </div>
              </Card>
            )}

            {/* Complete Task Button - Show for owner when in progress */}
            {isTaskOwner && task.status === "in_progress" && (
              <Card className="p-6 border-0 shadow-md bg-green-50/50">
                <h3 className="mb-4" style={{ fontWeight: 600 }}>Task Status</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  This task is in progress. Mark it as completed when the helper finishes.
                </p>
                <Button 
                  size="lg"
                  className="w-full !bg-green-600 hover:!bg-green-700 !text-white"
                  onClick={handleCompleteTask}
                  disabled={completing}
                >
                  {completing ? 'Completing...' : 'Complete Task'}
                </Button>
              </Card>
            )}


          </div>
        </div>
      </div>

      {/* Applicants Dialog */}
      {isTaskOwner && (
        <ApplicantsDialog
          open={applicantsDialogOpen}
          onOpenChange={setApplicantsDialogOpen}
          taskTitle={task.title}
          applicants={formattedApplicants}
          selectedTask={{ title: task.title, applications: task.applicants?.length || 0 }}
          onConfirmHelper={(applicantId) => handleAssignHelper(applicantId.toString())}
        />
      )}
    </div>
  );
}
