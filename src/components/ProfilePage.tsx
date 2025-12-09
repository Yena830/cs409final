import { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Star, MapPin, Edit, Heart, Calendar,
  CheckCircle2, TrendingUp, Clock, PawPrint, Briefcase,
  ArrowLeft, PlusCircle
} from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";


import defaultDog from "../assets/default-dog.jpg";
import defaultCat from "../assets/default-cat.jpg";
import defaultBird from "../assets/default-bird.jpg";
import defaultRabbit from "../assets/default-rabbit.jpg";


const DEFAULT_PET_IMAGES: Record<string, string> = {
  dog: defaultDog,
  cat: defaultCat,
  bird: defaultBird,
  rabbit: defaultRabbit,
  other: "https://placehold.co/600x600/98FB98/FFFFFF?text=Pet",
};

// Function to get default pet image
const getDefaultPetImage = (petType?: string) => {
  if (!petType) return DEFAULT_PET_IMAGES.other;
  return DEFAULT_PET_IMAGES[petType.toLowerCase()] || DEFAULT_PET_IMAGES.other;
};

interface ProfilePageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
  userType?: 'owner' | 'helper';
  activeTab?: 'pets' | 'tasks' | 'reviews';
}

interface Pet {
  _id: string;
  name: string;
  type: string;
  breed?: string;
  height?: number;
  weight?: number;
  age?: number;
  gender?: string;
  notes?: string;
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

interface Review {
  _id: string;
  rating: number;
  comment: string;
  reviewer: {
    _id: string;
    name: string;
    profilePhoto?: string;
  };
  task: {
    _id: string;
    title: string;
  };
  createdAt: string;
}

// Backend Pet interface (matching PetFormDialog)
interface BackendPet {
  _id?: string;
  name: string;
  type: string;
  breed?: string;
  height?: number;
  weight?: number;
  age?: number;
  gender?: string;
  notes?: string;
  photos?: string[];
  owner?: string;
}

export function ProfilePage({ onNavigate, userType = 'owner', activeTab: initialActiveTab }: ProfilePageProps) {
  const { user, loading: userLoading, setUser, logout } = useUser();
  const [loading, setLoading] = useState(true);
  const [avatarKey, setAvatarKey] = useState(0);
  const [loadingPets, setLoadingPets] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [activeTab, setActiveTab] = useState<'pets' | 'tasks' | 'reviews'>(initialActiveTab || 'tasks');
  const [addingRole, setAddingRole] = useState(false); // New state to track role addition process
  const [removingRole, setRemovingRole] = useState(false);
  const [confirmRemoveRoleOpen, setConfirmRemoveRoleOpen] = useState(false);
  const [roleToRemove, setRoleToRemove] = useState<'owner' | 'helper' | null>(null);
  const hasRefreshedUser = useRef(false);
  const lastActiveTab = useRef<string | null>(null);

  // Update activeTab when initialActiveTab prop changes
  useEffect(() => {
    if (initialActiveTab) {
      setActiveTab(initialActiveTab);
    }
  }, [initialActiveTab]);

  // Clear reviews when userType changes to avoid showing wrong reviews
  useEffect(() => {
    setReviews([]);
  }, [userType]);

  // Function to refresh user data (can be called multiple times)
  // Use useCallback to prevent infinite loops, but don't include user in dependencies
  const refreshUserData = useCallback(async () => {
    try {
      const userResponse = await api.get(`/auth/me`);
      if (userResponse.success && userResponse.data) {
        console.log('User data from API:', userResponse.data);
        console.log('helperRating:', userResponse.data.helperRating);
        console.log('ownerRating:', userResponse.data.ownerRating);
        console.log('specialties:', userResponse.data.specialties);
        setUser(userResponse.data);
        // Load specialties from user data into helperDetails
        if (userType === 'helper' && userResponse.data.specialties) {
          setHelperDetails(prev => ({
            ...prev,
            specialties: userResponse.data.specialties || []
          }));
        }
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      // Continue even if refresh fails
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userType]);

  // Profile data from real user (computed for EditProfileDialog compatibility)
  const getProfileData = (): ProfileData => ({
    username: user?.name || "",
    bio: user?.bio || "",
    location: user?.location || "",
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
  
  // Reviews data
  const [reviews, setReviews] = useState<Review[]>([]);

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
      // Refresh user data to get latest rating information (only once on initial load)
      if (!hasRefreshedUser.current) {
        await refreshUserData();
        hasRefreshedUser.current = true;
      }
      
      if (userType === 'helper' && user?.specialties) {
        // If user data already loaded, sync specialties to helperDetails
        setHelperDetails(prev => ({
          ...prev,
          specialties: user.specialties || []
        }));
      }

      // Load tasks by default since activeTab starts as 'tasks'
      await loadTasks();
      setLoading(false);
    };

    initializeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLoading, user?._id]);

  // Load data when tab changes
  // Load pets when page loads (for owner) - needed for stats display
  useEffect(() => {
    if (userLoading || loading) return;
    if (!user || !user._id) return;
    
    // Load pets for owner users on initial load (needed for stats)
    if (userType === 'owner' && myPets.length === 0 && !loadingPets) {
      loadPets();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userLoading, loading, userType]);

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
      // Always refresh tasks when tasks tab is activated to show latest status
      console.log('Tasks tab activated, loading tasks...', {
        loadingTasks,
        userType,
        userId: user?._id
      });
      if (!loadingTasks) {
        loadTasks();
      } else {
        console.log('Tasks already loading, skipping...');
      }
    } else if (activeTab === 'reviews') {
      // Always reload reviews when reviews tab is activated to ensure correct role filtering
      // Clear reviews first to avoid showing stale data
      setReviews([]);
      loadReviews();
      // Refresh user data to get latest rating when switching to reviews tab
      // Only refresh if this is a new tab activation (not a re-render)
      if (lastActiveTab.current !== 'reviews') {
        lastActiveTab.current = 'reviews';
        // Use a small delay to avoid triggering the effect again immediately
        const timer = setTimeout(() => {
          refreshUserData();
        }, 300);
        return () => clearTimeout(timer);
      }
    } else {
      // Update lastActiveTab when switching away from reviews
      lastActiveTab.current = activeTab;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, userLoading, loading, userType]);

  // Refresh tasks when page regains focus (e.g., when returning from task detail page)
  useEffect(() => {
    if (!user || !user._id || userLoading || loading) return;

    const handleFocus = () => {
      if (activeTab === 'tasks' && !loadingTasks) {
        // Refresh tasks when page regains focus and tasks tab is active
        loadTasks();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && activeTab === 'tasks' && !loadingTasks) {
        // Refresh tasks when page becomes visible and tasks tab is active
        loadTasks();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userLoading, loading, activeTab, loadingTasks]);

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
        
        const userId = user._id.toString();
        
        // Filter tasks posted by this user (for owners)
        const posted = allTasks.filter(task => {
          const postedById = task.postedBy?._id?.toString() || task.postedBy?._id || task.postedBy;
          return postedById === userId;
        });
        
        console.log('ProfilePage - loadTasks:', {
          userId,
          allTasksCount: allTasks.length,
          postedCount: posted.length,
          userType,
          postedTasks: posted.map(t => ({
            id: t._id,
            title: t.title,
            postedBy: t.postedBy?._id?.toString() || t.postedBy?._id || t.postedBy
          }))
        });
        
        setPostedTasks(posted);
        
        // Helpers should only see tasks where they've been selected (assigned)
        const assigned = allTasks.filter(task => {
          const assignedToId = task.assignedTo?._id?.toString() || task.assignedTo?._id || task.assignedTo;
          return assignedToId === userId;
        });
        
        // Debug: Log task statuses for helpers
        if (userType === 'helper' && assigned.length > 0) {
          console.log('Helper tasks statuses:', assigned.map(t => ({
            id: t._id,
            title: t.title,
            status: t.status,
            statusType: typeof t.status,
            statusLength: t.status?.length,
            applicants: t.applicants?.length,
            isPending: t.status === 'pending',
            isOpen: t.status === 'open'
          })));
        }
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

  // Load reviews received by the current user (as reviewee)
  // Filter by role: helper only shows reviews from owners, owner only shows reviews from helpers
  const loadReviews = async () => {
    if (!user || !user._id) return;
    
    setLoadingReviews(true);
    // Clear reviews first to avoid showing stale data
    setReviews([]);

    try {
      // Fetch reviews filtered by user role
      // For helper: only show reviews where owner reviewed helper (user was the assigned helper)
      // For owner: only show reviews where helper reviewed owner (user was the task owner)
      const response = await api.get<Review[]>(`/users/${user._id}/reviews?role=${userType}`);
      if (response.success && response.data) {
        const reviewsData = Array.isArray(response.data) ? response.data : [];
        console.log(`ProfilePage - Loading reviews for ${userType}:`, {
          userType,
          userId: user._id,
          reviewsCount: reviewsData.length,
          reviews: reviewsData.map(r => ({
            id: r._id,
            reviewer: r.reviewer?.name,
            task: r.task?.title,
            rating: r.rating,
            comment: r.comment
          }))
        });
        setReviews(reviewsData);
      } else {
        toast.error(response.message || "Failed to load reviews");
        setReviews([]); // Clear on error
      }
    } catch (error) {
      console.error('Failed to load reviews:', error);
      toast.error("Failed to load reviews. Please try again.");
      setReviews([]); // Clear on error
    } finally {
      setLoadingReviews(false);
    }
  };

  // Determine which tasks to show based on user type
  const myTasks = userType === 'owner' ? postedTasks : assignedTasks;

  const handleSaveProfile = async (data: ProfileData) => {
    if (!user || !user._id) {
      throw new Error('User not found');
    }
    
    // Prepare data for update
    const updateData = {
      name: data.username,
      bio: data.bio,
      location: data.location,
      // expectedHourlyRate removed
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
        location: response.data.location,
        // expectedHourlyRate removed
        profilePhoto: response.data.profilePhoto
      });
      
      toast.success("Profile updated successfully!");
    } else {
      const errorMessage = response.message || "Failed to update profile";
      toast.error(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Add role switching functionality
  const handleAddRole = async (role: 'owner' | 'helper') => {
    if (!user) return;

    // Check if user already has this role
    if (user.roles.includes(role)) {
      toast.info(`You already have the ${role} role`);
      return;
    }

    setAddingRole(true);
    try {
      const response = await api.post<any>('/users/add-role', { role });

      if (response.success && response.data) {
        // Update user context
        setUser(response.data);
        toast.success(`Successfully added ${role} role!`);

        // If adding helper role and currently on owner profile page, notify user they can switch view
        if (role === 'helper' && userType === 'owner') {
          toast.info('You can now switch to helper view');
        }
      } else {
        toast.error(response.message || `Failed to add ${role} role`);
      }
    } catch (error) {
      console.error('Failed to add role:', error);
      toast.error(`Failed to add ${role} role. Please try again.`);
    } finally {
      setAddingRole(false);
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

  const handleRemoveRole = (role: 'owner' | 'helper') => {
    setRoleToRemove(role);
    setConfirmRemoveRoleOpen(true);
  };

  const confirmRemoveRole = async () => {
    if (!user || !roleToRemove) return;
    const isLastRole = user.roles.length === 1 && user.roles[0] === roleToRemove;
    setRemovingRole(true);
    try {
      const response = await api.post('/users/remove-role', { role: roleToRemove });
      if (response.success) {
        // Prevent role-based guard toast on the redirect immediately after removal
        sessionStorage.setItem('suppressRoleToast', 'true');

        // If backend says account deleted or no roles remain, log out and send to login
        if (response.data?.deleted || response.data?.roles?.length === 0 || isLastRole) {
          toast.success('Account deleted. Please sign up again to use PawfectMatch.');
          logout();
          // No roles left: send to login page as logged-out user
          onNavigate('auth');
          return;
        }
        if (response.data) {
          setUser(response.data);
          toast.success(`Removed ${roleToRemove} role`);
          onNavigate('landing');
        }
      } else {
        if (isLastRole) {
          // Fallback: if server failed but this was the last role, treat as logout to avoid being stuck
          sessionStorage.setItem('suppressRoleToast', 'true');
          toast.success(`Removed ${roleToRemove} role`);
          logout();
          onNavigate('auth');
        } else {
          toast.error(response.message || `Failed to remove ${roleToRemove} role`);
        }
      }
    } catch (error) {
      if (isLastRole) {
        sessionStorage.setItem('suppressRoleToast', 'true');
        toast.success(`Removed ${roleToRemove} role`);
        logout();
        onNavigate('auth');
      } else {
        toast.error(`Failed to remove ${roleToRemove} role`);
      }
    } finally {
      setRemovingRole(false);
      setConfirmRemoveRoleOpen(false);
      setRoleToRemove(null);
    }
  };

  const handleDeletePet = async (petId: string) => {
    if (!petId) return;
    try {
      const response = await api.del(`/pets/${petId}`);
      if (response.success) {
        toast.success("Pet deleted successfully");
        await loadPets();
      } else {
        toast.error(response.message || "Failed to delete pet");
      }
    } catch (error) {
      toast.error("Failed to delete pet");
    }
  };

  const handleSaveHelperDetails = async (data: HelperDetails) => {
    if (!user || !user._id) {
      toast.error('User not found');
      return;
    }
    
    try {
      // Save specialties to backend
      const response = await api.put(`/users/${user._id}`, {
        specialties: data.specialties
      });
      
      if (response.success && response.data) {
        setHelperDetails(data);
        // Update user context with new specialties
        setUser({
          ...user,
          specialties: response.data.specialties
        });
        toast.success("Professional details updated successfully!");
      } else {
        toast.error(response.message || "Failed to update professional details");
      }
    } catch (error) {
      console.error('Failed to save helper details:', error);
      toast.error("Failed to update professional details. Please try again.");
    }
  };

  const [applicantsData, setApplicantsData] = useState<any[]>([]);

  const handleViewApplicants = async (task: Task) => {
    setSelectedTask(task);
    setApplicantsDialogOpen(true);
    
    // Reload task to get fresh applicant data with all fields
    // Also load all tasks to calculate completed tasks for each applicant
    // IMPORTANT: Fetch full user data for each applicant to ensure we have the latest helperRating
    try {
      const [taskResponse, tasksResponse] = await Promise.all([
        api.get(`/tasks/${task._id}`),
        api.get<Task[]>('/tasks')
      ]);
      
      let allTasks: Task[] = [];
      if (tasksResponse.success && tasksResponse.data) {
        allTasks = Array.isArray(tasksResponse.data) ? tasksResponse.data : [];
      }
      
      if (taskResponse.success && taskResponse.data) {
        const updatedTask = taskResponse.data;
        
        console.log('Applicants data from task:', updatedTask.applicants);
        
        // Fetch full user data for each applicant to get the latest helperRating and other info
        const applicantsWithFullData = await Promise.all(
          (updatedTask.applicants || []).map(async (app: any) => {
            try {
              // Fetch full user data to get the latest helperRating
              const userResponse = await api.get(`/users/${app._id}`);
              if (userResponse.success && userResponse.data) {
                const fullUserData = userResponse.data;
                console.log(`Fetched full user data for ${app.name}:`, fullUserData);
                
                // Count completed tasks for this specific applicant helper
                const applicantId = app._id?.toString() || app._id;
                const completedTasks = allTasks.filter((t: Task) => {
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
                
                console.log(`ProfilePage - Applicant ${app.name} (${applicantId}):`, {
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
                  location: fullUserData.location || app.location,
                  bio: fullUserData.bio || app.bio,
                  specialties: fullUserData.specialties || app.specialties,
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
                  responseRate: 100, // Default
                  verified: false, // Default
                  experience: fullUserData.bio || app.bio || '', // Use bio as experience/introduction
                  certifications: fullUserData.specialties || app.specialties || [], // Use specialties as certifications
                  introduction: fullUserData.bio || app.bio || '',
                };
              }
            } catch (error) {
              console.error(`Failed to fetch user data for ${app._id}:`, error);
            }
            
          // Fallback to task.applicants data if user fetch fails
          const applicantId = app._id?.toString() || app._id;
          const completedTasks = allTasks.filter((t: Task) => {
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
              responseRate: 100,
              verified: false,
              experience: app.bio || '',
              certifications: app.specialties || [],
              introduction: app.bio || '',
            };
          })
        );
        
        // Filter out any null/undefined results
        const formatted = applicantsWithFullData.filter(Boolean);
        setApplicantsData(formatted);
      } else {
        // Fallback to basic data if reload fails
        const basic = (task.applicants || []).map((app: any) => {
          const applicantId = app._id?.toString() || app._id;
          const completedTasks = allTasks.filter((t: Task) => {
            const assignedToId = t.assignedTo?._id?.toString() || t.assignedTo?._id || t.assignedTo;
            return assignedToId === applicantId && t.status === 'completed';
          }).length;
          
          // Use the same rating logic as HelperPublicProfilePage
          const rating = app.helperRating || app.rating || 0;
          
          return {
            id: app._id,
            name: app.name,
            avatar: app.profilePhoto || '',
            rating: rating > 0 ? rating : 0,
            reviewCount: 0,
            location: app.location || '',
            tasksCompleted: completedTasks,
            responseRate: 100,
            verified: false,
            experience: app.bio || '',
            certifications: app.specialties || [],
            introduction: app.bio || '',
          };
        });
        setApplicantsData(basic);
      }
    } catch (error) {
      console.error('Failed to load applicants:', error);
      // Fallback to basic data
      const basic = (task.applicants || []).map((app: any) => {
        // Use the same rating logic as HelperPublicProfilePage
        const rating = app.helperRating || app.rating || 0;
        
        return {
          id: app._id,
          name: app.name,
          avatar: app.profilePhoto || '',
          rating: rating > 0 ? rating : 0,
          reviewCount: 0,
          location: app.location || '',
          tasksCompleted: 0, // Can't calculate without allTasks
          responseRate: 100,
          verified: false,
          experience: app.bio || '',
          certifications: app.specialties || [],
          introduction: app.bio || '',
        };
      });
      setApplicantsData(basic);
    }
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
        await loadTasks(); // Reload tasks
        setApplicantsDialogOpen(false);
      } else {
        toast.error(response.message || "Failed to assign helper");
      }
    } catch (error) {
      toast.error("Failed to assign helper");
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
            <Avatar className="w-32 h-32" key={`avatar-${avatarKey}-${user?.profilePhoto}`}>
              <AvatarImage 
                src={user?.profilePhoto ? `${user.profilePhoto}?t=${avatarKey}` : ""} 
                alt={user?.name || ""}
                onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                  console.error('Avatar image failed to load:', user?.profilePhoto, e);
                }}
                onLoad={() => {
                  console.log('Avatar image loaded successfully:', user?.profilePhoto);
                }}
              />
              <AvatarFallback className="bg-primary text-white text-3xl">
                {user?.name?.substring(0, 2).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-primary" style={{ fontWeight: 700, fontSize: '32px' }}>{user?.name || "User"}</h1>
                    {user?.roles && user.roles.length > 1 && (
                      <Badge variant="secondary" className="text-xs">
                        {user.roles.join(' & ')}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 text-muted-foreground">
                    <span>{user?.email || ""}</span>
                    {user?.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{user.location}</span>
                      </div>
                    )}
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

                  {/* Add role switching button */}
                  {!addingRole && user && (
                    <>
                      {userType === 'owner' && !user.roles.includes('helper') && (
                        <Button
                          variant="outline"
                          className="gap-2 hover:bg-accent hover:border-accent hover:text-accent-foreground transition-all"
                          onClick={() => handleAddRole('helper')}
                        >
                          <PlusCircle className="w-4 h-4" />
                          Become Helper
                        </Button>
                      )}
                      {userType === 'helper' && !user.roles.includes('owner') && (
                        <Button
                          variant="outline"
                          className="gap-2 hover:bg-accent hover:border-accent hover:text-accent-foreground transition-all"
                          onClick={() => handleAddRole('owner')}
                        >
                          <PlusCircle className="w-4 h-4" />
                          Become Owner
                        </Button>
                      )}
                      {userType === 'owner' && user.roles.includes('owner') && (
                        <Button
                          variant="outline"
                          className="gap-2 border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => handleRemoveRole('owner')}
                          disabled={removingRole}
                        >
                          Remove Owner
                        </Button>
                      )}
                      {userType === 'helper' && user.roles.includes('helper') && (
                        <Button
                          variant="outline"
                          className="gap-2 border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => handleRemoveRole('helper')}
                          disabled={removingRole}
                        >
                          Remove Helper
                        </Button>
                      )}
                    </>
                  )}

                  {addingRole && (
                    <Button variant="outline" disabled>
                      Adding Role...
                    </Button>
                  )}
                  {removingRole && (
                    <Button variant="outline" disabled>
                      Removing Role...
                    </Button>
                  )}
                </div>
              </div>

              <p className="text-muted-foreground mb-6">
                {user?.bio || "No bio added yet."}
              </p>

              {userType === 'helper' ? (
                // Helper Stats
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <Card className="p-4 border-0 bg-secondary/30 hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="text-primary" style={{ fontWeight: 700, fontSize: '24px' }}>
                          {assignedTasks.filter(t => t.assignedTo?._id === user._id && t.status === 'completed').length}
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
                          {(() => {
                            // Only count tasks that are actually assigned to the user (not just applied)
                            const trulyAssignedTasks = assignedTasks.filter(t => t.assignedTo?._id === user._id);
                            const completedCount = trulyAssignedTasks.filter(t => t.status === 'completed').length;
                            return trulyAssignedTasks.length > 0 
                              ? Math.round((completedCount / trulyAssignedTasks.length) * 100) 
                              : 0;
                          })()}%
                        </div>
                        <div className="text-xs text-muted-foreground">Completion</div>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-4 border-0 bg-secondary/30 hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center">
                        <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                      </div>
                      <div>
                        <div className="text-yellow-600" style={{ fontWeight: 700, fontSize: '24px' }}>
                          {(() => {
                            const rating = userType === 'helper' ? user?.helperRating : user?.ownerRating;
                            // Log for debugging
                            if (user) {
                              console.log(`ProfilePage - userType: ${userType}, rating:`, rating, 'user:', {
                                helperRating: user.helperRating,
                                ownerRating: user.ownerRating,
                                fullUser: user
                              });
                            }
                            // Show rating if it exists and is greater than 0, otherwise show —
                            // Also check if rating is a valid number (not NaN, not null, not undefined)
                            // Allow 0 rating to be shown as 0.0 (though unlikely)
                            if (rating == null || isNaN(rating)) {
                              return '—';
                            }
                            // Show rating even if it's 0 (though this is unlikely for a completed task with review)
                            return rating.toFixed(1);
                          })()}
                        </div>
                        <div className="text-xs text-muted-foreground">Rating</div>
                      </div>
                    </div>
                  </Card>
                </div>
              ) : (
                // Owner Stats
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
                          {postedTasks.filter(t => t.status === 'open' || t.status === 'pending' || t.status === 'in_progress' || t.status === 'pending_confirmation').length}
                        </div>
                        <div className="text-xs text-muted-foreground">Active Tasks</div>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-4 border-0 bg-secondary/30 hover:bg-secondary/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-yellow-500/10 rounded-full flex items-center justify-center">
                        <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                      </div>
                      <div>
                        <div className="text-yellow-600" style={{ fontWeight: 700, fontSize: '24px' }}>
                          {user?.ownerRating && user.ownerRating > 0 ? user.ownerRating.toFixed(1) : '—'}
                        </div>
                        <div className="text-xs text-muted-foreground">Rating</div>
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
          <TabsList className={`grid w-full md:w-auto ${userType === 'owner' ? 'grid-cols-3' : 'grid-cols-2'} mb-6`}>
            {userType === 'owner' && <TabsTrigger value="pets">My Pets</TabsTrigger>}
            <TabsTrigger value="tasks">My Tasks</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
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
                    <Card key={pet._id} className="overflow-hidden border-0 shadow-md hover:shadow-xl transition-shadow flex flex-col h-full">
                      <div className="aspect-square relative overflow-hidden">
                        <ImageWithFallback
                          src={
                            pet.photos?.[0] ?? getDefaultPetImage(pet.type)
                          }
                          alt={pet.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-5 flex flex-col flex-1 justify-between">
                        <div className="space-y-2">
                          <h3 className="mb-1" style={{ fontWeight: 600 }}>{pet.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {pet.breed || pet.type}
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                            {pet.height && <span>Height: {pet.height} in</span>}
                            {pet.weight && <span>Weight: {pet.weight} lbs</span>}
                            {pet.age && <span>Age: {pet.age} {pet.age === 1 ? 'year' : 'years'}</span>}
                            {pet.gender && <span>Gender: {pet.gender.charAt(0).toUpperCase() + pet.gender.slice(1)}</span>}
                          </div>
                          {pet.notes && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {pet.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => handleEditPet(pet)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => handleDeletePet(pet._id)}
                          >
                            Delete
                          </Button>
                        </div>
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
                  if (!task || !task._id) {
                    console.error('Invalid task in myTasks:', task);
                    return null;
                  }
                  
                  const petImage = task?.pet?.photos?.[0] ?? getDefaultPetImage(task?.pet?.type);
                  const applicantsCount = task.applicants?.length || 0;
                  const taskStatus = task.status?.trim() || '';
                  
                  return (
                    <Card key={task._id} className="p-6 border-0 shadow-md hover:shadow-xl transition-shadow">
                      <div className="flex gap-6">
                        <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0">
                          <ImageWithFallback
                            src={petImage}
                            alt={task.title || 'Task'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 style={{ fontWeight: 600 }}>{task.title || 'Untitled Task'}</h3>
                                {taskStatus && (
                                  <Badge
                                    className={
                                      taskStatus === 'open'
                                        ? 'bg-accent !text-white border-transparent'
                                        : taskStatus === 'pending'
                                        ? 'bg-chart-6 !text-white border-transparent'
                                        : taskStatus === 'in_progress'
                                        ? 'bg-chart-5 !text-white border-transparent'
                                        : taskStatus === 'pending_confirmation'
                                        ? 'bg-chart-7 !text-white border-transparent'
                                        : taskStatus === 'cancelled'
                                        ? 'bg-chart-8 !text-white border-transparent'
                                        : taskStatus === 'completed'
                                        ? 'bg-primary !text-white border-transparent'
                                        : 'bg-secondary !text-secondary-foreground border-transparent'
                                    }
                                  >
                                    {taskStatus === 'open'
                                      ? 'open'
                                      : taskStatus === 'pending'
                                      ? 'pending'
                                      : taskStatus === 'pending_confirmation'
                                      ? 'pending confirmation'
                                      : taskStatus.replace(/_/g, ' ')}
                                  </Badge>
                                )}
                              </div>
                              {userType === 'owner' ? (
                                <>
                                  {task.status === 'open' && (
                                    <button
                                      onClick={() => applicantsCount > 0 && handleViewApplicants(task)}
                                      className={`text-sm text-muted-foreground flex items-center gap-2 ${
                                        applicantsCount > 0 ? 'hover:text-primary cursor-pointer' : 'cursor-default'
                                      }`}
                                    >
                                      <Users className="w-4 h-4" />
                                      {applicantsCount} application{applicantsCount !== 1 ? 's' : ''} received
                                    </button>
                                  )}
                                  {task.status === 'pending_confirmation' && (
                                    <p className="text-sm text-yellow-600 flex items-center gap-2">
                                      <Clock className="w-4 h-4" />
                                      Waiting for your confirmation
                                    </p>
                                  )}
                                </>
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
                                onClick={() => onNavigate('task-detail', {
                                  taskId: task._id,
                                  returnTo: userType === 'owner' ? 'owner-profile' : 'helper-profile',
                                  activeTab: 'tasks'
                                })}
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

          {/* Reviews Tab */}
          <TabsContent value="reviews">
            {loadingReviews ? (
              <div className="text-center py-12">
                <div className="text-muted-foreground">Loading reviews...</div>
              </div>
            ) : reviews.length === 0 ? (
              <EmptyState
                icon={Star}
                title="No reviews yet!"
                description={
                  userType === 'owner'
                    ? "Reviews will appear here once helpers leave feedback on your completed tasks."
                    : "Reviews will appear here once pet owners leave feedback on your completed tasks."
                }
              />
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <Card key={review._id} className="p-6 border-0 shadow-md">
                    <div className="flex items-start gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={review.reviewer.profilePhoto} alt={review.reviewer.name} />
                        <AvatarFallback className="bg-primary text-white">
                          {review.reviewer.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 style={{ fontWeight: 600 }}>{review.reviewer.name}</h4>
                              <span className="text-sm text-muted-foreground">
                                for "{review.task.title}"
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= review.rating
                                      ? "text-yellow-500 fill-yellow-500"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
                            {review.comment}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
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
        onPhotoUploaded={(photoUrl) => {
          // Update user context immediately when photo is uploaded
          console.log('onPhotoUploaded called with:', photoUrl);
          console.log('Current user before update:', user);
          
          // Use a small delay to ensure state updates are processed
          setTimeout(() => {
            if (user) {
              const updatedUser = {
                ...user,
                profilePhoto: photoUrl
              };
              console.log('Updating user context with:', updatedUser);
              setUser(updatedUser);
              
              // Force avatar refresh by updating key
              setAvatarKey(prev => {
                const newKey = prev + 1;
                console.log('Updating avatarKey from', prev, 'to', newKey);
                return newKey;
              });
            }
          }, 100);
        }}
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
        applicants={applicantsData}
        selectedTask={selectedTask ? {
          title: selectedTask.title,
          applications: selectedTask.applicants?.length || 0
        } : null}
        onViewProfile={handleViewApplicantProfile}
        onConfirmHelper={handleConfirmHelper}
        onMessage={(applicantId) => onNavigate('messages', { selectedUserId: applicantId })}
      />

      <AlertDialog open={confirmRemoveRoleOpen} onOpenChange={setConfirmRemoveRoleOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Role</AlertDialogTitle>
            <AlertDialogDescription>
              {roleToRemove === 'owner'
                ? 'Removing owner role will remove owner features. Continue?'
                : 'Removing helper role will remove helper features. Continue?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setConfirmRemoveRoleOpen(false);
                setRoleToRemove(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveRole} disabled={removingRole}>
              {removingRole ? 'Removing...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
