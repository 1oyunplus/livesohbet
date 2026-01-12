import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Heart, ArrowLeft, Calendar, Sparkles, Shield, Flag } from "lucide-react";
import { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function UserDetail() {
  const { userId } = useParams<{ userId: string }>();
  const [, setLocation] = useLocation();
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiking, setIsLiking] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);

  useEffect(() => {
    if (!userId) return;
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/users/${userId}?token=${token}`);
      
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error("User fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async () => {
    if (!currentUser || !user) return;
    
    setIsLiking(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/users/${userId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        
        toast({
          title: data.liked ? "Beğenildi!" : "Beğeni kaldırıldı",
          description: data.liked ? "Kullanıcıyı beğendiniz" : "Beğeni kaldırıldı",
        });
      }
    } catch (error) {
      console.error("Like error:", error);
      toast({
        title: "Hata",
        description: "Beğeni işlemi başarısız",
        variant: "destructive"
      });
    } finally {
      setIsLiking(false);
    }
  };

  const handleBlock = async () => {
    if (!currentUser || !user) return;
    
    const confirmBlock = window.confirm(`${user.username} kullanıcısını engellemek istediğinize emin misiniz?`);
    if (!confirmBlock) return;

    setIsBlocking(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/users/${userId}/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      if (res.ok) {
        toast({
          title: "Engellendi",
          description: "Kullanıcı başarıyla engellendi",
        });
        setLocation("/discover");
      }
    } catch (error) {
      console.error("Block error:", error);
      toast({
        title: "Hata",
        description: "Engelleme işlemi başarısız",
        variant: "destructive"
      });
    } finally {
      setIsBlocking(false);
    }
  };

  const handleReport = () => {
    // TODO: Şikayet et fonksiyonu - sonra doldurulacak
    toast({
      title: "Bildirim",
      description: "Şikayet sistemi yakında eklenecek",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-white">Kullanıcı bulunamadı</div>
      </div>
    );
  }

  const calculateAge = (birthDate: Date | string | null | undefined): number | null => {
    if (!birthDate) return null;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(user.birthDate);
  const hobbies = (user.hobbies as string[]) || [];
  const gender = (user.gender as string) || "";
  const likedBy = (user.likedBy as string[]) || [];
  const hasLiked = currentUser ? likedBy.includes(currentUser.id) : false;

  return (
    <div className="pb-24 pt-8 px-4 md:px-8 max-w-3xl mx-auto">
      {/* Geri Butonu */}
      <button
        onClick={() => setLocation("/discover")}
        className="mb-6 flex items-center gap-2 text-white/60 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Keşfet'e Dön
      </button>

      <div className="glass-panel rounded-3xl p-6 md:p-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-primary/30 to-violet-600/30" />

        {/* Profil Bilgileri */}
        <div className="relative pt-16 flex flex-col items-center mb-8">
          <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-[#121214] shadow-2xl mb-4">
            <img 
              src={user.photoUrl || ""} 
              alt={user.username || "Kullanıcı"} 
              className="w-full h-full object-cover"
            />
          </div>

          <h1 className="text-3xl font-bold text-white font-display flex items-center gap-2">
            {user.username || "Kullanıcı"}
            {age && (
              <span className="text-sm font-normal px-2 py-0.5 rounded-full bg-white/10 text-white/60 border border-white/5">
                {age}
              </span>
            )}
            {/* 🔥 Beğeni sayacı yanında kalp ikonu */}
            <button
              onClick={handleLike}
              disabled={isLiking}
              className={`ml-2 p-2 rounded-full transition-all ${
                hasLiked
                  ? "bg-red-500 text-white"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              } disabled:opacity-50`}
            >
              <Heart className={`w-5 h-5 ${hasLiked ? "fill-white" : ""}`} />
            </button>
          </h1>

          {gender && (
            <p className="text-white/50 mt-1 capitalize">{gender}</p>
          )}

          {/* Beğeni Sayacı */}
          <div className="mt-2 flex items-center gap-2 text-white/60">
            <span className="text-sm">{user.likes || 0} kişi beğendi</span>
          </div>
        </div>

        {/* Hobiler */}
        {hobbies.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-bold text-white mb-3">Hobiler</h3>
            <div className="flex flex-wrap gap-2">
              {hobbies.map((hobby) => (
                <span 
                  key={hobby} 
                  className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/80 text-sm"
                >
                  {hobby}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Bilgiler */}
        <div className="space-y-6">
          {/* Hakkında */}
          {user.bio && (
            <div>
              <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Hakkımda
              </h3>
              <p className="text-white/70 leading-relaxed bg-white/5 rounded-2xl p-4 border border-white/5">
                {user.bio}
              </p>
            </div>
          )}

          {/* Doğum Tarihi */}
          {user.birthDate && (
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
              <div className="flex items-center gap-3 text-white/80">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <div className="text-xs text-white/40 uppercase tracking-wider font-semibold">Doğum Tarihi</div>
                  <div className="text-sm">{new Date(user.birthDate).toLocaleDateString('tr-TR')}</div>
                </div>
              </div>
            </div>
          )}

          {/* VIP Durumu */}
          {user.vipStatus !== 'none' && (
            <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 rounded-2xl p-4 border border-amber-500/20">
              <div className="text-amber-400 font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                {user.vipStatus === 'bronze' ? 'Bronz' : user.vipStatus === 'silver' ? 'Gümüş' : 'Altın'} VIP Üye
              </div>
            </div>
          )}

          {/* Engelle ve Şikayet Et Butonları */}
          <div className="grid grid-cols-2 gap-3 pt-4">
            <button
              onClick={handleBlock}
              disabled={isBlocking}
              className="py-3 rounded-xl border border-orange-500/20 text-orange-400 hover:bg-orange-500/10 transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50"
            >
              <Shield className="w-5 h-5" />
              Engelle
            </button>
            <button
              onClick={handleReport}
              className="py-3 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2 font-medium"
            >
              <Flag className="w-5 h-5" />
              Şikayet Et
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}