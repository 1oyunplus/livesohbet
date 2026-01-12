import { useAuth } from "@/hooks/use-auth";
import { Camera, LogOut, Settings } from "lucide-react";
import { useLocation, Link } from "wouter";

export default function Profile() {
  const { user, logout, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-white">Yükleniyor...</div>
      </div>
    );
  }

  if (!user) {
    setLocation("/login");
    return null;
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

  return (
    <div className="pb-24 pt-8 px-4 md:px-8 max-w-3xl mx-auto">
      <div className="glass-panel rounded-3xl p-6 md:p-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-primary/30 to-violet-600/30" />

        <div className="relative pt-16 flex flex-col md:flex-row items-center md:items-end gap-6 mb-8">
          <div className="relative group">
            <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-[#121214] shadow-2xl">
              <img 
                src={user.photoUrl || ""} 
                alt={user.username || "Kullanıcı"} 
                className="w-full h-full object-cover"
              />
            </div>
            <button className="absolute bottom-2 right-2 p-2 bg-primary rounded-xl text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold text-white font-display flex items-center justify-center md:justify-start gap-2">
              {user.username || "Kullanıcı Adı Yok"}
              {age && (
                <span className="text-sm font-normal px-2 py-0.5 rounded-full bg-white/10 text-white/60 border border-white/5">
                  {age}
                </span>
              )}
            </h1>
            {gender && (
              <p className="text-white/50 mt-1 capitalize">{gender}</p>
            )}
          </div>

          {/* 🔥 Ayarlar butonu geri geldi */}
          <div className="flex gap-3">
            <button  onClick={() => setLocation("/settings")}
				className="p-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors">
				<Settings className="w-5 h-5" />
			</button>
            <Link href="/profile/edit">
              <button className="px-5 py-3 rounded-xl bg-primary text-white font-semibold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors">
                Profili Düzenle
              </button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/5">
            <div className="text-2xl font-bold text-white">{user.diamonds}</div>
            <div className="text-xs text-white/40 uppercase tracking-wider font-semibold">Elmas</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/5">
            <div className="text-2xl font-bold text-white">
              {user.vipStatus === 'none' ? '-' : user.vipStatus === 'bronze' ? 'Bronz' : user.vipStatus === 'silver' ? 'Gümüş' : 'Altın'}
            </div>
            <div className="text-xs text-white/40 uppercase tracking-wider font-semibold">VIP Durumu</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/5">
            <div className="text-2xl font-bold text-white">{user.isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}</div>
            <div className="text-xs text-white/40 uppercase tracking-wider font-semibold">Durum</div>
          </div>
        </div>

        {user.bio && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Hakkımda</h3>
            </div>
            <p className="text-white/70 leading-relaxed">
              {user.bio}
            </p>
          </div>
        )}

        {hobbies.length > 0 && (
          <div className="mb-10">
            <h3 className="text-lg font-bold text-white mb-4">Hobiler</h3>
            <div className="flex flex-wrap gap-2">
              {hobbies.map((hobby) => (
                <span key={hobby} className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/80 text-sm hover:bg-white/10 transition-colors cursor-default">
                  {hobby}
                </span>
              ))}
            </div>
          </div>
        )}

        <button 
          onClick={logout}
          className="w-full py-4 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2 font-medium"
        >
          <LogOut className="w-5 h-5" />
          Çıkış Yap
        </button>
      </div>
    </div>
  );
}