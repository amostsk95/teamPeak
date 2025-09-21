import { useState } from "react";
import { Hero } from "@/components/Hero";
import { AuthDialog } from "@/components/AuthDialog";

const Index = () => {
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  const handleLoginClick = () => {
    setAuthMode("login");
    setIsAuthDialogOpen(true);
  };

  const handleRegisterClick = () => {
    setAuthMode("register");
    setIsAuthDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsAuthDialogOpen(false);
  };

  const handleModeChange = (mode: "login" | "register") => {
    setAuthMode(mode);
  };

  return (
    <div className="min-h-screen bg-background">
      <Hero onLoginClick={handleLoginClick} onRegisterClick={handleRegisterClick} />
      
      <AuthDialog
        isOpen={isAuthDialogOpen}
        onClose={handleCloseDialog}
        mode={authMode}
        onModeChange={handleModeChange}
      />
    </div>
  );
};

export default Index;