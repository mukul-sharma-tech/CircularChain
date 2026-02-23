"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import ProfileSetup from "@/components/ProfileSetup";
import CreateListingModal from "@/components/CreateListingModal";
import { MarketplaceView } from "@/components/MarketplaceView";
import { MyOrdersView } from "@/components/MyOrdersView";
import { AgentHub } from "@/components/AgentHub";
import { AdminPanel } from "@/components/AdminPanel";
import { motion } from "framer-motion";
import { useUserEarnings } from "@/app/hooks/useUserEarnings";
import { ethers } from "ethers";
import { Background3D } from "@/components/Background3D";
import CircularSagePage from "../circular-sag/page";
import WasteCompliancePage from "../waste-compliance/page";

export default function DashboardPage() {
  const { user, loading, updateUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = useState<"marketplace" | "orders" | "circular-sag" | "waste-compliance">("marketplace");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const { totalEarnings } = useUserEarnings();

  useEffect(() => {
    const viewParam = searchParams.get("view");
    if (viewParam === "orders" || viewParam === "circular-sag" || viewParam === "waste-compliance") {
      setView(viewParam as "marketplace" | "orders" | "circular-sag" | "waste-compliance");
    } else {
      setView("marketplace");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!loading && !user?.isLoggedIn) router.push("/");
  }, [user, loading, router]);

  if (loading) return <div className="text-center pt-8">Loading...</div>;
  if (!user?.isLoggedIn) return null;
  if (user.role === "pending") return <ProfileSetup onProfileComplete={updateUser} />;

  // Admin View
  if (user.role === "admin") {
    return (
      <div className="min-h-screen bg-[#04040a] text-slate-100 relative overflow-hidden">
        <Background3D />
        <div className="relative z-10 p-8">
          <h1 className="text-4xl font-black mb-12 text-center text-gradient">
            Platform Admin
          </h1>
          <div className="glass-panel p-8 rounded-3xl">
            <AdminPanel />
          </div>
        </div>
      </div>
    );
  }

  // Agent View
  if (user.role === "agent") {
    return (
      <div className="min-h-screen bg-[#04040a] text-slate-100 relative overflow-hidden">
        <Background3D />
        <div className="relative z-10 p-8 max-w-7xl mx-auto">
          <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome, <span className="text-teal-400">{user.walletAddress?.slice(0, 6)}</span>
            </h1>
            <div className="glass-card px-8 py-4 rounded-2xl border-teal-500/20">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Earnings</h3>
              <p className="text-3xl font-black text-teal-400">₹ {(Number(ethers.formatEther(totalEarnings)) * 100000).toFixed(2)}</p>
            </div>
          </header>
          <div className="glass-panel p-8 rounded-3xl">
            <AgentHub />
          </div>
        </div>
      </div>
    );
  }

  // Seller / Buyer Dashboard
  const renderContent = (): React.ReactElement => {
    if (view === "marketplace") {
      return (
        <div className="space-y-8">
          {user.role === "user" && (
            <motion.div
              className="flex flex-col md:flex-row justify-between items-center gap-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="w-full md:w-auto px-8 py-4 rounded-2xl bg-teal-500 text-slate-900 font-bold hover:bg-teal-400 transition-all shadow-lg shadow-teal-500/20"
              >
                Create New Listing
              </button>
              <div className="w-full md:w-auto glass-card px-8 py-4 rounded-2xl border-teal-500/20">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">My Earnings</h3>
                <p className="text-2xl font-black text-teal-400">₹ {(Number(ethers.formatEther(totalEarnings)) * 100000).toFixed(2)}</p>
              </div>
            </motion.div>
          )}
          <motion.div
            className="glass-panel p-8 rounded-3xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <MarketplaceView />
          </motion.div>
        </div>
      );
    }
    return (
      <div className="glass-panel p-8 rounded-3xl">
        {view === "orders" && <MyOrdersView />}
        {view === "circular-sag" && <CircularSagePage />}
        {view === "waste-compliance" && <WasteCompliancePage />}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#04040a] text-slate-100 relative overflow-hidden">
      <Background3D />

      <div className="relative z-10 max-w-7xl mx-auto p-8">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-12 p-1.5 bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 w-fit mx-auto">
          {[
            { key: "marketplace", label: "Marketplace" },
            { key: "orders", label: "My Orders" },
            { key: "circular-sag", label: "Circular Sage" },
            { key: "waste-compliance", label: "Waste Compliance" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setView(tab.key as "marketplace" | "orders" | "circular-sag" | "waste-compliance")}
              className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-all ${view === tab.key
                ? "bg-teal-500 text-slate-900 shadow-lg shadow-teal-500/20"
                : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Dashboard Content */}
        <div className="min-h-[60vh]">
          {renderContent()}
        </div>
      </div>

      <CreateListingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
