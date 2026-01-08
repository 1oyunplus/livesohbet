import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useStore } from "@/hooks/use-store";
import { useAuth } from "@/hooks/use-auth";
import { Check, Crown, Star } from "lucide-react";
import { motion } from "framer-motion";

export function VipModal() {
  const { showVipModal, setShowVipModal } = useStore();
  const { user, updateVip } = useAuth();

  const handleUpgrade = (tier: "bronze" | "silver" | "gold") => {
    updateVip(tier);
    setShowVipModal(false);
  };

  const tiers = [
    {
      id: "bronze",
      name: "Bronze VIP",
      price: "$4.99/mo",
      color: "from-amber-600 to-amber-800",
      features: ["Unlimited messages", "Bronze badge", "See who viewed you"]
    },
    {
      id: "silver",
      name: "Silver VIP",
      price: "$9.99/mo",
      color: "from-slate-300 to-slate-500",
      features: ["All Bronze features", "Profile boosting", "Silver badge", "Priority support"]
    },
    {
      id: "gold",
      name: "Gold VIP",
      price: "$19.99/mo",
      color: "from-yellow-400 to-yellow-600",
      features: ["All Silver features", "Gold badge", "Incognito mode", "See online status", "5 Super Likes/day"]
    }
  ];

  return (
    <Dialog open={showVipModal} onOpenChange={setShowVipModal}>
      <DialogContent className="glass-panel border-none text-white max-w-4xl w-[95vw] overflow-y-auto max-h-[90vh]">
        <DialogHeader className="text-center mb-8">
          <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary to-pink-500 flex items-center justify-center mb-4 shadow-xl shadow-primary/20">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-3xl font-display font-bold">Upgrade to VIP</DialogTitle>
          <DialogDescription className="text-white/60 text-lg">
            Unlock exclusive features and stand out from the crowd
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier, idx) => (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`relative rounded-2xl p-6 border border-white/10 overflow-hidden bg-black/40 flex flex-col ${
                user?.vipStatus === tier.id ? 'ring-2 ring-primary' : ''
              }`}
            >
              <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${tier.color}`} />
              
              <h3 className="text-xl font-bold font-display mt-2">{tier.name}</h3>
              <div className="text-2xl font-bold mt-2 mb-6">{tier.price}</div>
              
              <ul className="space-y-3 mb-8 flex-1">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                    <Check className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleUpgrade(tier.id as any)}
                disabled={user?.vipStatus === tier.id}
                className={`w-full py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
                  user?.vipStatus === tier.id
                    ? 'bg-white/10 text-white/50 cursor-not-allowed'
                    : `bg-gradient-to-r ${tier.color} text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95`
                }`}
              >
                {user?.vipStatus === tier.id ? 'Current Plan' : 'Choose Plan'}
              </button>
            </motion.div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
