import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { Navigation } from "@/components/Navigation";
import { VipModal } from "@/components/VipModal";
import { useAuth } from "@/hooks/use-auth";

// Sayfalar
import Discover from "@/pages/Discover";
import Chat from "@/pages/Chat";
import Store from "@/pages/Store";
import Profile from "@/pages/Profile";
import EditProfile from "@/pages/EditProfile";
import Login from "@/pages/Login";
import UserDetail from "@/pages/UserDetail"; // 🔥 YENİ
import Settings from "@/pages/Settings"; // 🔥 YENİ
import BlockedUsers from "@/pages/BlockedUsers"; // 🔥 YENİ
import NotFound from "@/pages/not-found";

function Router() {
  const { user, isLoading } = useAuth();

  // Yükleme sırasında spinner göster
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Switch>
        {/* Giriş sayfası */}
        <Route path="/login">
          {user ? <Redirect to="/" /> : <Login />}
        </Route>
        
        {/* ✅ FIX: /profile/edit rotasını /profile'dan ÖNCE koy */}
        <Route path="/profile/edit">
          {!user ? (
            <Redirect to="/login" />
          ) : (
            <EditProfile />
          )}
        </Route>

        <Route path="/profile">
          {!user ? (
            <Redirect to="/login" />
          ) : (
            <>
              <Profile />
              <Navigation />
            </>
          )}
        </Route>

        {/* 🔥 YENİ: Kullanıcı Detay Sayfası */}
        <Route path="/user/:userId">
          {!user ? (
            <Redirect to="/login" />
          ) : (
            <>
              <UserDetail />
              <Navigation />
            </>
          )}
        </Route>

        {/* 🔥 YENİ: Ayarlar Sayfası */}
        <Route path="/settings">
          {!user ? (
            <Redirect to="/login" />
          ) : (
            <>
              <Settings />
              <Navigation />
            </>
          )}
        </Route>

        {/* 🔥 YENİ: Engellenen Kullanıcılar */}
        <Route path="/settings/blocked-users">
          {!user ? (
            <Redirect to="/login" />
          ) : (
            <>
              <BlockedUsers />
              <Navigation />
            </>
          )}
        </Route>
        
        {/* Korunan rotalar */}
        <Route path="/">
          {!user ? (
            <Redirect to="/login" />
          ) : (
            <>
              <Discover />
              <Navigation />
            </>
          )}
        </Route>
        
        <Route path="/chat/:id">
          {!user ? (
            <Redirect to="/login" />
          ) : (
            <>
              <Chat />
              <Navigation />
            </>
          )}
        </Route>

        <Route path="/chat">
          {!user ? (
            <Redirect to="/login" />
          ) : (
            <>
              <Chat />
              <Navigation />
            </>
          )}
        </Route>
        
        <Route path="/store">
          {!user ? (
            <Redirect to="/login" />
          ) : (
            <>
              <Store />
              <Navigation />
            </>
          )}
        </Route>
        
        {/* 404 sayfası */}
        <Route path="/404">
          <NotFound />
        </Route>
        
        {/* Bilinmeyen rotalar */}
        <Route>
          {user ? <Redirect to="/" /> : <Redirect to="/login" />}
        </Route>
      </Switch>
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="bg-background min-h-screen text-foreground font-sans">
        <Router />
        <VipModal />
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}