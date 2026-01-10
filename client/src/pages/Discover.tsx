import { useUsers } from "@/hooks/use-users";
import { UserCard } from "@/components/UserCard";
import { Search, Filter, Compass, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect, useState, useMemo } from "react";

export default function Discover() {
  const { data: users, isLoading } = useUsers();
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [locationUpdating, setLocationUpdating] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
    }
  }, [authLoading, user, setLocation]);

  useEffect(() => {
    if (user && !user.location) {
      getLocation();
    }
  }, [user]);

  const getLocation = () => {
    if (navigator.geolocation) {
      setLocationUpdating(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          
          try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/users/profile', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                location,
                token
              }),
            });

            if (res.ok) {
              window.location.reload();
            }
          } catch (error) {
            console.error('Konum güncellenemedi:', error);
          } finally {
            setLocationUpdating(false);
          }
        },
        (error) => {
          console.error('Konum alınamadı:', error);
          setLocationUpdating(false);
        }
      );
    }
  };

  const onlineUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(u => u.isOnline);
  }, [users]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-24 pt-8 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-2">
            Keşfet
          </h1>
          <p className="text-white/60 text-lg">
            Yakınınızdaki insanları bulun
          </p>
        </div>

        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input 
              type="text" 
              placeholder="Kullanıcı ara..." 
              className="pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:bg-white/10 focus:border-primary/50 transition-all w-full md:w-64"
            />
          </div>
          <button 
            onClick={getLocation}
            disabled={locationUpdating}
            className="p-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-colors disabled:opacity-50"
            title="Konumumu Güncelle"
          >
            <MapPin className="w-5 h-5" />
          </button>
          <button className="p-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-colors">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {onlineUsers && onlineUsers.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {onlineUsers.map((user, idx) => (
            <UserCard key={user.id} user={user} index={idx} />
          ))}
        </div>
      ) : (
        <div className="glass-panel p-12 rounded-3xl text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-4">
            <Compass className="w-10 h-10 text-white/30" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Çevrimiçi kullanıcı bulunamadı</h3>
          <p className="text-white/50 max-w-md">
            Şu anda çevrimiçi olan kimse yok. Daha sonra tekrar deneyin!
          </p>
        </div>
      )}
    </div>
  );
}