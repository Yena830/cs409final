/**
 * HelperPublicProfilePage - Public profile view for helpers
 * Anyone can view this page (if authenticated), but target user must have "helper" role
 */

import React, { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Star, MapPin, Shield, MessageCircle, Calendar, CheckCircle2, TrendingUp, Clock, ArrowLeft, Briefcase } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { EmptyState } from "./EmptyState";
import { toast } from "sonner";
import { api } from "../lib/api";
import { useUser } from "../hooks/useUser";
import type { User as UserType } from "../contexts/UserContext";

interface HelperPublicProfilePageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
  userId?: string | number;
  helperId?: string | number;
}

interface HelperUser extends UserType {
  experience?: string;
  certifications?: string[];
  specialties?: string[];
  rating?: number;
  reviewCount?: number;
  completedTasks?: number;
  verified?: boolean;
}

export function HelperPublicProfilePage({ onNavigate, userId, helperId }: HelperPublicProfilePageProps) {
  // Support both userId and helperId for backward compatibility
  const targetUserId = helperId || userId;
  const { user: currentUser, loading: userLoading, isAuthenticated } = useUser();
  const [loading, setLoading] = useState(true);
  const [helperUser, setHelperUser] = useState<HelperUser | null>(null);

  // Load helper user data
  useEffect(() => {
    if (!targetUserId) {
      toast.error("Helper ID not provided");
      onNavigate('find-helpers');
      return;
    }

    if (!isAuthenticated) {
      toast.error("Please log in to view profiles");
      onNavigate('auth');
      return;
    }

    loadHelperUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUserId, isAuthenticated]);

  const loadHelperUser = async () => {
    if (!targetUserId) return;
    
    setLoading(true);
    try {
      const response = await api.get<HelperUser>(`/users/${targetUserId}`);
      if (response.success && response.data) {
        const userData = response.data;
        
        // Allow both helper and owner roles
        if (!userData.roles || (!userData.roles.includes('helper') && !userData.roles.includes('owner'))) {
          toast.error("This user profile is not available");
          onNavigate('find-helpers');
          return;
        }
        
        setHelperUser(userData);
      } else {
        toast.error(response.message || "Failed to load helper profile");
        onNavigate('find-helpers');
      }
    } catch (error) {
      console.error('Failed to load helper user:', error);
      toast.error("Failed to load helper profile");
      onNavigate('find-helpers');
    } finally {
      setLoading(false);
    }
  };

  const handleMessage = () => {
    if (!helperUser) return;
    
    if (!isAuthenticated) {
      toast.error("Please log in to message helpers");
      onNavigate('auth');
      return;
    }
    
    onNavigate('messages', { selectedUserId: helperUser._id });
  };

  if (userLoading || loading) {
    return (
      <div className="min-h-screen pt-24 pb-24 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-muted-foreground">Loading helper profile...</div>
        </div>
      </div>
    );
  }

  if (!helperUser) {
    return (
      <div className="min-h-screen pt-24 pb-24 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-muted-foreground mb-4">Helper not found or not accessible.</div>
          <Button onClick={() => onNavigate('find-helpers')}>Back to Find Helpers</Button>
        </div>
      </div>
    );
  }

  // Check again if user is helper or owner (safety check)
  if (!helperUser.roles || (!helperUser.roles.includes('helper') && !helperUser.roles.includes('owner'))) {
    return (
      <div className="min-h-screen pt-24 pb-24 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-muted-foreground mb-4">This user profile is not available.</div>
          <Button onClick={() => onNavigate('find-helpers')}>Back to Find Helpers</Button>
        </div>
      </div>
    );
  }

  const completedTasks = helperUser.completedTasks || 0;
  const rating = helperUser.rating || 0;
  const reviewCount = helperUser.reviewCount || 0;

  const handleBack = () => {
    // Use browser history to go back to previous page
    // React Router manages the history, so back() will work for in-app navigation
    window.history.back();
  };

  return (
    <div className="min-h-screen pt-24 pb-24 px-4">
      <div className="max-w-[1200px] mx-auto">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Profile Header */}
        <Card className="p-8 mb-6 border-0 shadow-lg">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <Avatar className="w-32 h-32">
              <AvatarImage src={helperUser.profilePhoto || ""} alt={helperUser.name || ""} />
              <AvatarFallback className="bg-primary text-white text-3xl">
                {helperUser.name?.substring(0, 2).toUpperCase() || "H"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-primary" style={{ fontWeight: 700, fontSize: '32px' }}>
                      {helperUser.name || "Helper"}
                    </h1>
                    {helperUser.verified && (
                      <div className="relative group/badge">
                        <Shield className="w-6 h-6 text-primary fill-primary/20" />
                        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover/badge:opacity-100 transition-opacity pointer-events-none">
                          Verified Helper
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span style={{ fontWeight: 600 }}>{rating > 0 ? rating.toFixed(1) : '—'}</span>
                    {reviewCount > 0 && (
                      <span className="text-muted-foreground text-sm">
                        ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
                      </span>
                    )}
                  </div>
                </div>
                <Button 
                  className="bg-primary hover:bg-primary/90 text-white gap-2"
                  onClick={handleMessage}
                >
                  <MessageCircle className="w-4 h-4" />
                  Message
                </Button>
              </div>

              <p className="text-muted-foreground mb-6">
                {helperUser.bio || "No bio available."}
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
                        {completedTasks}
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
                        {rating > 0 ? rating.toFixed(1) : '—'}
                      </div>
                      <div className="text-xs text-muted-foreground">Rating</div>
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
                        {helperUser.createdAt ? new Date(helperUser.createdAt).getFullYear() : new Date().getFullYear()}
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
                      <div className="text-yellow-600" style={{ fontWeight: 700, fontSize: '24px' }}>
                        {reviewCount}
                      </div>
                      <div className="text-xs text-muted-foreground">Reviews</div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </Card>

        {/* Professional Details Section (Read-only) */}
        {(helperUser.experience || helperUser.specialties) && (
          <Card className="p-6 mb-6 border-0 shadow-lg">
            <h2 className="mb-4" style={{ fontWeight: 600, fontSize: '20px' }}>Professional Details</h2>

            {/* Experience */}
            {helperUser.experience && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="w-5 h-5 text-primary" />
                  <h3 style={{ fontWeight: 600 }}>Experience</h3>
                </div>
                <p className="text-muted-foreground ml-7">
                  {helperUser.experience}
                </p>
              </div>
            )}

            {/* Service Specialties */}
            {helperUser.specialties && helperUser.specialties.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-5 h-5 text-primary" />
                  <h3 style={{ fontWeight: 600 }}>Service Specialties</h3>
                </div>
                <div className="flex flex-wrap gap-2 ml-7">
                  {helperUser.specialties.map((specialty, index) => (
                    <Badge key={index} className="bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Reviews Section - Placeholder */}
        <Card className="p-6 border-0 shadow-lg">
          <h2 className="mb-4" style={{ fontWeight: 600, fontSize: '20px' }}>Reviews</h2>
          <EmptyState
            icon={Star}
            title={reviewCount === 0 ? "No reviews yet" : `${reviewCount} review${reviewCount !== 1 ? 's' : ''}`}
            description={reviewCount === 0 
              ? "This helper hasn't received any reviews yet." 
              : "Reviews will be displayed here."}
          />
        </Card>
      </div>
    </div>
  );
}

