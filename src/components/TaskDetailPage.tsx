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
import { ReviewDialog } from "./ReviewDialog";

interface TaskDetailPageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
  taskId?: string;
  returnTo?: string;
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
    rating?: number;
  };
  assignedTo?: {
    _id: string;
    name: string;
    profilePhoto?: string;
    rating?: number;
  };
  applicants?: Array<{
    _id: string;
    name: string;
    profilePhoto?: string;
  }>;
}

export function TaskDetailPage({ onNavigate, taskId, returnTo }: TaskDetailPageProps) {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [applicantsDialogOpen, setApplicantsDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [hasSubmittedReview, setHasSubmittedReview] = useState(false);
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
  const { user, isOwner, isHelper, isAuthenticated } = useUser();

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
      checkReviewStatus();
    }
  }, [task, user, taskId]);

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
          console.log('Owner rating:', response.data.postedBy.rating);
        }
        if (response.data.assignedTo) {
          console.log('Helper rating:', response.data.assignedTo.rating);
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
  const isTaskHelper = task && user && task.assignedTo?._id === user._id;
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

  const petImage = task?.pet?.photos?.[0] ?? "https://placehold.co/600x400?text=No+Pet+Photo";

  const rewardDisplay = task.reward || (task.budget ? `$${task.budget}` : '$0');
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
          onClick={() => {
            if (returnTo === 'owner-profile' || returnTo === 'helper-profile' || returnTo === 'profile') {
              onNavigate(returnTo);
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
                        task.status === 'in_progress' ? 'bg-blue-500' :
                        task.status === 'completed' ? 'bg-gray-500' :
                        'bg-primary'
                      } text-white`}
                      style={{ fontWeight: 600 }}
                    >
                      {task.status === 'open' && isHelper() ? 'pending' : task.status === 'open' ? task.status : task.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <Badge className="bg-primary text-white" style={{ fontWeight: 600 }}>{typeDisplay}</Badge>
                </div>
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
                      <span className="text-sm" style={{ fontWeight: 600 }}>
                        {formatRating(task.postedBy?.rating)}
                      </span>
                    </div>
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

          {/* Second Row: Pet Information + Helper Info / Task Status */}
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

            {/* Right column content - depends on task status */}
            {task.status === "open" ? (
              /* Task Status - Show when status is open */
              ((isTaskOwner || isTaskHelper)) && (
                <Card className="p-4 border-0 shadow-md h-full flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="mb-0" style={{ fontWeight: 600 }}>Task Status</h3>
                    <Badge 
                      className="bg-accent !text-white border-transparent"
                    >
                      {task.status?.replace(/_/g, ' ') || 'unknown'}
                    </Badge>
                  </div>
                  {isTaskOwner && task.applicants && task.applicants.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => setApplicantsDialogOpen(true)}
                      className="flex items-center gap-2 w-full mt-auto"
                    >
                      <Users className="w-4 h-4" />
                      View Applications ({task.applicants.length})
                    </Button>
                  )}
                </Card>
              )
            ) : (
              /* Helper Info - Show when status is not open */
              <>
                {task.assignedTo && (
                  <Card className="p-6 border-0 shadow-md h-full flex flex-col">
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
                          <span className="text-sm" style={{ fontWeight: 600 }}>
                            {formatRating(task.assignedTo?.rating)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-auto">
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

                {/* Apply Card - Show for helpers when no helper assigned */}
                {isHelper() && !isTaskOwner && !task.assignedTo && (
                  <Card className="p-6 border-0 shadow-md bg-secondary/20 h-full flex flex-col">
                    <h3 className="mb-4" style={{ fontWeight: 600 }}>Apply for this Task</h3>
                    <div className="space-y-4 flex-1">
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
              </>
            )}
          </div>

          {/* Third Row: Task Status / Apply Card - Full Width (only when status is not open) */}
          {task.status !== "open" && (
            <div>
              {/* Apply Card - Show for helpers when helper is assigned */}
              {isHelper() && !isTaskOwner && task.assignedTo && (
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

              {/* Task Status - Show for owner or helper when status is not open */}
              {((isTaskOwner || isTaskHelper)) && (
                <Card className="p-4 border-0 shadow-md">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="mb-0" style={{ fontWeight: 600 }}>Task Status</h3>
                    <Badge 
                      className={
                        task.status === 'in_progress'
                          ? 'bg-chart-5 !text-white border-transparent'
                          : task.status === 'completed'
                          ? 'bg-primary !text-white border-transparent'
                          : 'bg-secondary !text-secondary-foreground border-transparent'
                      }
                    >
                      {task.status?.replace(/_/g, ' ') || 'unknown'}
                    </Badge>
                  </div>
                  {task.status === "in_progress" && isTaskOwner && (
                    <Button 
                      size="lg"
                      className="w-full !bg-green-600 hover:!bg-green-700 !text-white"
                      onClick={handleCompleteTask}
                      disabled={completing}
                    >
                      {completing ? 'Completing...' : 'Complete Task'}
                    </Button>
                  )}
                  {task.status === "completed" && (
                    <div className="space-y-4">
                      {/* Review received from the other party */}
                      {receivedReview && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">
                              Review from {receivedReview.reviewerName}:
                            </span>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= receivedReview.rating
                                      ? "text-yellow-500 fill-yellow-500"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          {receivedReview.comment && (
                            <div className="bg-muted/50 p-3 rounded-lg">
                              <p className="text-sm text-foreground">{receivedReview.comment}</p>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* User's own review */}
                      {hasSubmittedReview && userReview ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">Your Review:</span>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= userReview.rating
                                      ? "text-yellow-500 fill-yellow-500"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          {userReview.comment && (
                            <div className="bg-muted/50 p-3 rounded-lg">
                              <p className="text-sm text-foreground">{userReview.comment}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <Button 
                          size="lg"
                          className="w-full !bg-primary hover:!bg-primary/90 !text-white"
                          onClick={() => setReviewDialogOpen(true)}
                        >
                          Click to Review
                        </Button>
                      )}
                    </div>
                  )}
                </Card>
              )}
            </div>
          )}
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
