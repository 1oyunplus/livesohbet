import { User } from "@shared/schema";
import { motion } from "framer-motion";
import { MapPin, MessageCircle, Star } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

interface UserCardProps {
  user: User;
  index: number;
}

export function UserCard({ user, index }: UserCardProps) {
  const [, setLocation] = useLocation();
  const { user: currentUser } = useAuth();

  const getVipBadge = (status: string | null) => {
    switch(status) {
      case 'gold': return 'bg-yellow-400 text-yellow-900 border-yellow-200';
      case 'silver': return 'bg-slate-300 text-slate-800 border-slate-200';
      case 'bronze': return 'bg-amber-600 text-amber-100 border-amber-400';
      default: return null;
    }
  };

  const calculateDistance = (loc1: { lat: number; lng: number } | null, loc2: { lat: number; lng: number } | null): number | null => {
    if (!loc1 || !loc2) return null;
    const R = 6371; // Dünya yarıçapı (km)
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
    const dLon = (loc2.lng - loc1.lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const userLocation = user.location as { lat: number; lng: number } | null;
  const currentUserLocation = currentUser?.location as { lat: number; lng: number } | null;
  const distance = calculateDistance(currentUserLocation, userLocation);
  const distanceText = distance !== null ? `${distance.toFixed(1)} km` : 'Konum bilgisi yok';

  const vipClass = getVipBadge(user.vipStatus);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="glass-panel rounded-3xl overflow-hidden group hover:scale-[1.02] transition-transform duration-300"
    >
      <div className="relative aspect-[3/4]">
        {/* User Image */}
        <img 
          src={user.photoUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop"} 
          alt={user.username}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />

        {/* Top Badges */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
          {vipClass && (
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1 shadow-lg ${vipClass}`}>
              <Star className="w-3 h-3 fill-current" />
              {user.vipStatus?.toUpperCase()}
            </span>
          )}
          
          <div className={`px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-md border border-white/10 ${
            user.isOnline ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-black/30 text-white/50'
          }`}>
            {user.isOnline ? 'Online' : 'Offline'}
          </div>
        </div>

        {/* Bottom Content */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <h3 className="text-xl font-bold text-white mb-1 font-display">{user.username}</h3>
          
          <div className="flex items-center text-white/60 text-sm mb-4">
            <MapPin className="w-3.5 h-3.5 mr-1" />
            <span>{distanceText}</span>
          </div>

          <button 
            onClick={() => setLocation(`/chat/${user.id}`)}
            className="w-full py-3 rounded-xl bg-primary text-white font-semibold shadow-lg shadow-primary/30 hover:bg-primary/90 hover:shadow-primary/40 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            Mesaj yaz
          </button>
        </div>
      </div>
    </motion.div>
  );
}
