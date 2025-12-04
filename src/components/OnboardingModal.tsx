import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { ClipboardList, Users, Heart, X } from "lucide-react";

interface OnboardingModalProps {
  onClose: () => void;
}

export function OnboardingModal({ onClose }: OnboardingModalProps) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      icon: ClipboardList,
      title: "Welcome to PawfectMatch!",
      description: "Connect with local pet lovers in your community for safe, reliable pet care.",
      cta: "Get Started",
    },
    {
      icon: Users,
      title: "Two Ways to Use PawfectMatch",
      description: "Post tasks if you need help with your pet, or apply to help others earn extra income doing what you love!",
      cta: "Next",
    },
    {
      icon: Heart,
      title: "Safe & Verified Community",
      description: "All helpers are verified. Read reviews, chat directly, and build trust with your local pet care community.",
      cta: "Start Exploring",
    },
  ];

  const currentStep = steps[step];
  const Icon = currentStep.icon;

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onClose();
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="sr-only">Onboarding</DialogTitle>
          <DialogDescription className="sr-only">Welcome to PawfectMatch onboarding</DialogDescription>
        </DialogHeader>
        
        <div className="text-center py-6">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <Icon className="w-10 h-10 text-primary" />
          </div>
          
          <h2 className="text-primary mb-4" style={{ fontWeight: 700, fontSize: '28px' }}>
            {currentStep.title}
          </h2>
          
          <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
            {currentStep.description}
          </p>

          {/* Step indicators */}
          <div className="flex justify-center gap-2 mb-6">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-2 rounded-full transition-all ${
                  i === step ? 'w-8 bg-primary' : 'w-2 bg-secondary'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-3">
            {step > 0 && (
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep(step - 1)}
              >
                Back
              </Button>
            )}
            <Button
              className="flex-1 bg-primary hover:bg-primary/90 text-white"
              onClick={handleNext}
            >
              {currentStep.cta}
            </Button>
          </div>

          <button
            onClick={onClose}
            className="mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip for now
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
