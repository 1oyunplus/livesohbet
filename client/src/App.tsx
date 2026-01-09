import { Switch, Route, useLocation, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { Navigation } from "@/components/Navigation";
import { VipModal } from "@/components/VipModal";
import { useAuth } from "@/hooks/use-auth"; // Bu satırı ekledik

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
  const { user, isLoading } = useAuth(); // Kullanıcı bilgisini alıyoruz
  const isLoginPage = location === "/login";

  // Yükleme ekranı (Veritabanından kullanıcı bilgisi beklenirken)
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={isLoginPage ? "min-h-screen" : "md:pl-24 min-h-screen"}>
      <Switch>
        <Route path="/login">
          {user ? <Redirect to="/" /> : <Login />}
        </Route>
        
        {/* Korumalı Rotalar: Giriş yoksa Login'e at */}
        <Route path="/">
          {!user ? <Redirect to="/login" /> : <Discover />}
        </Route>
        <Route path="/chat">
          {!user ? <Redirect to="/login" /> : <Chat />}
        </Route>
        <Route path="/chat/:id">
          {!user ? <Redirect to="/login" /> : <Chat />}
        </Route>
        <Route path="/store">
          {!user ? <Redirect to="/login" /> : <Store />}
        </Route>
        <Route path="/profile">
          {!user ? <Redirect to="/login" /> : <Profile />}
        </Route>
        <Route path="/edit-profile">
          {!user ? <Redirect to="/login" /> : <EditProfile />}
        </Route>
        
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  // Navigation'ı göstermek için URL kontrolü
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
