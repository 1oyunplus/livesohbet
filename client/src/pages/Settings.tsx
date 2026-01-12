import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft, Shield } from "lucide-react";
import { useLocation, Link } from "wouter";

export default function Settings() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  if (!user) {
    setLocation("/login");
    return null;
  }

  return (
    <div className="pb-24 pt-8 px-4 md:px-8 max-w-3xl mx-auto">
      <button
        onClick={() => setLocation("/profile")}
        className="mb-6 flex items-center gap-2 text-white/60 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Profile Dön
      </button>

      <div className="glass-panel rounded-3xl p-6 md:p-10">
        <h1 className="text-3xl font-bold text-white mb-8">Ayarlar</h1>

        <div className="space-y-4">
          <Link href="/settings/blocked-users">
            <button className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-colors flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-orange-400" />
                <div className="text-left">
                  <div className="font-semibold">Engellenen Kullanıcılar</div>
                  <div className="text-sm text-white/50">Engellediğiniz kullanıcıları görüntüleyin</div>
                </div>
              </div>
              <ArrowLeft className="w-5 h-5 rotate-180" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}