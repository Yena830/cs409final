import React from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Star, MapPin, Clock, DollarSign, Shield, MessageCircle, ArrowLeft, Heart } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface TaskDetailPageProps {
  onNavigate: (page: string, params?: Record<string, any>) => void;
}

export function TaskDetailPage({ onNavigate }: TaskDetailPageProps) {
  return (
    <div className="min-h-screen pt-24 pb-24 px-4">
      <div className="max-w-[1200px] mx-auto">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => onNavigate('tasks')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Tasks
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Header */}
            <Card className="p-6 border-0 shadow-md">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-primary mb-2" style={{ fontWeight: 700, fontSize: '32px' }}>Daily Dog Walking</h1>
                  <Badge className="bg-primary text-white" style={{ fontWeight: 600 }}>Walk</Badge>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="hover:bg-primary/10 hover:text-primary transition-all"
                >
                  <Heart className="w-5 h-5" />
                </Button>
              </div>

              <div className="grid sm:grid-cols-3 gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Location</div>
                    <div style={{ fontWeight: 600 }}>Central Park, NY</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Time</div>
                    <div style={{ fontWeight: 600 }}>8-10am</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Reward</div>
                    <div className="text-primary" style={{ fontWeight: 700, fontSize: '24px' }}>$25</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-3" style={{ fontWeight: 600 }}>Task Description</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Looking for a reliable and caring person to walk my Golden Retriever, Max, every morning. 
                  He's a friendly, energetic 3-year-old dog who loves his morning walks around Central Park. 
                  The walk should be around 30-45 minutes. Max is well-trained and great with other dogs. 
                  He needs to be walked on a leash at all times and loves to play fetch if time permits.
                </p>
              </div>
            </Card>

            {/* Pet Information */}
            <Card className="p-6 border-0 shadow-md">
              <h3 className="mb-4" style={{ fontWeight: 600 }}>Pet Information</h3>
              <div className="flex gap-6">
                <div className="w-32 h-32 rounded-2xl overflow-hidden shrink-0">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1633722715463-d30f4f325e24?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnb2xkZW4lMjByZXRyaWV2ZXJ8ZW58MXx8fHwxNzYwMjk2MjI1fDA&ixlib=rb-4.1.0&q=80&w=1080"
                    alt="Max"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <h4 style={{ fontWeight: 600 }}>Max</h4>
                    <p className="text-muted-foreground">Golden Retriever</p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Age:</span>
                      <span className="ml-2" style={{ fontWeight: 600 }}>3 years</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Weight:</span>
                      <span className="ml-2" style={{ fontWeight: 600 }}>70 lbs</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Gender:</span>
                      <span className="ml-2" style={{ fontWeight: 600 }}>Male</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Vaccinated:</span>
                      <span className="ml-2 text-primary" style={{ fontWeight: 600 }}>Yes</span>
                    </div>
                  </div>
                  <div className="pt-2">
                    <p className="text-sm text-muted-foreground">
                      <span style={{ fontWeight: 600 }}>Notes:</span> Very friendly, loves treats, 
                      knows basic commands (sit, stay, come). No food allergies.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Owner Info */}
            <Card className="p-6 border-0 shadow-md">
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src="" alt="Sarah M." />
                  <AvatarFallback className="bg-primary text-white">SM</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 style={{ fontWeight: 600 }}>Sarah M.</h4>
                    <Shield className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm" style={{ fontWeight: 600 }}>4.9</span>
                    <span className="text-sm text-muted-foreground">(24 reviews)</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground mb-4">
                <div className="flex justify-between">
                  <span>Member since</span>
                  <span style={{ fontWeight: 600 }}>Jan 2023</span>
                </div>
                <div className="flex justify-between">
                  <span>Response time</span>
                  <span style={{ fontWeight: 600 }}>Within 1 hour</span>
                </div>
                <div className="flex justify-between">
                  <span>Tasks posted</span>
                  <span style={{ fontWeight: 600 }}>32</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  className="flex-1 bg-primary hover:bg-primary/90 text-white"
                  onClick={() => onNavigate('messages')}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message
                </Button>
              </div>
            </Card>

            {/* Apply Card */}
            <Card className="p-6 border-0 shadow-md bg-secondary/20">
              <h3 className="mb-4" style={{ fontWeight: 600 }}>Apply for this Task</h3>
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-xl">
                  <div className="text-sm text-muted-foreground mb-1">You'll earn</div>
                  <div className="text-primary" style={{ fontWeight: 700, fontSize: '36px' }}>$25</div>
                  <div className="text-sm text-muted-foreground">per session</div>
                </div>
                <Button 
                  size="lg" 
                  className="w-full bg-primary hover:bg-primary/90 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
                >
                  Apply Now
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                  You'll be able to chat with the owner after applying
                </p>
              </div>
            </Card>

            {/* Requirements */}
            <Card className="p-6 border-0 shadow-md">
              <h4 className="mb-3" style={{ fontWeight: 600 }}>Requirements</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <span className="text-muted-foreground">Experience with large dogs</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <span className="text-muted-foreground">Available for regular morning walks</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <span className="text-muted-foreground">Reliable and punctual</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                  <span className="text-muted-foreground">Must love dogs!</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}