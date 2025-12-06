import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ArrowLeft, Upload } from "lucide-react";
import { SuccessToast } from "./SuccessToast";
import { api } from "../lib/api";
import { useUser } from "../hooks/useUser";
import { toast } from "sonner";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import type { User as UserType } from "../contexts/UserContext";

interface PostTaskPageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

interface Pet {
  _id: string;
  name: string;
  type: string;
  breed?: string;
  photos?: string[];
}

export function PostTaskPage({ onNavigate }: PostTaskPageProps) {
  const [step, setStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loadingPets, setLoadingPets] = useState(true);
  const [addingOwnerRole, setAddingOwnerRole] = useState(false);
  const { user, isOwner, isAuthenticated, setUser } = useUser();

  // Form data
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    description: '',
    date: '',
    time: '',
    location: '',
    reward: '',
    budget: '',
    pet: '',
  });

  // Auto-add owner role if user is helper but not owner
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const addOwnerRoleIfNeeded = async () => {
      // If user is not an owner, automatically add owner role
      if (!isOwner() && user._id) {
        setAddingOwnerRole(true);
        try {
          const response = await api.post<UserType>('/users/add-role', { role: 'owner' });
          
          if (response.success && response.data) {
            // Update user context with new role
            setUser(response.data);
            toast.success("Owner role added! You can now post tasks.");
            // After adding owner role, load pets
            loadPets();
          } else {
            toast.error(response.message || "Failed to add owner role");
          }
        } catch (error) {
          console.error('Failed to add owner role:', error);
          toast.error("Failed to add owner role. Please try again.");
        } finally {
          setAddingOwnerRole(false);
        }
      } else if (isOwner()) {
        // If already owner, just load pets
        loadPets();
      }
    };

    addOwnerRoleIfNeeded();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, isOwner]);

  const loadPets = async () => {
    setLoadingPets(true);
    try {
      const response = await api.get<Pet[]>('/pets/my');
      if (response.success && response.data) {
        setPets(response.data);
        if (response.data.length === 0) {
          toast.error("You need to add a pet first before posting a task");
          setTimeout(() => onNavigate('owner-profile'), 2000);
        }
      } else {
        toast.error("Failed to load pets");
      }
    } catch (error) {
      toast.error("Failed to load pets");
    } finally {
      setLoadingPets(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.title || !formData.type || !formData.location || !formData.pet) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!formData.reward && !formData.budget) {
      toast.error("Please enter a reward amount");
      return;
    }

    setLoading(true);
    try {
      const taskData = {
        title: formData.title,
        type: formData.type,
        description: formData.description || '',
        location: formData.location,
        reward: formData.reward || `$${formData.budget}`,
        budget: formData.budget ? Number(formData.budget) : Number(formData.reward?.replace('$', '') || 0),
        pet: formData.pet,
        date: formData.date || new Date().toISOString(),
        time: formData.time || '',
      };

      const response = await api.post('/tasks', taskData);
      
      if (response.success) {
        setShowSuccess(true);
        setTimeout(() => {
          onNavigate('tasks');
        }, 2000);
      } else {
        toast.error(response.message || "Failed to create task");
      }
    } catch (error) {
      toast.error("Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  const selectedPet = pets.find(p => p._id === formData.pet);
  const typeDisplay = formData.type ? formData.type.charAt(0).toUpperCase() + formData.type.slice(1) : '';

  if (loadingPets || addingOwnerRole) {
    return (
      <div className="min-h-screen pt-24 pb-24 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="text-muted-foreground">
            {addingOwnerRole ? "Adding owner role..." : "Loading your pets..."}
          </div>
        </div>
      </div>
    );
  }

  if (pets.length === 0) {
    return (
      <div className="min-h-screen pt-24 pb-24 px-4 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-muted-foreground mb-4">You need to add a pet first before posting a task.</div>
          <Button onClick={() => onNavigate('owner-profile')}>
            Go to Profile
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-24 px-4">
      {showSuccess && (
        <SuccessToast
          message="Your task is live! Browse applications from local helpers."
          onClose={() => setShowSuccess(false)}
        />
      )}
      <div className="max-w-[800px] mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => step === 1 ? onNavigate('landing') : setStep(step - 1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="mb-8">
          <h1 className="text-primary mb-4" style={{ fontWeight: 700, fontSize: '40px' }}>Post a Pet Care Task</h1>
          <p className="text-muted-foreground">
            Find trusted helpers in your community
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  s <= step ? 'bg-primary text-white' : 'bg-secondary text-muted-foreground'
                }`}
                style={{ fontWeight: 600 }}
              >
                {s}
              </div>
              {s < 3 && (
                <div 
                  className={`w-24 h-1 mx-2 ${
                    s < step ? 'bg-primary' : 'bg-secondary'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <Card className="p-8 border-0 shadow-lg">
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-primary" style={{ fontWeight: 600, fontSize: '24px' }}>Task Details</h2>
              
              <div className="space-y-2">
                <Label htmlFor="title">Task Title *</Label>
                <Input 
                  id="title"
                  placeholder="e.g., Daily Morning Dog Walk"
                  className="bg-white"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Service Type *</Label>
                <Select value={formData.type} onValueChange={(value: string) => handleInputChange('type', value)}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="walk">Dog Walking</SelectItem>
                    <SelectItem value="feed">Pet Feeding</SelectItem>
                    <SelectItem value="boarding">Pet Boarding</SelectItem>
                    <SelectItem value="sitting">Pet Sitting</SelectItem>
                    <SelectItem value="grooming">Grooming</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description"
                  placeholder="Describe what you need help with..."
                  rows={5}
                  className="bg-white resize-none"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input 
                    id="date"
                    type="date"
                    className="bg-white"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input 
                    id="time"
                    type="time"
                    className="bg-white"
                    value={formData.time}
                    onChange={(e) => handleInputChange('time', e.target.value)}
                  />
                </div>
              </div>

              <Button 
                className="w-full bg-primary hover:bg-primary/90 text-white"
                onClick={() => {
                  if (!formData.title || !formData.type) {
                    toast.error("Please fill in required fields");
                    return;
                  }
                  setStep(2);
                }}
              >
                Continue
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-primary" style={{ fontWeight: 600, fontSize: '24px' }}>Select Pet</h2>
              
              <div className="space-y-2">
                <Label htmlFor="pet">Select a Pet *</Label>
                <Select value={formData.pet} onValueChange={(value: string) => handleInputChange('pet', value)}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Select your pet" />
                  </SelectTrigger>
                  <SelectContent>
                    {pets.map((pet) => (
                      <SelectItem key={pet._id} value={pet._id}>
                        {pet.name} ({pet.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedPet && (
                <Card className="p-4 bg-secondary/20">
                  <div className="flex gap-4">
                    {selectedPet.photos && selectedPet.photos.length > 0 && (
                      <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0">
                        <ImageWithFallback
                          src={selectedPet.photos[0]}
                          alt={selectedPet.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <h4 style={{ fontWeight: 600 }}>{selectedPet.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {selectedPet.breed || selectedPet.type}
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep(1)}
                >
                  Back
                </Button>
                <Button 
                  className="flex-1 bg-primary hover:bg-primary/90 text-white"
                  onClick={() => {
                    if (!formData.pet) {
                      toast.error("Please select a pet");
                      return;
                    }
                    setStep(3);
                  }}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-primary" style={{ fontWeight: 600, fontSize: '24px' }}>Location & Payment</h2>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input 
                  id="location"
                  placeholder="e.g., Central Park, New York, NY"
                  className="bg-white"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Enter the address or area where the service is needed
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reward">Reward Amount *</Label>
                <Input 
                  id="reward"
                  type="text"
                  placeholder="e.g., $25 or 25"
                  className="bg-white"
                  value={formData.reward}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleInputChange('reward', value);
                    // Also set budget if it's a number
                    const numValue = value.replace('$', '');
                    if (!isNaN(Number(numValue)) && numValue) {
                      handleInputChange('budget', numValue);
                    }
                  }}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Set a fair price for the service (e.g., $25)
                </p>
              </div>

              <div className="bg-secondary/20 p-6 rounded-xl">
                <h3 className="mb-3" style={{ fontWeight: 600 }}>Task Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Task Type</span>
                    <span style={{ fontWeight: 600 }}>{typeDisplay || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pet</span>
                    <span style={{ fontWeight: 600 }}>
                      {selectedPet ? `${selectedPet.name} (${selectedPet.type})` : 'Not selected'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location</span>
                    <span style={{ fontWeight: 600 }}>{formData.location || 'Not set'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reward</span>
                    <span className="text-primary" style={{ fontWeight: 700 }}>
                      {formData.reward || formData.budget ? (formData.reward || `$${formData.budget}`) : 'Not set'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep(2)}
                >
                  Back
                </Button>
                <Button 
                  className="flex-1 bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? 'Posting...' : 'Post Task'}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
