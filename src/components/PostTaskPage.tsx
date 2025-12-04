import React, { useState } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { ArrowLeft, Upload } from "lucide-react";
import { SuccessToast } from "./SuccessToast";

interface PostTaskPageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

export function PostTaskPage({ onNavigate }: PostTaskPageProps) {
  const [step, setStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);

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
                <Label htmlFor="title">Task Title</Label>
                <Input 
                  id="title"
                  placeholder="e.g., Daily Morning Dog Walk"
                  className="bg-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Service Type</Label>
                <Select>
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
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input 
                    id="date"
                    type="date"
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input 
                    id="time"
                    type="time"
                    className="bg-white"
                  />
                </div>
              </div>

              <Button 
                className="w-full bg-primary hover:bg-primary/90 text-white"
                onClick={() => setStep(2)}
              >
                Continue
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-primary" style={{ fontWeight: 600, fontSize: '24px' }}>Pet Information</h2>
              
              <div className="space-y-2">
                <Label htmlFor="petName">Pet Name</Label>
                <Input 
                  id="petName"
                  placeholder="e.g., Max"
                  className="bg-white"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="species">Species</Label>
                  <Select>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select species" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dog">Dog</SelectItem>
                      <SelectItem value="cat">Cat</SelectItem>
                      <SelectItem value="bird">Bird</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="breed">Breed</Label>
                  <Input 
                    id="breed"
                    placeholder="e.g., Golden Retriever"
                    className="bg-white"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <Input 
                    id="age"
                    placeholder="e.g., 3 years"
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight</Label>
                  <Input 
                    id="weight"
                    placeholder="e.g., 70 lbs"
                    className="bg-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Special Notes</Label>
                <Textarea 
                  id="notes"
                  placeholder="Any special requirements, allergies, or behavioral notes..."
                  rows={4}
                  className="bg-white resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label>Pet Photos</Label>
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center bg-white cursor-pointer hover:border-primary transition-colors">
                  <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG up to 10MB
                  </p>
                </div>
              </div>

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
                  onClick={() => setStep(3)}
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
                <Label htmlFor="location">Location</Label>
                <Input 
                  id="location"
                  placeholder="e.g., Central Park, New York, NY"
                  className="bg-white"
                />
                <p className="text-xs text-muted-foreground">
                  Enter the address or area where the service is needed
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reward">Reward Amount ($)</Label>
                <Input 
                  id="reward"
                  type="number"
                  placeholder="25"
                  className="bg-white"
                />
                <p className="text-xs text-muted-foreground">
                  Set a fair price for the service
                </p>
              </div>

              <div className="bg-secondary/20 p-6 rounded-xl">
                <h3 className="mb-3" style={{ fontWeight: 600 }}>Task Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Task Type</span>
                    <span style={{ fontWeight: 600 }}>Dog Walking</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Pet</span>
                    <span style={{ fontWeight: 600 }}>Max (Golden Retriever)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Location</span>
                    <span style={{ fontWeight: 600 }}>Central Park, NY</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Reward</span>
                    <span className="text-primary" style={{ fontWeight: 700 }}>$25</span>
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
                  onClick={() => {
                    setShowSuccess(true);
                    setTimeout(() => onNavigate('tasks'), 2000);
                  }}
                >
                  Post Task
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}