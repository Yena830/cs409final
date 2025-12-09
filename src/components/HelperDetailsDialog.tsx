import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import { Badge } from "./ui/badge";
import { X, Plus } from "lucide-react";
import { toast } from "sonner";
import { SERVICE_SPECIALTIES } from "../lib/constants";

interface HelperDetails {
  experience: string;
  certifications: string[];
  specialties: string[];
}

interface HelperDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  helperDetails: HelperDetails;
  onSave: (data: HelperDetails) => void;
}

export function HelperDetailsDialog({ open, onOpenChange, helperDetails, onSave }: HelperDetailsDialogProps) {
  const [formData, setFormData] = useState<HelperDetails>(helperDetails);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    toast.success("Helper details updated successfully!");
    onOpenChange(false);
  };

  const handleToggleSpecialty = (specialty: string) => {
    if (formData.specialties.includes(specialty)) {
      setFormData({
        ...formData,
        specialties: formData.specialties.filter((s) => s !== specialty),
      });
    } else {
      setFormData({
        ...formData,
        specialties: [...formData.specialties, specialty],
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Professional Details</DialogTitle>
          <DialogDescription>Update your experience and service specialties</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Experience */}
          <div className="space-y-2">
            <Label htmlFor="experience">Experience</Label>
            <Textarea
              id="experience"
              value={formData.experience}
              onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
              placeholder="Describe your experience with pet care, any relevant background, and how long you've been caring for pets..."
              rows={4}
            />
          </div>

          {/* Service Specialties */}
          <div className="space-y-3">
            <Label>Service Specialties</Label>
            <div className="grid grid-cols-2 gap-3">
              {SERVICE_SPECIALTIES.map((specialty) => (
                <div key={specialty} className="flex items-center space-x-2">
                  <Checkbox
                    id={specialty}
                    checked={formData.specialties.includes(specialty)}
                    onCheckedChange={() => handleToggleSpecialty(specialty)}
                  />
                  <label
                    htmlFor={specialty}
                    className="text-sm cursor-pointer select-none"
                  >
                    {specialty}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}