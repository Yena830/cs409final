import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Star, MapPin, Clock, Banknote, Shield, MessageCircle, ArrowLeft, Heart, Users, PawPrint } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { api } from "../lib/api";
import { useUser } from "../hooks/useUser";
import { toast } from "sonner";
import { ApplicantsDialog } from "./ApplicantsDialog";
import { ReviewDialog } from "./ReviewDialog";

interface TaskDetailPageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
  taskId?: string;
  returnTo?: string;
  activeTab?: string;
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
    ownerRating?: number;
  };
  assignedTo?: {
    _id: string;
    name: string;
    profilePhoto?: string;
    helperRating?: number;
  };
  applicants?: Array<{
    _id: string;
    name: string;
    profilePhoto?: string;
    helperRating?: number;
    rating?: number;
  }>;
}


const DEFAULT_PET_IMAGES: Record<string, string> = {
  dog: "https://placehold.co/600x400/FFB84D/FFFFFF?text=Dog",
  cat: "https://placehold.co/600x400/FFB6C1/FFFFFF?text=Cat",
  bird: "https://placehold.co/600x400/87CEEB/FFFFFF?text=Bird",
  rabbit: "https://placehold.co/600x400/DDA0DD/FFFFFF?text=Rabbit",
  other: "https://placehold.co/600x400/98FB98/FFFFFF?text=Pet",
};

const getDefaultPetImage = (petType?: string) => {
  if (!petType) return DEFAULT_PET_IMAGES.other;
  return DEFAULT_PET_IMAGES[petType.toLowerCase()] || DEFAULT_PET_IMAGES.other;
};

export function TaskDetailPage({ taskId, onNavigate, returnTo, activeTab }: TaskDetailPageProps) {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [applicantsDialogOpen, setApplicantsDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [hasSubmittedReview, setHasSubmittedReview] = useState(false);
  const [reviewStatusLoading, setReviewStatusLoading] = useState(false);
  const [userReview, setUserReview] = useState<{
    rating: number;
    comment: string;
    createdAt: string;
  } | null>(null);
  const [receivedReview, setReceivedReview] = useState<{
    rating: number;
    comment: string;
    createdAt: string;
    reviewerName: string;
  } | null>(null);
  const [allTasksForCalculation, setAllTasksForCalculation] = useState<any[]>([]);
  const [formattedApplicants, setFormattedApplicants] = useState<any[]>([]);
  const { user, isHelper, isAuthenticated } = useUser();

  useEffect(() => {
    if (taskId) {
      loadTask();
    } else {
      toast.error("Task ID not provided");
      onNavigate('tasks');
    }
  }, [taskId]);

  // Check review status when task and user are loaded
  useEffect(() => {
    if (task && user && taskId) {
      setReviewStatusLoading(true);
      checkReviewStatus();
    }
  }, [task, user, taskId]);

  // Load all tasks to calculate completed tasks for applicants
  useEffect(() => {
    const loadAllTasks = async () => {
      try {
        const response = await api.get('/tasks');
        if (response.success && response.data) {
          setAllTasksForCalculation(Array.isArray(response.data) ? response.data : []);
        }
      } catch (error) {
        console.error('Failed to load tasks for calculation:', error);
      }
    };
    loadAllTasks();
  }, []);

  // Format applicants for ApplicantsDialog - fetch full user data for each applicant
  // This ensures we have the latest helperRating and other info, matching HelperPublicProfilePage
  useEffect(() => {
    const formatApplicants = async () => {
      if (!task?.applicants || task.applicants.length === 0) {
        setFormattedApplicants([]);
        return;
      }
      
      // Fetch full user data for each applicant to get the latest helperRating
      const applicantsWithFullData = await Promise.all(
        task.applicants.map(async (app: any) => {
          try {
            // Fetch full user data to get the latest helperRating
            const userResponse = await api.get(`/users/${app._id}`);
            if (userResponse.success && userResponse.data) {
              const fullUserData = userResponse.data;
              
              // Count completed tasks for this specific applicant helper
              const applicantId = app._id?.toString() || app._id;
              const completedTasks = allTasksForCalculation.filter((t: any) => {
                const assignedToId = t.assignedTo?._id?.toString() || t.assignedTo?._id || t.assignedTo;
                return assignedToId === applicantId && t.status === 'completed';
              }).length;
              
              // Use the same rating logic as HelperPublicProfilePage
              // Use data from full user fetch, not from task.applicants populate
              const rating = fullUserData.helperRating || fullUserData.rating || 0;
              
              // Get review count for this helper
              let reviewCount = 0;
              try {
                const reviewsResponse = await api.get(`/users/${app._id}/reviews?role=helper`);
                if (reviewsResponse.success && reviewsResponse.data) {
                  reviewCount = Array.isArray(reviewsResponse.data) ? reviewsResponse.data.length : 0;
                }
              } catch (error) {
                console.error(`Failed to fetch reviews for ${app.name}:`, error);
              }
              
              console.log(`TaskDetailPage - Applicant ${app.name} (${applicantId}):`, {
                fromTask: {
                  helperRating: app.helperRating,
                  rating: app.rating
                },
                fromUserAPI: {
                  helperRating: fullUserData.helperRating,
                  rating: fullUserData.rating
                },
                finalRating: rating,
                reviewCount,
                completedTasks
              });
              
              return {
                id: app._id,
                name: fullUserData.name || app.name,
                avatar: fullUserData.profilePhoto || app.profilePhoto || '',
                rating: rating > 0 ? rating : 0,
                reviewCount: reviewCount,
                location: fullUserData.location || app.location || '',
                tasksCompleted: completedTasks,
                responseRate: reviewCount, // repurpose for reviews count display
                verified: false, // Default
                experience: fullUserData.specialties?.length
                  ? fullUserData.specialties.join(', ')
                  : (fullUserData.bio || app.bio || ''),
                certifications: fullUserData.specialties || app.specialties || [],
                introduction: fullUserData.bio || app.bio || '',
              };
            }
          } catch (error) {
            console.error(`Failed to fetch user data for ${app._id}:`, error);
          }
          
          // Fallback to task.applicants data if user fetch fails
          const applicantId = app._id?.toString() || app._id;
          const completedTasks = allTasksForCalculation.filter((t: any) => {
            const assignedToId = t.assignedTo?._id?.toString() || t.assignedTo?._id || t.assignedTo;
            return assignedToId === applicantId && t.status === 'completed';
          }).length;
          
          const rating = app.helperRating || app.rating || 0;
          
          // Get review count for this helper (fallback)
          let reviewCount = 0;
          try {
            const reviewsResponse = await api.get(`/users/${app._id}/reviews?role=helper`);
            if (reviewsResponse.success && reviewsResponse.data) {
              reviewCount = Array.isArray(reviewsResponse.data) ? reviewsResponse.data.length : 0;
            }
          } catch (error) {
            console.error(`Failed to fetch reviews for ${app.name}:`, error);
          }
          
          return {
            id: app._id,
            name: app.name,
            avatar: app.profilePhoto || '',
            rating: rating > 0 ? rating : 0,
            reviewCount: reviewCount,
            location: app.location || '',
            tasksCompleted: completedTasks,
            responseRate: reviewCount,
            verified: false,
                experience: app.specialties?.length
                  ? app.specialties.join(', ')
                  : (app.bio || ''),
            certifications: app.specialties || [],
            introduction: app.bio || '',
          };
        })
      );
      
      // Filter out any null/undefined results
      setFormattedApplicants(applicantsWithFullData.filter(Boolean));
    };
    
    formatApplicants();
  }, [task?.applicants, allTasksForCalculation]);

  const checkReviewStatus = async () => {
    if (!taskId || !user || !task) return;
    
    try {
      const isOwner = task.postedBy?._id === user._id;
      const isHelper = task.assignedTo?._id === user._id;
      
      if (!isOwner && !isHelper) {
        setHasSubmittedReview(false);
        setUserReview(null);
        setReceivedReview(null);
        return;
      }
      
      // Determine who we should review (the other party)
      const revieweeId = isOwner ? task.assignedTo?._id : task.postedBy?._id;
      
      if (!revieweeId) {
        setHasSubmittedReview(false);
        setUserReview(null);
        setReceivedReview(null);
        return;
      }
      
      // Get reviews for the reviewee (to find our review)
      const reviewsResponse = await api.get(`/users/${revieweeId}/reviews`);
      if (reviewsResponse.success && reviewsResponse.data) {
        const review = reviewsResponse.data.find((review: any) => 
          review.task._id === taskId && review.reviewer._id === user._id
        );
        if (review) {
          setHasSubmittedReview(true);
          setUserReview({
            rating: review.rating,
            comment: review.comment || '',
            createdAt: review.createdAt,
          });
        } else {
          setHasSubmittedReview(false);
          setUserReview(null);
        }
      } else {
        setHasSubmittedReview(false);
        setUserReview(null);
      }
      
      // Get reviews for current user (to find review received from the other party)
      const myReviewsResponse = await api.get(`/users/${user._id}/reviews`);
      if (myReviewsResponse.success && myReviewsResponse.data) {
        const receivedReviewData = myReviewsResponse.data.find((review: any) => 
          review.task._id === taskId && review.reviewer._id === revieweeId
        );
        if (receivedReviewData) {
          setReceivedReview({
            rating: receivedReviewData.rating,
            comment: receivedReviewData.comment || '',
            createdAt: receivedReviewData.createdAt,
            reviewerName: receivedReviewData.reviewer?.name || (isOwner ? task.assignedTo?.name || 'Helper' : task.postedBy?.name || 'Owner'),
          });
        } else {
          setReceivedReview(null);
        }
      } else {
        setReceivedReview(null);
      }
    } catch (error) {
      // If error, assume no review submitted yet
      setHasSubmittedReview(false);
      setUserReview(null);
      setReceivedReview(null);
    } finally {
      setReviewStatusLoading(false);
    }
  };

  const loadTask = async () => {
    if (!taskId) return;
    
    setLoading(true);
    try {
      const response = await api.get<Task>(`/tasks/${taskId}`);
      if (response.success && response.data) {
        setTask(response.data);
        // Debug: log rating values
        if (response.data.postedBy) {
          console.log('Owner rating:', response.data.postedBy.ownerRating);
        }
        if (response.data.assignedTo) {
          console.log('Helper rating:', response.data.assignedTo.helperRating);
        }
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
    }
  };

  const handleCompleteTask = async () => {
    if (!taskId) return;

    setCompleting(true);
    try {
      const response = await api.post(`/tasks/${taskId}/complete`, {});
      if (response.success) {
        toast.success("Task marked as complete! Waiting for owner confirmation.");
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

  const handleConfirmTask = async () => {
    if (!taskId) return;

    setCompleting(true);
    try {
      const response = await api.post(`/tasks/${taskId}/confirm`, {});
      if (response.success) {
        toast.success("Task confirmed as completed!");
        loadTask(); // Reload task to update status
      } else {
        toast.error(response.message || "Failed to confirm task");
      }
    } catch (error) {
      toast.error("Failed to confirm task");
    } finally {
      setCompleting(false);
    }
  };

  const handleCancelTask = async () => {
    if (!taskId) return;

    setCanceling(true);
    try {
      const response = await api.post(`/tasks/${taskId}/cancel`, {});
      if (response.success) {
        // Use the message from backend which will be different for applicants vs owners/helpers
        toast.success(response.message || "Operation completed successfully.");
        await loadTask(); // Refresh task state
      } else {
        toast.error(response.message || "Failed to cancel task");
      }
    } catch (error) {
      toast.error("Failed to cancel task");
    } finally {
      setCanceling(false);
    }
  };

  const isTaskOwner = task && user && (task.postedBy?._id?.toString?.() || task.postedBy?._id || task.postedBy)?.toString() === user._id;
  const isTaskHelper = task && user && (task.assignedTo?._id?.toString?.() || task.assignedTo?._id || task.assignedTo)?.toString() === user._id;
  const isTaskApplicant = task && user && task.applicants?.some(app => (app?._id?.toString?.() || app?._id || app)?.toString() === user._id);
  const hasApplied = task?.applicants?.some(app => app._id === user?._id);

  const handleSubmitReview = async (rating: number, comment: string, revieweeId: string, taskId: string) => {
    try {
      const response = await api.post(`/tasks/${taskId}/review`, {
        rating,
        comment,
        revieweeId,
      });
      
      if (response.success) {
        toast.success("Review submitted successfully!");
        setHasSubmittedReview(true);
        // Store the review data from the response
        if (response.data) {
          setUserReview({
            rating: response.data.rating,
            comment: response.data.comment || '',
            createdAt: response.data.createdAt || new Date().toISOString(),
          });
        }
        // Reload task to update rating and review-related data
        // Add a small delay to ensure backend has updated the rating
        setTimeout(() => {
          loadTask();
          checkReviewStatus();
        }, 1000);
      } else {
        throw new Error(response.message || "Failed to submit review");
      }
    } catch (error) {
      console.error('Failed to submit review:', error);
      throw error;
    }
  };

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

  const petImage = task?.pet?.photos?.[0] ?? getDefaultPetImage(task?.pet?.type);

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
  const timeDisplay = task.time || (task.date ? new Date(task.date).toLocaleDateString() : 'Flexible');
  const typeDisplay = task.type ? task.type.charAt(0).toUpperCase() + task.type.slice(1) : 'Task';

  // Format rating display
  const formatRating = (rating?: number): string => {
    // Check if rating is undefined, null, or 0
    if (rating === undefined || rating === null || rating === 0) {
      return 'No rating';
    }
    // Ensure rating is a valid number
    const numRating = Number(rating);
    if (isNaN(numRating) || numRating === 0) {
      return 'No rating';
    }
    return numRating.toFixed(1);
  };


  return (
    <div className="min-h-screen pt-24 pb-24 px-4">
      <div className="max-w-[1200px] mx-auto">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => {
            if (returnTo === 'owner-profile' || returnTo === 'helper-profile' || returnTo === 'profile') {
              // Navigate back to profile page with activeTab parameter
              onNavigate(returnTo, { activeTab: activeTab || 'tasks' });
            } else {
              onNavigate('tasks');
            }
          }}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {returnTo === 'owner-profile' || returnTo === 'helper-profile' || returnTo === 'profile' ? 'Back to My Tasks' : 'Back to Tasks'}
        </Button>

        <div className="space-y-6">
          {/* First Row: Task Information + Owner Info */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Task Information - Takes 2 columns */}
            <Card className="lg:col-span-2 p-6 border-0 shadow-md h-full flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-primary" style={{ fontWeight: 700, fontSize: '32px' }}>{task.title}</h1>
                    <Badge 
                      className={`${
                        task.status === 'open' ? 'bg-green-500' :
                        task.status === 'pending' ? 'bg-blue-500' :
                        task.status === 'in_progress' ? 'bg-blue-500' :
                        task.status === 'pending_confirmation' ? 'bg-yellow-500' :
                        task.status === 'cancelled' ? 'bg-green-500' :
                        task.status === 'completed' ? 'bg-gray-500' :
                        'bg-primary'
                      } text-white`}
                      style={{ fontWeight: 600 }}
                    >
                      {task.status === 'open' && isHelper() ? 'pending' : task.status === 'pending_confirmation' ? 'pending confirmation' : task.status === 'open' ? task.status : task.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <Badge className="bg-primary text-white" style={{ fontWeight: 600 }}>{typeDisplay}</Badge>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 mb-6">
                <div className="flex items-center gap-33">
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
                    <Banknote className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Reward</div>
                    <div className="text-primary" style={{ fontWeight: 700, fontSize: '24px' }}>{rewardDisplay}</div>
                  </div>
                </div>
              </div>

              <div className="flex-1">
                <h3 className="mb-3" style={{ fontWeight: 600 }}>Task Description</h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {task.description || "No description provided."}
                </p>
              </div>
            </Card>

            {/* Owner Info - Takes 1 column */}
            {task.postedBy && (
              <Card className="p-6 border-0 shadow-md h-full flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <Heart className="w-5 h-5 text-primary fill-primary" />
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Task Owner</h3>
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <Avatar 
                    className="w-16 h-16 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => onNavigate('helper-public-profile', { userId: task.postedBy?._id, viewRole: 'owner' })}
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
                        onClick={() => onNavigate('helper-public-profile', { userId: task.postedBy?._id, viewRole: 'owner' })}
                      >
                        {task.postedBy.name}
                      </h4>
                      <Shield className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm" style={{ fontWeight: 600 }}>
                        {formatRating(task.postedBy?.ownerRating)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Owner stats to fill space */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-primary/5 rounded-lg px-3 py-2">
                    <div className="text-primary" style={{ fontWeight: 700 }}>
                      {allTasksForCalculation.filter(
                        (t: any) => (t.postedBy?._id || t.postedBy)?.toString() === (task.postedBy?._id || '').toString()
                      ).length}
                    </div>
                    <div className="text-xs text-muted-foreground">Tasks Posted</div>
                  </div>
                  <div className="bg-accent/5 rounded-lg px-3 py-2">
                    <div className="text-accent" style={{ fontWeight: 700 }}>
                      {allTasksForCalculation.filter(
                        (t: any) =>
                          (t.postedBy?._id || t.postedBy)?.toString() === (task.postedBy?._id || '').toString() &&
                          t.status === 'completed'
                      ).length}
                    </div>
                    <div className="text-xs text-muted-foreground">Tasks Completed</div>
                  </div>
                </div>

                <div className="flex gap-2 mt-auto">
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
          </div>

          {/* Second Row: Pet Information + Task Status */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Pet Information - Takes 2 columns */}
            {task.pet && (
              <Card className="lg:col-span-2 p-6 border-0 shadow-md h-full flex flex-col">
                <h3 className="mb-4" style={{ fontWeight: 600 }}>Pet Information</h3>
                <div className="flex gap-6 flex-1">
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

            {/* Right column content - unified Task Status card for all states */}
            <div className="space-y-4">
              <Card className="p-6 border-0 shadow-md h-full flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="mb-0" style={{ fontWeight: 600 }}>Task Status</h3>
                  <Badge 
                    className={
                      task.status === 'open'
                        ? 'bg-accent !text-white border-transparent'
                        : task.status === 'pending'
                        ? 'bg-chart-6 !text-white border-transparent'
                        : task.status === 'in_progress'
                        ? 'bg-chart-5 !text-white border-transparent'
                        : task.status === 'pending_confirmation'
                        ? 'bg-chart-7 !text-white border-transparent'
                        : task.status === 'cancelled'
                        ? 'bg-chart-8 !text-white border-transparent'
                        : task.status === 'completed'
                        ? 'bg-primary !text-white border-transparent'
                        : 'bg-secondary !text-secondary-foreground border-transparent'
                    }
                  >
                    {task.status === 'pending_confirmation' ? 'pending confirmation' : task.status?.replace(/_/g, ' ') || 'unknown'}
                  </Badge>
                </div>

                <div className="bg-secondary/20 p-4 rounded-2xl">
                  <div className="text-sm text-muted-foreground mb-1">You'll earn</div>
                  <div className="text-primary" style={{ fontWeight: 700, fontSize: '36px' }}>{rewardDisplay}</div>
                  <div className="text-sm text-muted-foreground">per session</div>
                </div>

                <div className="space-y-3 mt-auto">
                  {/* Open / Pending */}
                  {(task.status === "open" || task.status === "pending") && (
                    <>
                      {isTaskOwner && task.applicants && (
                        <Button
                          variant="outline"
                          onClick={() => setApplicantsDialogOpen(true)}
                          className="flex items-center gap-2 w-full"
                        >
                          <Users className="w-4 h-4" />
                          View Applications ({task.applicants.length})
                        </Button>
                      )}

                      {!isTaskOwner && isAuthenticated && (
                        <>
                          <Button 
                            size="lg" 
                            className="w-full bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 rounded-full"
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
                        </>
                      )}
                    </>
                  )}

                  {/* In Progress */}
                  {task.status === "in_progress" && (
                    <>
                      {isTaskHelper && (
                        <Button 
                          size="lg"
                          className="w-full !bg-green-600 hover:!bg-green-700 !text-white shadow-lg rounded-full"
                          onClick={handleCompleteTask}
                          disabled={completing}
                        >
                          {completing ? 'Completing...' : 'Complete Task'}
                        </Button>
                      )}
                      {isTaskOwner && (
                        <p className="text-sm text-muted-foreground text-center">
                          Task is currently in progress.
                        </p>
                      )}
                    </>
                  )}

                  {/* Pending Confirmation */}
                  {task.status === "pending_confirmation" && (
                    <>
                      {isTaskOwner && (
                        <Button 
                          size="lg"
                          className="w-full !bg-green-600 hover:!bg-green-700 !text-white shadow-lg rounded-full"
                          onClick={handleConfirmTask}
                          disabled={completing}
                        >
                          {completing ? 'Confirming...' : 'Confirm Completion'}
                        </Button>
                      )}
                      {isTaskHelper && (
                        <p className="text-sm text-muted-foreground text-center">
                          Awaiting owner confirmation.
                        </p>
                      )}
                    </>
                  )}

                  {/* Cancel Task (owner, assigned helper) or Withdraw Application (applicant) */}
                  {(isTaskOwner || isTaskHelper || isTaskApplicant) && task.status !== "completed" && task.status !== "cancelled" && (
                    <Button
                      variant="outline"
                      className="w-full border-red-500 text-red-600 hover:bg-red-50"
                      onClick={handleCancelTask}
                      disabled={canceling}
                    >
                      {canceling 
                        ? (isTaskApplicant && !isTaskOwner && !isTaskHelper ? 'Withdrawing...' : 'Cancelling...')
                        : (isTaskApplicant && !isTaskOwner && !isTaskHelper ? 'Withdraw Application' : 'Cancel Task')
                      }
                    </Button>
                  )}

                  {/* Completed */}
                  {task.status === "completed" && (
                    <div className="space-y-3">
                      {/* Hide review details from status card; only show CTA when not submitted */}
                      {reviewStatusLoading ? (
                        <div className="text-sm text-muted-foreground text-center">
                          Loading review status...
                        </div>
                      ) : hasSubmittedReview ? (
                        <div className="text-sm text-muted-foreground text-center">
                          Review submitted.
                        </div>
                      ) : (
                        <Button 
                          size="lg"
                          className="w-full !bg-primary hover:!bg-primary/90 !text-white rounded-full"
                          onClick={() => setReviewDialogOpen(true)}
                        >
                          Click to Review
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </Card>

            </div>
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
          onViewProfile={(applicantId) => onNavigate('helper-public-profile', { userId: applicantId })}
          onConfirmHelper={(applicantId) => handleAssignHelper(applicantId.toString())}
          onMessage={(applicantId) => onNavigate('messages', { selectedUserId: applicantId })}
        />
      )}

      {/* Review Dialog */}
      {task && ((isTaskOwner && task.assignedTo) || (isTaskHelper && task.postedBy)) && (
        <ReviewDialog
          open={reviewDialogOpen}
          onOpenChange={setReviewDialogOpen}
          revieweeName={isTaskOwner ? task.assignedTo?.name || "" : task.postedBy?.name || ""}
          revieweeAvatar={isTaskOwner ? task.assignedTo?.profilePhoto : task.postedBy?.profilePhoto}
          revieweeId={isTaskOwner ? task.assignedTo?._id || "" : task.postedBy?._id || ""}
          taskId={taskId || ""}
          isOwnerReviewingHelper={!!isTaskOwner}
          onSubmit={handleSubmitReview}
        />
      )}
    </div>
  );
}
