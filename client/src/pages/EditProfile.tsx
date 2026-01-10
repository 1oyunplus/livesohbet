import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { ArrowLeft, Camera, Save, X } from "lucide-react";
import { Link } from "wouter";

export default function EditProfile() {
  const { user, isLoading: authLoading, refreshUser } = useAuth();
  const [, setLocation] = useLocation();
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    username: "",
    photoUrl: "",
    age: "",
    gender: "",
    birthDate: "",
    bio: "",
    hobbies: [] as string[],
  });

  const [newHobby, setNewHobby] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/login");
      return;
    }
    if (user) {
      setFormData({
        username: user.username || "",
        photoUrl: user.photoUrl || "",
        age: user.age?.toString() || "",
        gender: (user.gender as string) || "",
        birthDate: user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : "",
        bio: (user.bio as string) || "",
        hobbies: (user.hobbies as string[]) || [],
      });
      if (user.photoUrl) {
        setPhotoPreview(user.photoUrl);
      }
    }
  }, [user, authLoading, setLocation]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Dosya boyutu 5MB\'dan küçük olmalıdır');
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadPhoto = async (): Promise<string | null> => {
    if (!photoFile) return null;

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64 = reader.result as string;
          const token = localStorage.getItem('auth_token');
          const res = await fetch('/api/users/upload-photo', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              photoBase64: base64,
              token
            }),
          });

          if (!res.ok) {
            throw new Error('Fotoğraf yüklenemedi');
          }

          const data = await res.json();
          resolve(data.photoUrl);
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsDataURL(photoFile);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    try {
      const token = localStorage.getItem('auth_token');
      
      let photoUrl = formData.photoUrl;
      if (photoFile) {
        photoUrl = await uploadPhoto() || formData.photoUrl;
      }

      const res = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: formData.username,
          photoUrl,
          age: formData.age ? parseInt(formData.age) : null,
          gender: formData.gender || null,
          birthDate: formData.birthDate || null,
          bio: formData.bio || null,
          hobbies: formData.hobbies,
          token
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Profil güncellenemedi');
      }

      await refreshUser();
      
      setLocation("/profile");
    } catch (error: any) {
      console.error('Error updating profile:', error);
      alert(error.message || 'Profil güncellenirken bir hata oluştu');
    } finally {
      setIsSaving(false);
    }
  };

  const addHobby = () => {
    if (newHobby.trim() && !formData.hobbies.includes(newHobby.trim())) {
      setFormData({
        ...formData,
        hobbies: [...formData.hobbies, newHobby.trim()]
      });
      setNewHobby("");
    }
  };

  const removeHobby = (hobby: string) => {
    setFormData({
      ...formData,
      hobbies: formData.hobbies.filter(h => h !== hobby)
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-white">Yükleniyor...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="pb-24 pt-8 px-4 md:px-8 max-w-3xl mx-auto">
      <div className="glass-panel rounded-3xl p-6 md:p-10">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/profile" className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
          </Link>
          <h1 className="text-3xl font-display font-bold text-white">Profili Düzenle</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Profil Fotoğrafı</label>
            <div className="flex items-center gap-4">
              {photoPreview && (
                <div className="relative">
                  <img 
                    src={photoPreview} 
                    alt="Profil" 
                    className="w-20 h-20 rounded-xl object-cover"
                  />
                </div>
              )}
              <label className="flex-1 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
                <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-all text-center">
                  {photoFile ? 'Fotoğraf Seçildi' : 'Fotoğraf Seç'}
                </div>
              </label>
            </div>
            <p className="text-xs text-white/50">Maksimum dosya boyutu: 5MB</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Kullanıcı Adı</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Yaş</label>
            <input
              type="number"
              min="18"
              max="100"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Cinsiyet</label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
            >
              <option value="">Seçiniz</option>
              <option value="erkek">Erkek</option>
              <option value="kadın">Kadın</option>
              <option value="diğer">Diğer</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Doğum Tarihi</label>
            <input
              type="date"
              value={formData.birthDate}
              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Hakkımda</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={4}
              placeholder="Kendinizden bahsedin..."
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">Hobiler</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newHobby}
                onChange={(e) => setNewHobby(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addHobby())}
                placeholder="Hobi ekle..."
                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
              />
              <button
                type="button"
                onClick={addHobby}
                className="px-4 py-2 bg-primary rounded-xl text-white font-semibold hover:bg-primary/90 transition-colors"
              >
                Ekle
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.hobbies.map((hobby) => (
                <span
                  key={hobby}
                  className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/80 text-sm flex items-center gap-2"
                >
                  {hobby}
                  <button
                    type="button"
                    onClick={() => removeHobby(hobby)}
                    className="hover:text-white transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Link
              href="/profile"
              className="flex-1 px-4 py-3 rounded-xl border border-white/10 text-white hover:bg-white/10 transition-colors text-center font-medium"
            >
              İptal
            </Link>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-4 py-3 bg-primary rounded-xl text-white font-semibold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Kaydet
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}