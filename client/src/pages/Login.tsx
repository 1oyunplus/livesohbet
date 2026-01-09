import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Mail, Lock, User, Loader2 } from "lucide-react";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, register } = useAuth();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await login(email, password);
      } else {
        if (!username.trim()) {
          alert("Kullanıcı adı gereklidir");
          setIsLoading(false);
          return;
        }
        result = await register(username, email, password);
      }

      // BAŞARILI DURUMDA ZORLA YÖNLENDİR
      if (result && result.success) {
        console.log("Giriş/Kayıt başarılı, ana sayfaya gidiliyor...");
        window.location.href = "/"; // setLocation yerine doğrudan tarayıcıyı yönlendiriyoruz
      }
    } catch (err) {
      console.error("Hata oluştu:", err);
    } finally {
      setIsLoading(false);
    }
  };
        const result = await register(username, email, password);
        if (result.success) {
          setLocation("/");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a]">
      <div className="glass-panel p-8 md:p-12 rounded-3xl max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-bold text-white mb-2">
            {isLogin ? "Tekrar Hoş Geldiniz" : "Hesap Oluştur"}
          </h1>
          <p className="text-white/60">
            {isLogin 
              ? "Yakınınızdaki yeni insanlarla tanışmaya başlamak için giriş yapın" 
              : "Topluluğumuza katılın ve harika insanlar keşfedin"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                <User className="w-4 h-4" />
                Kullanıcı Adı
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Kullanıcı adınızı girin"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                required={!isLogin}
              />
            </div>
          )}

          <div className="space-y-2">
              <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                E-posta
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-posta adresinizi girin"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
              required
            />
          </div>

          <div className="space-y-2">
              <label className="text-sm font-medium text-white/80 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Şifre
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Şifrenizi girin"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-primary rounded-xl text-white font-bold shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {isLogin ? "Giriş yapılıyor..." : "Hesap oluşturuluyor..."}
              </>
            ) : (
              isLogin ? "Giriş Yap" : "Hesap Oluştur"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setEmail("");
              setPassword("");
              setUsername("");
            }}
            className="text-primary hover:underline text-sm font-medium"
          >
            {isLogin 
              ? "Hesabınız yok mu? Kayıt olun" 
              : "Zaten hesabınız var mı? Giriş yapın"}
          </button>
        </div>
      </div>
    </div>
  );
}
