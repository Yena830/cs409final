import React from "react";
import { LucideIcon } from "lucide-react";
import { Button } from "./ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction 
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mb-6 animate-pulse">
        <Icon className="w-12 h-12 text-primary" />
      </div>
      <h3 className="mb-3" style={{ fontWeight: 600, fontSize: '20px' }}>
        {title}
      </h3>
      <p className="text-muted-foreground max-w-md mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button 
          onClick={onAction}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
