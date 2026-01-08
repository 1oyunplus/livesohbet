import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { Navigation } from "@/components/Navigation";
import { VipModal } from "@/components/VipModal";

// Pages
import Discover from "@/pages/Discover";
import Chat from "@/pages/Chat";
import Store from "@/pages/Store";
import Profile from "@/pages/Profile";
import EditProfile from "@/pages/EditProfile";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";

function Router() {
  const [location] = useLocation();
  const isLoginPage = location === "/login";

  return (
    <div className={isLoginPage ? "min-h-screen" : "md:pl-24 min-h-screen"}>
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/" component={Discover} />
        <Route path="/chat" component={Chat} />
        <Route path="/chat/:id" component={Chat} />
        <Route path="/store" component={Store} />
        <Route path="/profile" component={Profile} />
        <Route path="/edit-profile" component={EditProfile} />
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  const [location] = useLocation();
  const isLoginPage = location === "/login";

  return (
    <QueryClientProvider client={queryClient}>
      <div className="bg-background min-h-screen text-foreground font-sans selection:bg-primary/30">
        {!isLoginPage && <Navigation />}
        <Router />
        <VipModal />
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}

export default App;
