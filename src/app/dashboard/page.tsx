// "use client";

// import { useState } from "react"; // <-- Import useState
// import { useAuth } from "../../../context/AuthContext";
// import { useRouter } from "next/navigation";
// import { useEffect } from "react";
// import ProfileSetup from "@/components/ProfileSetup";
// import { CreateListingForm } from "@/components/CreateListingForm";
// import { MarketplaceView } from "@/components/MarketplaceView";
// import { MyOrdersView } from "@/components/MyOrdersView"; // <-- Import MyOrdersView
// import { AgentHub } from "@/components/AgentHub";
// import { AdminPanel } from "@/components/AdminPanel";

// export default function DashboardPage() {
//     const { user, loading, updateUser } = useAuth();
//     const router = useRouter();
//     const [view, setView] = useState<'marketplace' | 'orders'>('marketplace'); // Tab state

//     useEffect(() => {
//         if (!loading && !user.isLoggedIn) {
//             router.push('/');
//         }
//     }, [user, loading, router]);

//     if (loading) return <div className="text-center pt-8">Loading...</div>;
//     if (!user.isLoggedIn) return null;
//     if (user.role === 'pending') return <ProfileSetup onProfileComplete={updateUser} />;

//     const renderContent = () => {
//         if (view === 'marketplace') {
//             return (
//                 <>
//                     {user.role === 'seller' && <CreateListingForm />}
//                     <div className="mt-8"><MarketplaceView /></div>
//                 </>
//             );
//         }
//         if (view === 'orders') {
//             return <MyOrdersView />;
//         }
//     };


//     if (user.role === 'admin') {
//         return (
//             <div className="p-4 md:p-8">
//                 <h1 className="text-3xl font-bold mb-8">Platform Admin Dashboard</h1>
//                 <AdminPanel />
//             </div>
//         );
//     }


//     // Agent has a different, simpler dashboard
//     if (user.role === 'agent') {
//         return (
//             <div className="p-4 md:p-8">
//                 <h1 className="text-3xl font-bold mb-6">Welcome Agent, {user.walletAddress?.slice(0, 6)}...</h1>
//                 <AgentHub />
//                 {/* <AgentDashboard /> */}
//             </div>
//         )
//     }

//     return (
//         <div className="p-4 md:p-8">
//             <div className="border-b border-gray-700 mb-6">
//                 <nav className="-mb-px flex space-x-8" aria-label="Tabs">
//                     <button onClick={() => setView('marketplace')} className={`${view === 'marketplace' ? 'border-teal-400 text-white' : 'border-transparent text-gray-400 hover:text-white'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
//                         Marketplace
//                     </button>
//                     <button onClick={() => setView('orders')} className={`${view === 'orders' ? 'border-teal-400 text-white' : 'border-transparent text-gray-400 hover:text-white'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
//                         My Orders
//                     </button>
//                 </nav>
//             </div>
//             {renderContent()}
//         </div>
//     );
// }

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

export default function DashboardPage() {
  const { user, loading, updateUser } = useAuth();
  const router = useRouter();
  const [view, setView] = useState<"marketplace" | "orders">("marketplace");

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
        <AgentHub />
      </div>
    );
  }

  // Seller / Buyer Dashboard
  const renderContent = () => {
    if (view === "marketplace") {
      return (
        <>
          {user.role === "seller" && (
            <motion.div
              className="bg-gray-800/50 backdrop-blur-md p-6 rounded-xl mb-6 shadow-lg hover:shadow-teal-400/40 transition-shadow"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <CreateListingForm />
            </motion.div>
          )}
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
