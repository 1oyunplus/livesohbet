import { Switch, Route, useLocation, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { Navigation } from "@/components/Navigation";
import { VipModal } from "@/components/VipModal";
import { useAuth } from "@/hooks/use-auth";

// Pages
import Discover from "@/pages/Discover";
import Chat from "@/pages/Chat";
import Store from "@/pages/Store";
import Profile from "@/pages/Profile";
import EditProfile from "@/pages/EditProfile";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/login">
        {user ? <Redirect to="/" /> : <Login />}
      </Route>
      
      {/* Korumalı Alanlar */}
      {!user ? (
        <Route path="/:rest*">
          <Redirect to="/login" />
        </Route>
      ) : (
        <>
          <Route path="/" component={Discover} />
          <Route path="/chat" component={Chat} />
          <Route path="/chat/:id" component={Chat} />
          <Route path="/store" component={Store} />
          <Route path="/profile" component={Profile} />
          <Route path="/edit-profile" component={EditProfile} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const isLoginPage = location === "/login";

  return (
    <QueryClientProvider client={queryClient}>
      <div className="bg-background min-h-screen text-foreground font-sans selection:bg-primary/30">
        {!isLoginPage && <Navigation />}
        <div className={isLoginPage ? "" : "md:pl-24"}>
          <Router />
        </div>
        <VipModal />
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}

export default App;
