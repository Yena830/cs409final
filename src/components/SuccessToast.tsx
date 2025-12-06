import { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";

interface SuccessToastProps {
  message: string;
  onClose: () => void;
}

export function SuccessToast({ message, onClose }: SuccessToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    setTimeout(() => setIsVisible(true), 10);
    
    // Auto-close after 5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div 
      className={`fixed top-24 right-4 z-50 transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="bg-white border border-primary/20 rounded-2xl shadow-xl p-4 flex items-center gap-3 min-w-[320px] max-w-md">
        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0 animate-bounce">
          <CheckCircle2 className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-foreground" style={{ fontWeight: 600 }}>
            Success! 🎉
          </p>
          <p className="text-sm text-muted-foreground">
            {message}
          </p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
