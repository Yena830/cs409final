import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Upload, X } from "lucide-react";
import { toast } from "sonner@2.0.3";

interface Pet {
  id?: number;
  name: string;
  type: string;
  breed: string;
  age: string;
  height: string;
  weight: string;
  temperament: string;
  image: string;
}

interface PetFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pet?: Pet | null;
  onSave: (pet: Pet) => void;
}

export function PetFormDialog({ open, onOpenChange, pet, onSave }: PetFormDialogProps) {
  const [formData, setFormData] = useState<Pet>(
    pet || {
      name: "",
      type: "dog",
      breed: "",
      age: "",
      height: "",
      weight: "",
      temperament: "",
      image: "",
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    toast.success(pet ? "Pet updated successfully!" : "Pet added successfully!");
    onOpenChange(false);
  };

  const handleImageUpload = () => {
    // Simulated image upload
    toast.info("Image upload feature would be implemented here");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{pet ? "Edit Pet" : "Add New Pet"}</DialogTitle>
          <DialogDescription>
            {pet ? "Update your pet's information" : "Add a new pet to your profile"}
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
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-secondary/20">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <Button type="button" variant="outline" onClick={handleImageUpload}>
                Upload Photo
              </Button>
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
              />
            </div>

            {/* Pet Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
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
              <Label htmlFor="breed">Breed *</Label>
              <Input
                id="breed"
                value={formData.breed}
                onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                placeholder="e.g., Golden Retriever"
                required
              />
            </div>

            {/* Age */}
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder="e.g., 3 years"
              />
            </div>

            {/* Height */}
            <div className="space-y-2">
              <Label htmlFor="height">Height</Label>
              <Input
                id="height"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                placeholder="e.g., 24 inches"
              />
            </div>

            {/* Weight */}
            <div className="space-y-2">
              <Label htmlFor="weight">Weight</Label>
              <Input
                id="weight"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                placeholder="e.g., 65 lbs"
              />
            </div>
          </div>

          {/* Temperament */}
          <div className="space-y-2">
            <Label htmlFor="temperament">Temperament</Label>
            <Textarea
              id="temperament"
              value={formData.temperament}
              onChange={(e) => setFormData({ ...formData, temperament: e.target.value })}
              placeholder="Describe your pet's personality, behavior, and any special needs..."
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {pet ? "Save Changes" : "Add Pet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
