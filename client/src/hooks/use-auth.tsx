import { useState, useEffect } from 'react';
import { User } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check for existing token
    const token = localStorage.getItem('auth_token');
    if (token) {
      fetchUser(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUser = async (token: string) => {
    try {
      const res = await fetch(`/api/auth/me?token=${token}`);
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        connectWebSocket(token);
      } else {
        localStorage.removeItem('auth_token');
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      localStorage.removeItem('auth_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Profil güncelleme sonrası kullanıcı bilgilerini yenile
  const refreshUser = async () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      await fetchUser(token);
    }
  };

  const connectWebSocket = (token: string) => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?token=${token}`;
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      console.log('WebSocket connected');
    };

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Custom event olarak yayınla
        window.dispatchEvent(new CustomEvent('websocket-message', { detail: data }));
        
        if (data.type === 'new_message') {
          // Mesaj geldiğinde bildirim göster
          toast({
            title: "Yeni mesaj",
            description: "Yeni bir mesajınız var",
          });
        } else if (data.type === 'user_online' || data.type === 'user_offline') {
          // Kullanıcı durumu değişti, sayfayı yenile
          window.dispatchEvent(new Event('user-status-update'));
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
      // Reconnect after 3 seconds
      setTimeout(() => {
        if (localStorage.getItem('auth_token')) {
          connectWebSocket(token);
        }
      }, 3000);
    };

    setWs(websocket);
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Giriş başarısız');
      }

      const data = await res.json();
      
      setUser(data.user);
      localStorage.setItem('auth_token', data.token);
      
      try {
        connectWebSocket(data.token);
      } catch (wsError) {
        console.error("WebSocket başlatılamadı:", wsError);
      }
      
      toast({
        title: "Tekrar hoş geldiniz!",
        description: `${data.user.username} olarak başarıyla giriş yapıldı`,
      });
      
      // State'i garanti etmek için küçük bir bekleme
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return { success: true };
    } catch (error: any) {
      toast({
        title: "Giriş başarısız",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Kayıt başarısız');
      }

      const data = await res.json();
      
      setUser(data.user);
      
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
        
        try {
          connectWebSocket(data.token);
        } catch (wsError) {
          console.error("WebSocket başlatılamadı:", wsError);
        }
      }
      
      toast({
        title: "Hoş geldiniz!",
        description: `Hesap başarıyla oluşturuldu!`,
      });
      
      // State'i garanti etmek için küçük bir bekleme
      await new Promise(resolve => setTimeout(resolve, 100));
      
      return { success: true };
    } catch (error: any) {
      console.error("Kayıt sırasında hata:", error);
      toast({
        title: "Kayıt başarısız",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    if (ws) {
      ws.close();
      setWs(null);
    }
    setUser(null);
    localStorage.removeItem('auth_token');
    toast({
      title: "Çıkış yapıldı",
      description: "Tekrar görüşmek üzere!",
    });
  };

  const updateDiamonds = (amount: number) => {
    if (!user) return;
    const updated = { ...user, diamonds: user.diamonds + amount };
    setUser(updated);
  };

  const updateVip = (status: "none" | "bronze" | "silver" | "gold") => {
    if (!user) return;
    const updated = { ...user, vipStatus: status };
    setUser(updated);
  };

  return { user, isLoading, login, register, logout, updateDiamonds, updateVip, refreshUser };
}