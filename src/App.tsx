import { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { Navigation } from "./components/Navigation";
import { LandingPage } from "./components/LandingPage";
import { TasksPage } from "./components/TasksPage";
import { FindHelpersPage } from "./components/FindHelpersPage";
import { TaskDetailPage } from "./components/TaskDetailPage";
import { PostTaskPage } from "./components/PostTaskPage";
import { MessagesPage } from "./components/MessagesPage";
import { ProfilePage } from "./components/ProfilePage";
import { HelperPublicProfilePage } from "./components/HelperPublicProfilePage";
import { AuthPage } from "./components/AuthPage";
import { Toaster, toast } from "sonner";
import { useUser } from "./hooks/useUser";

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
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
  
  // Map URL paths to page identifiers
  const getPathPageMap = () => {
    const pathMap: Record<string, string> = {
      "/": "landing",
      "/tasks": "tasks",
      "/find-helpers": "find-helpers",
      "/post-task": "post-task",
      "/messages": "messages",
      "/profile": "profile",
      "/owner-profile": "owner-profile",
      "/helper-profile": "helper-profile",
      "/signin": "auth",
      "/signup": "auth"
    };
    
    // Handle dynamic routes
    if (location.pathname.startsWith("/task/")) {
      pathMap[location.pathname] = "task-detail";
    } else if (location.pathname.startsWith("/helper/")) {
      pathMap[location.pathname] = "helper-public-profile";
    }
    
    return pathMap;
  };

  const handleNavigate = (page: string, params?: Record<string, any>) => {
    // Check if the target page requires authentication
    // Only check if user loading is complete
    if (!userLoading && protectedRoutes.includes(page) && !isAuthenticated) {
      toast.error("Please log in to continue");
      navigate("/signin");
      return;
    }
    
    // Save current scroll position before navigating
    scrollPositions.current[location.pathname] = window.scrollY;
    
    // Map page identifiers to URL paths
    const pagePathMap: Record<string, string> = {
      landing: "/",
      tasks: "/tasks",
      "find-helpers": "/find-helpers",
      "post-task": "/post-task",
      messages: "/messages",
      profile: "/profile",
      "owner-profile": "/owner-profile",
      "helper-profile": "/helper-profile",
      auth: "/signin"
    };
    
    // Handle dynamic routes
    if (page === "task-detail" && params?.taskId) {
      const returnTo = params?.returnTo;
      const url = returnTo ? `/task/${params.taskId}?returnTo=${returnTo}` : `/task/${params.taskId}`;
      navigate(url);
    } else if (page === "helper-public-profile" && (params?.userId || params?.helperId)) {
      const targetUserId = params?.userId || params?.helperId;
      navigate(`/helper/${targetUserId}`);
    } else if (pagePathMap[page]) {
      navigate(pagePathMap[page]);
    } else {
      navigate("/");
    }
  };

  useEffect(() => {
    // Restore scroll position after page change
    const savedPosition = scrollPositions.current[location.pathname] || 0;
    window.scrollTo(0, savedPosition);
  }, [location.pathname]);

  useEffect(() => {
    fetch("http://localhost:3001/api/health")
      .then(res => res.json())
      .then(data => console.log("✅ Backend:", data))
      .catch(err => console.error("❌ Connection failed:", err));
  }, []);

  // Route protection - only runs after loading completes
  useEffect(() => {
    if (userLoading) return;

    const currentPage = getPathPageMap()[location.pathname] || "landing";
    
    // Check authentication
    if (protectedRoutes.includes(currentPage) && !isAuthenticated) {
      toast.error("Please log in to continue");
      navigate("/signin");
      return;
    }
    
    // Check role-based access
    if (ownerOnlyRoutes.includes(currentPage) && isAuthenticated && !isOwner()) {
      toast.error("Only owners can access this page");
      navigate("/");
      return;
    }
    
    if (helperOnlyRoutes.includes(currentPage) && isAuthenticated && !isHelper()) {
      toast.error("Only helpers can access this page");
      navigate("/");
      return;
    }
  }, [userLoading, isAuthenticated, isOwner, isHelper, location.pathname, navigate]);

  const renderPage = () => {
    const pathPageMap = getPathPageMap();
    const currentPage = pathPageMap[location.pathname] || "landing";
    
    // Extract params from URL for dynamic routes
    let navigationParams: Record<string, any> = {};
    
    if (location.pathname.startsWith("/task/")) {
      const taskId = location.pathname.split("/")[2];
      navigationParams.taskId = taskId;
      // Extract returnTo from query string
      const searchParams = new URLSearchParams(location.search);
      const returnTo = searchParams.get('returnTo');
      if (returnTo) {
        navigationParams.returnTo = returnTo;
      }
    } else if (location.pathname.startsWith("/helper/")) {
      const userId = location.pathname.split("/")[2];
      navigationParams.userId = userId;
    }
    
    switch (currentPage) {
      case "landing":
        return <LandingPage onNavigate={handleNavigate} />;
      case "tasks":
        return <TasksPage onNavigate={handleNavigate} />;
      case "find-helpers":
        return <FindHelpersPage onNavigate={handleNavigate} />;
      case "task-detail":
        return <TaskDetailPage onNavigate={handleNavigate} taskId={navigationParams.taskId} returnTo={navigationParams.returnTo} />;
      case "post-task":
        return <PostTaskPage onNavigate={handleNavigate} />;
      case "messages":
        return <MessagesPage onNavigate={handleNavigate} selectedUserId={navigationParams.selectedUserId} />;
      case "profile":
        // Determine user type for profile page
        const userType = isHelper() ? 'helper' : 'owner';
        return <ProfilePage onNavigate={handleNavigate} userType={userType} />;
      case "owner-profile":
        return <ProfilePage onNavigate={handleNavigate} userType="owner" />;
      case "helper-profile":
        return <ProfilePage onNavigate={handleNavigate} userType="helper" />;
      case "helper-public-profile":
        return <HelperPublicProfilePage onNavigate={handleNavigate} userId={navigationParams.userId} />;
      case "view-profile":
        // View helper profile - redirect to public helper profile
        return <HelperPublicProfilePage onNavigate={handleNavigate} userId={navigationParams.userId} />;
      case "auth":
        return <AuthPage onNavigate={handleNavigate} />;
      default:
        return <LandingPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {location.pathname !== "/signin" && location.pathname !== "/signup" && (
        <Navigation currentPage={getPathPageMap()[location.pathname] || "landing"} onNavigate={handleNavigate} />
      )}
      {renderPage()}
      <Toaster position="top-center" richColors />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}