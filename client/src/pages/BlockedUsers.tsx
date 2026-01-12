import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft, Shield, UserX } from "lucide-react";
import { useLocation } from "wouter";
import { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function BlockedUsers() {
  const { user, refreshUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [blockedUsers, setBlockedUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLocation("/login");
      return;
    }
    fetchBlockedUsers();
  }, [user]);

  const fetchBlockedUsers = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const blockedIds = (user?.blockedUsers as string[]) || [];
      
      if (blockedIds.length === 0) {
        setIsLoading(false);
        return;
      }

      // Her engellenen kullanıcı için bilgileri çek
      const usersPromises = blockedIds.map(async (id) => {
        const res = await fetch(`/api/users/${id}?token=${token}`);
        if (res.ok) {
          const data = await res.json();
          return data.user;
        }
        return null;
      });

      const users = await Promise.all(usersPromises);
      setBlockedUsers(users.filter(u => u !== null));
    } catch (error) {
      console.error("Fetch blocked users error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnblock = async (userId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/users/${userId}/unblock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      if (res.ok) {
        toast({
          title: "Engel kaldırıldı",
          description: "Kullanıcı engeli kaldırıldı",
        });
        
        // Listeyi güncelle
        setBlockedUsers(prev => prev.filter(u => u.id !== userId));
        await refreshUser();
      }
    } catch (error) {
      console.error("Unblock error:", error);
      toast({
        title: "Hata",
        description: "Engel kaldırma başarısız",
        variant: "destructive"
      });
    }
  };

  if (!user) return null;

  return (
    <div className="pb-24 pt-8 px-4 md:px-8 max-w-3xl mx-auto">
      <button
        onClick={() => setLocation("/settings")}
        className="mb-6 flex items-center gap-2 text-white/60 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Ayarlara Dön
      </button>

      <div className="glass-panel rounded-3xl p-6 md:p-10">
        <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
          <Shield className="w-8 h-8 text-orange-400" />
          Engellenen Kullanıcılar
        </h1>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : blockedUsers.length === 0 ? (
          <div className="text-center py-12">
            <UserX className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <p className="text-white/50">Henüz engellenen kullanıcı yok</p>
          </div>
        ) : (
          <div className="space-y-3">
            {blockedUsers.map((blockedUser) => (
              <div 
                key={blockedUser.id}
                className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <img 
                    src={blockedUser.photoUrl || ""} 
                    alt={blockedUser.username || ""}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-semibold text-white">{blockedUser.username}</div>
                    <div className="text-sm text-white/50">{blockedUser.email}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleUnblock(blockedUser.id)}
                  className="px-4 py-2 rounded-lg bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-colors text-sm font-medium"
                >
                  Engeli Kaldır
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}