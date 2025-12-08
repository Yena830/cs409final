import { Card } from "./ui/card";
import { ClipboardList, Users, Heart } from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      icon: ClipboardList,
      title: "Post a Task",
      description: "Describe your pet care needs, schedule, and location. It's quick and easy!",
      step: 1,
    },
    {
      icon: Users,
      title: "Match with Helpers",
      description: "Browse applications from verified local pet lovers and choose the perfect match.",
      step: 2,
    },
    {
      icon: Heart,
      title: "Get Pet Care",
      description: "Relax knowing your furry friend is in caring, trustworthy hands.",
      step: 3,
    },
  ];

  return (
    <div className="min-h-screen py-20 px-4 relative flex items-center">
      {/* Background image with overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: "url(/src/assets/bg2.jpeg)",
          backgroundAttachment: "fixed",
        }}
      />
      <div className="absolute inset-0 bg-white/50"></div>
      
      {/* Content */}
      <div className="max-w-[1200px] mx-auto relative z-10 w-full">
        <div className="text-center mb-12">
          <h2 className="text-white mb-4" style={{ fontWeight: 700, fontSize: '40px' }}>
            How It Works
          </h2>
          <p className="text-white max-w-2xl mx-auto">
            Getting started with PawfectMatch is simple. Follow these three easy steps to find the perfect care for your pet.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connection line for desktop */}
          <div className="hidden md:block absolute top-16 left-[16.666%] right-[16.666%] h-1 bg-gradient-to-r from-white via-white to-white opacity-30" 
               style={{ top: '80px' }} />
          
          {steps.map((step) => (
            <Card
              key={step.step}
              className="relative p-8 text-center border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-white/90 backdrop-blur-sm"
            >
              <div className="relative mb-6 inline-block">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <step.icon className="w-10 h-10 text-primary" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center" 
                     style={{ fontWeight: 700 }}>
                  {step.step}
                </div>
              </div>
              <h3 className="mb-3 text-primary" style={{ fontWeight: 700, fontSize: '24px' }}>
                {step.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}