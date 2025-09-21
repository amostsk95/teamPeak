import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, BarChart3, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface HeroProps {
  onLoginClick: () => void;
  onRegisterClick: () => void;
}

export const Hero = ({ onLoginClick, onRegisterClick }: HeroProps) => {
  const { isAuthenticated, logout } = useAuth();

  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-hero overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-subtle" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />
      
      {/* Logout button for authenticated users */}
      {isAuthenticated && (
        <div className="absolute top-6 right-6">
          <Button 
            onClick={logout}
            variant="outline"
            size="sm"
            className="backdrop-blur-sm border-white/20 hover:bg-white/10"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      )}
      
      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8">
          <Sparkles className="w-4 h-4 text-accent" />
          <span className="text-sm font-medium text-foreground">Welcome to the future</span>
        </div>

        {/* Main headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
          <span className="bg-gradient-primary bg-clip-text text-transparent">
            Build Something
          </span>
          <br />
          <span className="text-foreground">Amazing Today</span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl lg:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
          Join thousands of creators who are building the next generation of digital experiences with our powerful platform.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Button 
            variant="hero" 
            size="lg"
            onClick={onRegisterClick}
            className="group"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
          
          <Button 
            variant="outline" 
            size="lg"
            onClick={onLoginClick}
            className="backdrop-blur-sm border-white/20 hover:bg-white/10"
          >
            Sign In
          </Button>

          {/* Only show demo button if authenticated */}
          {isAuthenticated && (
            <Link to="/transactions">
              <Button 
                variant="secondary" 
                size="lg"
                className="backdrop-blur-sm bg-white/10 hover:bg-white/20 border border-white/20"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                View Dashboard
              </Button>
            </Link>
          )}
        </div>

        {/* Trust indicators */}
        <div className="mt-16 pt-8 border-t border-white/10">
          <p className="text-sm text-muted-foreground mb-4">Trusted by innovative teams</p>
          <div className="flex items-center justify-center gap-8 opacity-60">
            <div className="w-20 h-8 bg-foreground/20 rounded"></div>
            <div className="w-20 h-8 bg-foreground/20 rounded"></div>
            <div className="w-20 h-8 bg-foreground/20 rounded"></div>
            <div className="w-20 h-8 bg-foreground/20 rounded"></div>
          </div>
        </div>
      </div>
    </section>
  );
};