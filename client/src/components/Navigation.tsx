import { Link, useLocation } from "wouter";
import { Compass, MessageSquare, ShoppingBag, User } from "lucide-react";
import { motion } from "framer-motion";
import { useStore } from "@/hooks/use-store";

export function Navigation() {
  const [location] = useLocation();
  const { setActiveTab } = useStore();

  const navItems = [
    { id: 'discover', icon: Compass, label: "Keşfet", path: "/" },
    { id: 'chat', icon: MessageSquare, label: "Mesajlar", path: "/chat" },
    { id: 'store', icon: ShoppingBag, label: "Mağaza", path: "/store" },
    { id: 'profile', icon: User, label: "Profil", path: "/profile" },
  ];

  return (
    <>
      {/* Mobile Bottom Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <div className="glass-panel mx-4 mb-4 rounded-2xl px-2 py-2 flex justify-around items-center">
          {navItems.map((item) => {
            const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
            return (
              <Link 
                key={item.id} 
                href={item.path} 
                className={`relative p-3 rounded-xl transition-all duration-300 ${
                  isActive ? 'text-white' : 'text-white/40 hover:text-white/70'
                }`}
                onClick={() => setActiveTab(item.id as any)}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-bg"
                    className="absolute inset-0 bg-primary rounded-xl -z-10 shadow-lg shadow-primary/40"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                <span className="sr-only">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <nav className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-24 z-50 py-8 items-center glass-panel border-r border-white/10 m-0 rounded-none h-screen">
        <div className="mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center shadow-lg shadow-primary/25">
            <span className="font-display font-bold text-2xl text-white">V</span>
          </div>
        </div>

        <div className="flex flex-col gap-6 flex-1 justify-center">
          {navItems.map((item) => {
            const isActive = location === item.path || (item.path !== "/" && location.startsWith(item.path));
            return (
              <Link 
                key={item.id} 
                href={item.path}
                className={`group relative p-4 rounded-xl transition-all duration-300 ${
                  isActive ? 'text-white' : 'text-white/40 hover:text-white/70'
                }`}
                onClick={() => setActiveTab(item.id as any)}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-bg-desktop"
                    className="absolute inset-0 bg-primary rounded-xl -z-10 shadow-lg shadow-primary/40"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                
                {/* Tooltip */}
                <span className="absolute left-full ml-4 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
