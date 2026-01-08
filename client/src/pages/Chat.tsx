import { useRoute } from "wouter";
import { useState, useEffect, useRef } from "react";
import { Send, ArrowLeft, MoreVertical, Phone, Video, Trash2, Ban } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUsers, useChatMessages } from "@/hooks/use-users";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function Chat() {
  const [match, params] = useRoute("/chat/:id");
  const { data: users } = useUsers();
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  const selectedUser = params?.id ? users?.find(u => u.id === params.id) : null;
  const { data: messagesData, refetch: refetchMessages } = useChatMessages(params?.id || "");
  
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messageCount, setMessageCount] = useState<{ freeMessagesSent: number; paidMessagesSent: number } | null>(null);
  const [showDiamondModal, setShowDiamondModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Mesaj sayısını getir
  useEffect(() => {
    if (params?.id && currentUser) {
      const token = localStorage.getItem('auth_token');
      fetch(`/api/messages/count?token=${token}&receiverId=${params.id}`)
        .then(res => res.json())
        .then(data => setMessageCount(data))
        .catch(console.error);
    }
  }, [params?.id, currentUser]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !currentUser) {
      setLocation("/login");
    }
  }, [authLoading, currentUser, setLocation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [messagesData]);

  // Listen for new messages via WebSocket
  useEffect(() => {
    const handleWebSocketMessage = (event: CustomEvent) => {
      try {
        const data = event.detail;
        if (data.type === 'new_message' && data.message) {
          // Check if message is for current chat
          const msg = data.message;
          if ((msg.senderId === params?.id && msg.receiverId === currentUser?.id) ||
              (msg.receiverId === params?.id && msg.senderId === currentUser?.id)) {
            refetchMessages();
          }
        }
      } catch (error) {
        console.error('Error handling WebSocket message:', error);
      }
    };

    // Listen for custom WebSocket events
    window.addEventListener('websocket-message', handleWebSocketMessage as EventListener);
    return () => window.removeEventListener('websocket-message', handleWebSocketMessage as EventListener);
  }, [params?.id, currentUser?.id, refetchMessages]);

  const handleSend = async (useDiamonds = false) => {
    if (!message.trim() || !currentUser || !selectedUser || isSending) return;
    
    setIsSending(true);
    const messageText = message;
    setMessage("");

    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiverId: selectedUser.id,
          content: messageText,
          useDiamonds,
          token
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        if (errorData.requiresDiamonds) {
          setShowDiamondModal(true);
          setMessage(messageText);
        } else {
          throw new Error(errorData.error || 'Mesaj gönderilemedi');
        }
        return;
      }

      // Refresh messages and count
      await refetchMessages();
      const countRes = await fetch(`/api/messages/count?token=${token}&receiverId=${selectedUser.id}`);
      if (countRes.ok) {
        const countData = await countRes.json();
        setMessageCount(countData);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessage(messageText);
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!selectedUser) return;
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/messages/${messageId}?token=${token}&receiverId=${selectedUser.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        await refetchMessages();
        setSelectedMessageId(null);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleDeleteChat = async () => {
    if (!selectedUser) return;
    if (!confirm('Tüm konuşmayı silmek istediğinize emin misiniz?')) return;
    
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`/api/messages/chat/${selectedUser.id}?token=${token}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        await refetchMessages();
        setShowMenu(false);
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  const handleBlockUser = async () => {
    if (!selectedUser) return;
    if (!confirm(`${selectedUser.username} kullanıcısını engellemek istediğinize emin misiniz?`)) return;
    
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/users/block', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          blockedUserId: selectedUser.id,
          token
        })
      });

      if (res.ok) {
        setLocation("/chat");
      }
    } catch (error) {
      console.error('Error blocking user:', error);
    }
  };

  const messages = messagesData || [];

  // If no chat selected, show list
  if (!match || !selectedUser) {
    if (authLoading) {
      return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto pt-8">
          <div className="text-white">Yükleniyor...</div>
        </div>
      );
    }

    if (!currentUser) {
      return null;
    }

    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto pt-8">
        <h1 className="text-4xl font-display font-bold text-white mb-8">Mesajlar</h1>
        <div className="glass-panel rounded-3xl overflow-hidden min-h-[500px]">
          {users && users.length > 0 ? (
            users.map(user => (
              <Link key={user.id} href={`/chat/${user.id}`} className="flex items-center gap-4 p-4 hover:bg-white/5 border-b border-white/5 transition-colors cursor-pointer">
                <div className="relative">
                  <img src={user.photoUrl || ""} alt={user.username} className="w-12 h-12 rounded-full object-cover" />
                  {user.isOnline && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1a1a1a]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold truncate">{user.username}</h3>
                  <p className="text-white/50 text-sm truncate">Sohbete başlamak için tıklayın...</p>
                </div>
                <span className="text-white/30 text-xs">
                  {user.isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}
                </span>
              </Link>
            ))
          ) : (
            <div className="p-8 text-center text-white/60">
              <p>Kullanıcı bulunamadı. Hesap oluşturarak veya giriş yaparak başlayın!</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen md:h-[calc(100vh-2rem)] md:m-4 flex flex-col glass-panel md:rounded-3xl overflow-hidden max-w-5xl mx-auto relative z-10">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link href="/chat" className="md:hidden p-2 -ml-2 text-white/70 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="relative">
            <img src={selectedUser.photoUrl || ""} alt={selectedUser.username} className="w-10 h-10 rounded-full object-cover" />
            {selectedUser.isOnline && (
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#1a1a1a]" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-white leading-tight">{selectedUser.username}</h3>
            <p className="text-xs text-white/50">{selectedUser.isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors">
            <Phone className="w-5 h-5" />
          </button>
          <button className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors">
            <Video className="w-5 h-5" />
          </button>
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-2 bg-black/90 backdrop-blur-md rounded-xl p-2 min-w-[200px] border border-white/10 z-50">
                <button
                  onClick={handleDeleteChat}
                  className="w-full px-4 py-2 text-left text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Konuşmayı Sil
                </button>
                <button
                  onClick={handleBlockUser}
                  className="w-full px-4 py-2 text-left text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Ban className="w-4 h-4" />
                  Kullanıcıyı Engelle
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser?.id;
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}
              onMouseEnter={() => setSelectedMessageId(msg.id)}
              onMouseLeave={() => setSelectedMessageId(null)}
            >
              <div className={`max-w-[75%] p-3.5 rounded-2xl relative ${
                isMe 
                  ? 'bg-primary text-white rounded-tr-sm shadow-lg shadow-primary/20' 
                  : 'bg-white/10 text-white rounded-tl-sm border border-white/5'
              }`}>
                <p>{msg.content}</p>
                <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-white/60' : 'text-white/40'}`}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                {isMe && selectedMessageId === msg.id && (
                  <button
                    onClick={() => handleDeleteMessage(msg.id)}
                    className="absolute -top-2 -right-2 p-1.5 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Mesaj Limiti Bilgisi */}
      {messageCount && (
        <div className="px-4 py-2 border-t border-white/10 bg-black/10">
          <p className="text-xs text-white/60 text-center">
            {messageCount.freeMessagesSent < 3 
              ? `Ücretsiz mesaj: ${3 - messageCount.freeMessagesSent} kaldı`
              : currentUser?.vipStatus === 'bronze' 
                ? `Bronz VIP: ${20 - (messageCount.freeMessagesSent + messageCount.paidMessagesSent)} mesaj hakkı kaldı`
                : currentUser?.vipStatus === 'silver'
                  ? `Gümüş VIP: ${40 - (messageCount.freeMessagesSent + messageCount.paidMessagesSent)} mesaj hakkı kaldı`
                  : currentUser?.vipStatus === 'gold'
                    ? `Altın VIP: ${60 - (messageCount.freeMessagesSent + messageCount.paidMessagesSent)} mesaj hakkı kaldı`
                    : 'Elmas ile mesaj gönderebilirsiniz'}
          </p>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-white/10 bg-black/20 backdrop-blur-md">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex items-center gap-2 bg-white/5 border border-white/10 p-1.5 rounded-full pl-4 focus-within:bg-white/10 focus-within:border-primary/50 transition-all"
        >
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Mesaj yazın..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder:text-white/30 py-2"
          />
          <button 
            type="submit"
            disabled={!message.trim() || isSending}
            className="p-2.5 bg-primary rounded-full text-white shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all"
          >
            <Send className="w-4 h-4 ml-0.5" />
          </button>
        </form>
      </div>

      {/* Elmas Modal */}
      {showDiamondModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="glass-panel rounded-3xl p-6 max-w-md w-full">
            <h3 className="text-2xl font-bold text-white mb-4">Elmas Gerekli</h3>
            <p className="text-white/70 mb-6">
              Ücretsiz mesaj hakkınız doldu. Mesaj göndermek için 1 elmas gerekiyor.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDiamondModal(false)}
                className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-white hover:bg-white/10 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={() => {
                  setShowDiamondModal(false);
                  handleSend(true);
                }}
                className="flex-1 px-4 py-3 bg-primary rounded-xl text-white font-semibold hover:bg-primary/90 transition-colors"
              >
                1 Elmas ile Gönder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
