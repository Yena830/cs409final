import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";

interface ProfileData {
  username: string;
  bio: string;
  location: string;
  profilePhoto: string;
}

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileData: ProfileData;
  onSave: (data: ProfileData) => Promise<void>;
  onPhotoUploaded?: (photoUrl: string) => void;
}

export function EditProfileDialog({ open, onOpenChange, profileData, onSave, onPhotoUploaded }: EditProfileDialogProps) {
  const [formData, setFormData] = useState<ProfileData>(profileData);
  const [isUploading, setIsUploading] = useState(false);

  // Update formData when profileData changes (e.g., when dialog reopens)
  useEffect(() => {
    setFormData(profileData);
  }, [profileData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await onSave(formData);
      // Close dialog after successful save
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in onSave, just keep dialog open
      console.error('Error saving profile:', error);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file (JPEG, PNG, GIF)");
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size too large. Maximum 5MB allowed.");
      return;
    }

    setIsUploading(true);
    
    try {
      // Create FormData for file upload
      const uploadFormData = new FormData();
      uploadFormData.append('image', file);
      
      console.log('Uploading profile photo:', {
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        formDataKeys: Array.from(uploadFormData.keys())
      });
      
      // Upload image to server
      const response = await api.post<{ profilePhoto: string }>('/users/upload-profile-photo', uploadFormData);
      
      console.log('Upload response:', response);
      console.log('Upload response data:', response.data);
      console.log('Upload response message:', response.message);
      console.log('Upload response success:', response.success);
      
      if (response.success && response.data) {
        // Backend returns { success: true, data: { ...user, profilePhoto } }
        const photoUrl = response.data.profilePhoto;
        
        console.log('Response data structure:', {
          responseData: response.data,
          photoUrl: photoUrl,
          hasProfilePhoto: !!photoUrl
        });
        
        if (photoUrl) {
          // Update form data with new photo URL
          setFormData(prev => ({ ...prev, profilePhoto: photoUrl }));
          
          // Notify parent component to update user context immediately
          console.log('Calling onPhotoUploaded with:', photoUrl);
          if (onPhotoUploaded) {
            onPhotoUploaded(photoUrl);
          } else {
            console.warn('onPhotoUploaded callback not provided');
          }
          
          toast.success("Photo uploaded successfully!");
        } else {
          console.error('No profilePhoto in response:', response.data);
          toast.error("Upload succeeded but no photo URL returned");
        }
      } else {
        console.error('Upload failed - Full response:', response);
        console.error('Upload failed - Response data:', response.data);
        console.error('Upload failed - Response message:', response.message);
        
        // Extract error message from response
        let errorMsg = "Failed to upload photo";
        if (response.message) {
          errorMsg = response.message;
        } else if (response.data && typeof response.data === 'object') {
          // Handle case where response.data might contain error information
          const dataObj = response.data as Record<string, any>;
          if (dataObj.message) {
            errorMsg = dataObj.message;
          } else if (dataObj.error) {
            errorMsg = dataObj.error;
          }
        } else if (response.data && typeof response.data === 'string') {
          errorMsg = response.data;
        }
        
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload photo. Please try again.");
    } finally {
      setIsUploading(false);
      // Reset file input
      e.target.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>Update your profile information and photo</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Photo */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="w-32 h-32">
                <AvatarImage src={formData.profilePhoto} alt={formData.username} />
                <AvatarFallback className="bg-primary text-white text-3xl">
                  {formData.username.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <label
                className="absolute bottom-0 right-0 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors cursor-pointer"
              >
                <Camera className="w-5 h-5" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                  disabled={isUploading}
                />
              </label>
            </div>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username">Username *</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="Enter your username"
              required
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., New York, NY"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Biography</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell us about yourself and your love for pets..."
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading}>Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
