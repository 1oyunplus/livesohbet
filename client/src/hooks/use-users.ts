import { useQuery } from "@tanstack/react-query";
import { User, Message } from "@shared/schema";
import { useAuth } from "./use-auth";
import { useEffect } from "react";

export function useUsers() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ['users', user?.id],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        return [];
      }

      const res = await fetch(`/api/users?token=${token}`);
      if (!res.ok) {
        throw new Error('Failed to fetch users');
      }
      return res.json() as Promise<User[]>;
    },
    enabled: !!user,
    refetchInterval: 5000, // Her 5 saniyede bir yenile
  });

  // Kullanıcı durumu değiştiğinde yenile
  useEffect(() => {
    const handleStatusUpdate = () => {
      query.refetch();
    };
    
    window.addEventListener('user-status-update', handleStatusUpdate);
    return () => window.removeEventListener('user-status-update', handleStatusUpdate);
  }, [query]);

  return query;
}

export function useChatMessages(friendId: string) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['messages', friendId, user?.id],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      if (!token || !friendId) {
        return [];
      }

      const res = await fetch(`/api/messages?token=${token}&receiverId=${friendId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch messages');
      }
      const messages = await res.json() as Message[];
      
      // Date string'lerini Date objelerine çevir
      return messages.map(msg => ({
        ...msg,
        createdAt: new Date(msg.createdAt),
        lastActive: msg.lastActive ? new Date(msg.lastActive) : undefined
      }));
    },
    enabled: !!user && !!friendId,
    refetchInterval: 2000, // Her 2 saniyede bir yenile
  });
}
