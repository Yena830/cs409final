import { useState, useEffect, useRef } from "react";
import { Navigation } from "./components/Navigation";
import { LandingPage } from "./components/LandingPage";
import { TasksPage } from "./components/TasksPage";
import { FindHelpersPage } from "./components/FindHelpersPage";
import { TaskDetailPage } from "./components/TaskDetailPage";
import { PostTaskPage } from "./components/PostTaskPage";
import { MessagesPage } from "./components/MessagesPage";
import { ProfilePage } from "./components/ProfilePage";
import { OwnerProfilePage } from "./components/OwnerProfilePage";
import { HelperProfilePage } from "./components/HelperProfilePage";
import { HelperPublicProfilePage } from "./components/HelperPublicProfilePage";
import { AuthPage } from "./components/AuthPage";
import { Toaster, toast } from "sonner";
import { useUser } from "./hooks/useUser";

export default function App() {
  const [currentPage, setCurrentPage] = useState("landing");
  const [navigationParams, setNavigationParams] = useState<Record<string, any>>({});
  const scrollPositions = useRef<Record<string, number>>({});
  const { isAuthenticated, loading: userLoading, isOwner, isHelper } = useUser();

  // Protected routes that require authentication
  const protectedRoutes = [
    "post-task", 
    "profile", 
    "messages", 
    "view-profile", 
    "owner-profile", 
    "helper-profile", 
    "helper-public-profile"
  ];
  
  // Role-based routes
  const ownerOnlyRoutes = ["owner-profile"];
  const helperOnlyRoutes = ["helper-profile"];
  
  // Check if current route requires authentication
  const requiresAuth = protectedRoutes.includes(currentPage);
  
  // Check if current route requires specific role
  const requiresOwnerRole = ownerOnlyRoutes.includes(currentPage);
  const requiresHelperRole = helperOnlyRoutes.includes(currentPage);

  const handleNavigate = (page: string, params?: Record<string, any>) => {
    // Check if the target page requires authentication
    // Only check if user loading is complete
    if (!userLoading && protectedRoutes.includes(page) && !isAuthenticated) {
      toast.error("Please log in to continue");
      setCurrentPage("auth");
      return;
    }
    
    // Save current scroll position before navigating
    scrollPositions.current[currentPage] = window.scrollY;
    setCurrentPage(page);
    setNavigationParams(params || {});
  };

  useEffect(() => {
    // Restore scroll position after page change
    const savedPosition = scrollPositions.current[currentPage] || 0;
    window.scrollTo(0, savedPosition);
  }, [currentPage]);

  useEffect(() => {
    fetch("http://localhost:3001/api/health")
      .then(res => res.json())
      .then(data => console.log("✅ Backend:", data))
      .catch(err => console.error("❌ Connection failed:", err));
  }, []);

  // Route protection - only runs after loading completes
  useEffect(() => {
    if (userLoading) return;

    // Check authentication
    if (requiresAuth && !isAuthenticated) {
      toast.error("Please log in to continue");
      setCurrentPage("auth");
      return;
    }

    // Check role-based access
    if (requiresOwnerRole && isAuthenticated && !isOwner()) {
      toast.error("Only owners can access this page");
      setCurrentPage("landing");
      return;
    }

    if (requiresHelperRole && isAuthenticated && !isHelper()) {
      toast.error("Only helpers can access this page");
      setCurrentPage("landing");
      return;
    }
  }, [userLoading, isAuthenticated, requiresAuth, requiresOwnerRole, requiresHelperRole, isOwner, isHelper, currentPage]);

  const renderPage = () => {
    switch (currentPage) {
      case "landing":
        return <LandingPage onNavigate={handleNavigate} />;
      case "tasks":
        return <TasksPage onNavigate={handleNavigate} />;
      case "find-helpers":
        return <FindHelpersPage onNavigate={handleNavigate} />;
      case "task-detail":
        return <TaskDetailPage onNavigate={handleNavigate} taskId={navigationParams.taskId} />;
      case "post-task":
        return <PostTaskPage onNavigate={handleNavigate} />;
      case "messages":
        return <MessagesPage onNavigate={handleNavigate} selectedUserId={navigationParams.selectedUserId} />;
      case "profile":
        return <ProfilePage onNavigate={handleNavigate} userType={navigationParams.userType} />;
      case "owner-profile":
        return <OwnerProfilePage onNavigate={handleNavigate} />;
      case "helper-profile":
        return <HelperProfilePage onNavigate={handleNavigate} />;
      case "helper-public-profile":
        return <HelperPublicProfilePage onNavigate={handleNavigate} userId={navigationParams.userId} helperId={navigationParams.helperId} />;
      case "view-profile":
        // View helper profile - redirect to public helper profile
        return <HelperPublicProfilePage onNavigate={handleNavigate} userId={navigationParams.userId} helperId={navigationParams.helperId} />;
      case "auth":
        return <AuthPage onNavigate={handleNavigate} />;
      default:
        return <LandingPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {currentPage !== "auth" && (
        <Navigation currentPage={currentPage} onNavigate={handleNavigate} />
      )}
      {renderPage()}
      <Toaster position="top-center" richColors />
    </div>
  );
}