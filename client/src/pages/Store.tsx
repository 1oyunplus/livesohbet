import { useAuth } from "@/hooks/use-auth";
import { useStore } from "@/hooks/use-store";
import { motion } from "framer-motion";
import { Diamond, Crown, Zap, Shield, Heart } from "lucide-react";

export default function Store() {
  const { user, updateDiamonds } = useAuth();
  const { setShowVipModal } = useStore();

  const diamondPackages = [
    { amount: 100, price: 25, bonus: 0 },
	{ amount: 225, price: 50, bonus: 25 },
    { amount: 350, price: 75, bonus: 50 },
	{ amount: 475, price: 100, bonus: 75 },
	{ amount: 600, price: 125, bonus: 100 },popular: true },
    { amount: 1200, price: 250, bonus: 200},
    { amount: 2400, price: 500, bonus: 400 },
  ];

  const vipPackages = [
    { type: 'bronze', name: 'Bronz VIP', price: 199, features: ['20 mesaj/kişi', 'Profil öne çıkarma', 'Okundu bilgisi'] },
    { type: 'silver', name: 'Gümüş VIP', price: 399, features: ['40 mesaj/kişi', 'Profil öne çıkarma', 'Okundu bilgisi', 'Gizli mod'] },
    { type: 'gold', name: 'Altın VIP', price: 699, features: ['60 mesaj/kişi', 'Profil öne çıkarma', 'Okundu bilgisi', 'Gizli mod', 'Kim beğendi gör'] },
  ];

  const handlePurchase = (type: 'diamond' | 'vip', item: any) => {
    // Ödeme sayfasına yönlendir
    const params = new URLSearchParams();
    if (type === 'diamond') {
      params.set('type', 'diamond');
      params.set('amount', item.amount.toString());
      params.set('price', item.price.toString());
    } else {
      params.set('type', 'vip');
      params.set('vipType', item.type);
      params.set('price', item.price.toString());
    }
    window.location.href = `/payment?${params.toString()}`;
  };

  return (
    <div className="pb-24 pt-8 px-4 md:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4">
          Mağaza
        </h1>
        <p className="text-white/60 text-lg max-w-2xl mx-auto">
          Elmas satın alın, profilinizi yükseltin ve özel özelliklerin kilidini açın.
        </p>
      </div>

      {/* Current Balance */}
      <div className="glass-panel max-w-md mx-auto rounded-2xl p-6 flex items-center justify-between mb-12 border-primary/30 bg-primary/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center border border-primary/50">
            <Diamond className="w-6 h-6 text-primary fill-primary" />
          </div>
          <div>
            <div className="text-sm text-white/50 font-medium">Bakiyeniz</div>
            <div className="text-2xl font-bold text-white">{user?.diamonds || 0} Elmas</div>
          </div>
        </div>
        <button className="px-4 py-2 bg-primary rounded-lg text-white font-semibold text-sm">
          Geçmiş
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {diamondPackages.map((pkg, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`glass-panel rounded-2xl p-6 relative group hover:-translate-y-1 transition-transform duration-300 ${pkg.popular ? 'border-primary/50 shadow-primary/20' : ''}`}
          >
            {pkg.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                EN POPÜLER
              </div>
            )}
            
            <div className="flex justify-center mb-6 mt-2">
              <Diamond className={`w-12 h-12 text-primary fill-primary/20 drop-shadow-[0_0_15px_rgba(124,58,237,0.5)]`} />
            </div>
            
            <div className="text-center mb-6">
              <div className="text-3xl font-bold text-white mb-1">{pkg.amount}</div>
              {pkg.bonus > 0 && <div className="text-green-400 text-sm font-semibold">+{pkg.bonus} Bonus</div>}
            </div>

            <button 
              onClick={() => handlePurchase('diamond', pkg)}
              className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold transition-all"
            >
              {pkg.price} TL
            </button>
          </motion.div>
        ))}
      </div>

      {/* VIP Packages */}
      <div className="mb-12">
        <h2 className="text-3xl font-display font-bold text-white mb-8 text-center">VIP Paketleri</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {vipPackages.map((pkg, idx) => (
            <motion.div
              key={pkg.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="glass-panel rounded-2xl p-6 relative border-yellow-500/30"
            >
              <div className="flex items-center gap-3 mb-4">
                <Crown className="w-6 h-6 text-yellow-400 fill-yellow-400" />
                <h3 className="text-xl font-bold text-white">{pkg.name}</h3>
              </div>
              
              <div className="mb-6">
                <div className="text-3xl font-bold text-white mb-4">{pkg.price} TL</div>
                <ul className="space-y-2">
                  {pkg.features.map((feature, i) => (
                    <li key={i} className="text-white/70 text-sm flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <button 
                onClick={() => handlePurchase('vip', pkg)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-bold shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/30 transition-all"
              >
                Satın Al
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
