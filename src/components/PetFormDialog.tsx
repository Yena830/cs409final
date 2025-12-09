import { useState, useEffect, useRef, FormEvent, ChangeEvent } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";
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

// Backend Pet interface
interface BackendPet {
  _id?: string;
  name: string;
  type: string;
  breed?: string;
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  notes?: string;
  photos?: string[];
  owner?: string;
}

interface PetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pet?: BackendPet | null;
  onSave: (pet: BackendPet) => void;
}

export function PetFormDialog({ open, onOpenChange, pet, onSave }: PetFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "dog",
    breed: "",
    age: "",
    gender: "",
    height: "",
    weight: "",
    notes: "",
    image: "",
  });

  // Reset form when dialog opens/closes or pet changes
  useEffect(() => {
    if (open) {
      if (pet) {
        // Editing existing pet - populate form
        setFormData({
          name: pet.name || "",
          type: pet.type || "dog",
          breed: pet.breed || "",
          age: pet.age?.toString() || "",
          gender: pet.gender || "",
          height: pet.height?.toString() || "",
          weight: pet.weight?.toString() || "",
          notes: pet.notes || "",
          image: pet.photos?.[0] || "",
        });
      } else {
        // Creating new pet - reset form with default dog image
        setFormData({
          name: "",
          type: "dog",
          breed: "",
          age: "",
          gender: "",
          height: "",
          weight: "",
          notes: "",
          image: DEFAULT_PET_IMAGES.dog,
        });
      }
    }
  }, [open, pet]);

  // Update default image when pet type changes
  const handleTypeChange = (value: string) => {
    // Only update default image if user hasn't uploaded a custom image
    setFormData(prev => ({
      ...prev,
      type: value,
      image: prev.image === DEFAULT_PET_IMAGES[prev.type] || prev.image === "" 
        ? DEFAULT_PET_IMAGES[value] 
        : prev.image
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.type) {
      toast.error("Name and type are required");
      return;
    }

    setLoading(true);
    try {
      // Prepare data for backend (matches Pet model schema)
      const petData: any = {
        name: formData.name.trim(),
        type: formData.type,
        breed: formData.breed?.trim() || undefined,
        gender: formData.gender?.trim() || undefined,
        notes: formData.notes?.trim() || undefined,
        photos: formData.image ? [formData.image] : [],
      };

      // Convert age, height and weight to numbers if provided
      if (formData.age) {
        const ageNum = parseFloat(formData.age);
        if (!isNaN(ageNum)) {
          petData.age = ageNum;
        }
      }
      if (formData.height) {
        const heightNum = parseFloat(formData.height);
        if (!isNaN(heightNum)) {
          petData.height = heightNum;
        }
      }
      if (formData.weight) {
        const weightNum = parseFloat(formData.weight);
        if (!isNaN(weightNum)) {
          petData.weight = weightNum;
        }
      }

      let savedPet: BackendPet;

      if (pet?._id) {
        // Update existing pet
        const response = await api.put<BackendPet>(`/pets/${pet._id}`, petData);
        
        if (response.success && response.data) {
          savedPet = response.data;
          toast.success("Pet updated successfully!");
        } else {
          toast.error(response.message || "Failed to update pet");
          setLoading(false);
          return;
        }
      } else {
        // Create new pet
        const response = await api.post<BackendPet>("/pets", petData);
        
        if (response.success && response.data) {
          savedPet = response.data;
          toast.success("Pet added successfully!");
        } else {
          toast.error(response.message || "Failed to create pet");
          setLoading(false);
          return;
        }
      }

      // Call onSave with the saved pet object from backend
      onSave(savedPet);
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving pet:", error);
      toast.error("An error occurred while saving the pet");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
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
      
      console.log('Uploading file:', file.name, file.type, file.size);
      
      // Upload image to server
      const response = await api.post<{ photoUrl: string }>('/pets/upload-photo', uploadFormData);
      
      console.log('Upload response:', response);
      
      if (response.success && response.data?.photoUrl) {
        // Update form data with new photo URL
        setFormData(prev => ({ ...prev, image: response.data!.photoUrl }));
        toast.success("Photo uploaded successfully!");
      } else {
        const errorMsg = response.message || "Failed to upload photo";
        console.error("Upload failed:", errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to upload photo. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const handleImageUrlInput = () => {
    // Allow pasting URL as alternative
    const url = prompt("Enter image URL:");
    if (url && url.trim()) {
      setFormData({ ...formData, image: url.trim() });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{pet?._id ? "Edit Pet" : "Add New Pet"}</DialogTitle>
          <DialogDescription>
            {pet?._id ? "Update your pet's information" : "Add a new pet to your profile"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Pet Photo */}
          <div className="space-y-2">
            <Label>Pet Photo</Label>
            <div className="flex items-center gap-4">
              {formData.image ? (
                <div className="relative w-32 h-32 rounded-xl overflow-hidden border-2 border-border">
                  <ImageWithFallback
                    src={formData.image}
                    alt={formData.name || "Pet"}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, image: "" })}
                    className="absolute top-2 right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-gray-100"
                    disabled={isUploading}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-secondary/20">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  disabled={isUploading}
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isUploading ? "Uploading..." : "Upload from Computer"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleImageUrlInput}
                  disabled={isUploading}
                  className="w-full"
                >
                  Or Enter URL
                </Button>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Pet Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Pet Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Max"
                required
                disabled={loading}
              />
            </div>

            {/* Pet Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select
                value={formData.type}
                onValueChange={handleTypeChange}
                disabled={loading}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dog">Dog</SelectItem>
                  <SelectItem value="cat">Cat</SelectItem>
                  <SelectItem value="bird">Bird</SelectItem>
                  <SelectItem value="rabbit">Rabbit</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Breed */}
            <div className="space-y-2">
              <Label htmlFor="breed">Breed</Label>
              <Input
                id="breed"
                value={formData.breed}
                onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                placeholder="e.g., Golden Retriever"
                disabled={loading}
              />
            </div>

            {/* Height */}
            <div className="space-y-2">
              <Label htmlFor="height">Height (inches)</Label>
              <Input
                id="height"
                type="number"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                placeholder="e.g., 24"
                disabled={loading}
              />
            </div>

            {/* Weight */}
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (lbs)</Label>
              <Input
                id="weight"
                type="number"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                placeholder="e.g., 65"
                disabled={loading}
              />
            </div>

            {/* Age */}
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder="e.g., 3"
                disabled={loading}
              />
            </div>

            {/* Gender */}
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => setFormData({ ...formData, gender: value })}
                disabled={loading}
              >
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Describe your pet's personality, behavior, and any special needs..."
              rows={4}
              disabled={loading}
            />
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || isUploading}>
              {loading ? "Saving..." : pet?._id ? "Save Changes" : "Add Pet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}