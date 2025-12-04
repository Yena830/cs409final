import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Star, MapPin, CheckCircle2, Award, Briefcase, MessageCircle, X } from "lucide-react";
import { Card } from "./ui/card";
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";

interface Applicant {
  id: number;
  name: string;
  avatar: string;
  rating: number;
  reviewCount: number;
  location: string;
  tasksCompleted: number;
  responseRate: number;
  verified: boolean;
  experience: string;
  certifications: string[];
  introduction: string;
}

interface ApplicantsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskTitle?: string;
  applicants: Applicant[];
  selectedTask: { title: string; applications: number } | null;
  onViewProfile?: (applicantId: number) => void;
  onConfirmHelper?: (applicantId: number) => void;
}

export function ApplicantsDialog({ 
  open, 
  onOpenChange, 
  applicants,
  selectedTask,
  onViewProfile,
  onConfirmHelper 
}: ApplicantsDialogProps) {
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const handleConfirm = (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    setConfirmDialogOpen(true);
  };

  const handleConfirmAction = () => {
    if (selectedApplicant && onConfirmHelper) {
      onConfirmHelper(selectedApplicant.id);
      setConfirmDialogOpen(false);
      onOpenChange(false);
    }
  };

  const taskTitle = selectedTask?.title || "this task";
  const applicantsCount = selectedTask?.applications || applicants.length;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="!max-w-[800px] w-[calc(100vw-4rem)] max-h-[90vh] overflow-y-auto overflow-x-hidden">
          <DialogHeader>
            <DialogTitle className="text-primary flex items-center justify-between" style={{ fontWeight: 700, fontSize: '24px' }}>
              <span>Applications for "{taskTitle}"</span>
            </DialogTitle>
            <DialogDescription>
              Review {applicantsCount} application{applicantsCount !== 1 ? 's' : ''} and select the best helper for your pet
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {applicants.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No applications yet. Check back later!</p>
              </div>
            ) : (
              applicants.map((applicant) => (
                <Card key={applicant.id} className="p-6 border-0 shadow-md hover:shadow-xl transition-all">
                  <div className="flex gap-6">
                    {/* Avatar */}
                    <Avatar className="w-20 h-20 shrink-0">
                      <AvatarImage src={applicant.avatar} alt={applicant.name} />
                      <AvatarFallback className="bg-primary text-white">
                        {applicant.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 style={{ fontWeight: 600, fontSize: '18px' }}>{applicant.name}</h3>
                            {applicant.verified && (
                              <div className="flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-4 h-4 text-primary" />
                                <span className="text-xs text-primary" style={{ fontWeight: 600 }}>Verified</span>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-2">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              <span style={{ fontWeight: 600 }}>{applicant.rating}</span>
                              <span>({applicant.reviewCount})</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span>{applicant.location}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="bg-primary/5 rounded-lg px-3 py-2">
                          <div className="text-primary" style={{ fontWeight: 700 }}>{applicant.tasksCompleted}</div>
                          <div className="text-xs text-muted-foreground">Tasks Done</div>
                        </div>
                        <div className="bg-accent/5 rounded-lg px-3 py-2">
                          <div className="text-accent" style={{ fontWeight: 700 }}>{applicant.responseRate}%</div>
                          <div className="text-xs text-muted-foreground">Response</div>
                        </div>
                        <div className="bg-chart-5/5 rounded-lg px-3 py-2">
                          <div className="text-chart-5" style={{ fontWeight: 700 }}>{applicant.experience}</div>
                          <div className="text-xs text-muted-foreground">Experience</div>
                        </div>
                      </div>

                      {/* Introduction */}
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                        {applicant.introduction}
                      </p>

                      {/* Certifications */}
                      {applicant.certifications.length > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Award className="w-4 h-4 text-primary" />
                            <span className="text-sm" style={{ fontWeight: 600 }}>Certifications</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {applicant.certifications.map((cert, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {cert}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 pt-4 border-t border-border">
                        <Button 
                          variant="outline" 
                          className="flex-1 hover:bg-primary/10 hover:border-primary hover:text-primary"
                          onClick={() => onViewProfile?.(applicant.id)}
                        >
                          <Briefcase className="w-4 h-4 mr-2" />
                          View Full Profile
                        </Button>
                        <Button 
                          variant="outline" 
                          className="hover:bg-primary/10 hover:border-primary hover:text-primary"
                          onClick={() => {/* Message functionality */}}
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                        <Button 
                          className="bg-primary hover:bg-primary/90 text-white"
                          onClick={() => handleConfirm(applicant)}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Select Helper
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Helper Selection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to select <span className="font-semibold">{selectedApplicant?.name}</span> as your helper for "{taskTitle}"?
              <br /><br />
              This will notify them and close the task to other applicants.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-primary hover:bg-primary/90"
              onClick={handleConfirmAction}
            >
              Confirm Selection
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}