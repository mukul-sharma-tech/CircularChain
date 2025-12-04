"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { useRouter } from "next/navigation";
import ProfileSetup from "@/components/ProfileSetup";
import { CreateListingForm } from "@/components/CreateListingForm";
import { MarketplaceView } from "@/components/MarketplaceView";
import { MyOrdersView } from "@/components/MyOrdersView";
import { AgentHub } from "@/components/AgentHub";
import { AdminPanel } from "@/components/AdminPanel";
import { motion } from "framer-motion";
import { useUserEarnings } from "@/app/hooks/useUserEarnings";
import { ethers } from "ethers";

export default function DashboardPage() {
  const { user, loading, updateUser } = useAuth();
  const router = useRouter();
  const [view, setView] = useState<"marketplace" | "orders">("marketplace");
  const { totalEarnings, loading: earningsLoading } = useUserEarnings();

  useEffect(() => {
    if (!loading && !user?.isLoggedIn) router.push("/");
  }, [user, loading, router]);

  if (loading) return <div className="text-center pt-8">Loading...</div>;
  if (!user?.isLoggedIn) return null;
  if (user.role === "pending") return <ProfileSetup onProfileComplete={updateUser} />;

  // Admin View
  if (user.role === "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#101020] to-[#1a1a2e] p-8 text-white">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent">
          Platform Admin Dashboard
        </h1>
        <AdminPanel />
      </div>
    );
  }

  // Agent View
  if (user.role === "agent") {
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#101020] to-[#1a1a2e] p-8 text-white">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Welcome Agent, {user.walletAddress?.slice(0, 6)}...
        </h1>
        <div className="bg-gray-800/40 backdrop-blur-sm p-5 rounded-xl border border-gray-700 mb-6">
            <h3 className="text-lg font-bold text-white mb-2">My Earnings</h3>
            {earningsLoading ? (
                <p>Loading earnings...</p>
            ) : (
                // <p className="text-2xl font-bold text-teal-400">{ethers.formatEther(totalEarnings)} ETH</p>
                                <p className="text-2xl font-bold text-teal-400">₹ {(Number(ethers.formatEther(totalEarnings)) * 100000).toFixed(2)}</p>
                
            )}
        </div>
        <AgentHub />
      </div>
    );
  }

  // Seller / Buyer Dashboard
  const renderContent = () => {
    if (view === "marketplace") {
      return (
        <>
          {user.role === "user" && <CreateListingForm />}
          <motion.div
            className="bg-gray-800/50 backdrop-blur-md p-6 rounded-xl shadow-lg hover:shadow-teal-400/40 transition-shadow"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <MarketplaceView />
          </motion.div>
        </>
      );
    }
    if (view === "orders") {
      return <MyOrdersView />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#101020] to-[#1a1a2e] p-8 text-white">
        <div className="bg-gray-800/40 backdrop-blur-sm p-5 rounded-xl border border-gray-700 mb-6">
            <h3 className="text-lg font-bold text-white mb-2">My Earnings</h3>
            {earningsLoading ? (
                <p>Loading earnings...</p>
            ) : (
                // <p className="text-2xl font-bold text-teal-400">{ethers.formatEther(totalEarnings)} ETH</p>
                <p className="text-2xl font-bold text-teal-400">₹ {(Number(ethers.formatEther(totalEarnings)) * 100000).toFixed(2)}</p>
                
            )}
        </div>
      {/* Tabs */}
      <div className="border-b border-gray-700 mb-6 flex justify-center">
        {["marketplace", "orders"].map((tab) => (
          <motion.button
            key={tab}
            onClick={() => setView(tab as "marketplace" | "orders")}
            whileHover={{ scale: 1.05 }}
            className={`whitespace-nowrap py-3 px-4 font-medium text-sm border-b-2 mx-2 ${
              view === tab
                ? "border-teal-400 text-white"
                : "border-transparent text-gray-400 hover:text-white"
            }`}
          >
            {tab === "marketplace" ? "Marketplace" : "My Orders"}
          </motion.button>
        ))}
      </div>

      {/* Dashboard Content */}
      {renderContent()}
    </div>
  );
}
