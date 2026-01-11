import { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Backend'e kullanıcı bilgilerini gönder
      const idToken = await user.getIdToken();
      
      const res = await fetch('/api/auth/firebase-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idToken,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          uid: user.uid
        }),
      });

      if (!res.ok) {
        throw new Error('Giriş başarısız');
      }

      const data = await res.json();
      
      // 🔥 Token'ı kaydet
      localStorage.setItem('auth_token', data.token);
      
      toast({
        title: "Hoş geldiniz!",
        description: data.isNewUser ? "Profilinizi tamamlayın" : "Başarıyla giriş yaptınız",
      });

      // Redirect - token localStorage'da olduğu için otomatik giriş yapacak
      window.location.href = "/";
    } catch (error: any) {
      console.error("Google login error:", error);
      toast({
        title: "Giriş başarısız",
        description: error.message || "Bir hata oluştu",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a]">
      <div className="glass-panel p-8 md:p-12 rounded-3xl max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-bold text-white mb-2">
            Hoş Geldiniz
          </h1>
          <p className="text-white/60">
            Yakınınızdaki yeni insanlarla tanışmaya başlamak için giriş yapın
          </p>
        </div>

        {/* GOOGLE İLE GİRİŞ BUTONU */}
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full py-3.5 bg-white text-gray-900 rounded-xl font-bold shadow-lg hover:bg-gray-100 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Giriş yapılıyor...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google ile Giriş Yap
            </>
          )}
        </button>

        {/* ALTTAKİ LİNK */}
        <div className="mt-6 text-center">
          <p className="text-white/50 text-sm">
            Google Hesabınız yok mu?{" "}
            <a
              href="https://accounts.google.com/signup"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              Kayıt ol / Giriş yap
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}