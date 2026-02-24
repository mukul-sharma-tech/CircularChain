// "use client";

// import { useAuth } from "../../context/AuthContext";
// import { useState } from "react";
// import { MyOrdersView } from "./MyOrdersView";

// export const AgentHub = () => {
//     const { user, updateUser } = useAuth();
//     const [loading, setLoading] = useState(false);

//     const handleToggleAvailability = async () => {
//         setLoading(true);
//         try {
//             const response = await fetch('/api/user/availability', { method: 'POST' });
//             if (!response.ok) throw new Error("Failed to update status.");

//             const { isAvailable } = await response.json();

//             // Update the global user state in the AuthContext
//             updateUser({ ...user, isAvailable });

//         } catch (error) {
//             console.error(error);
//             alert("Could not update your availability status.");
//         } finally {
//             setLoading(false);
//         }
//     };

//     // The user object from useAuth now contains the isAvailable status.
//     // The ProfileSetup flow handles the initial registration.
//     const isAvailable = user.isAvailable || false;

//     return (
//         <div>
//             <div className="bg-gray-800/60 p-6 rounded-lg mb-8">
//                 <h3 className="text-xl font-bold">Your Status</h3>
//                 <div className="flex items-center justify-between mt-4">
//                     <p className={`font-bold text-lg ${isAvailable ? 'text-green-400' : 'text-red-400'}`}>
//                         {isAvailable ? "Available for Offers" : "Not Available"}
//                     </p>
//                     <button 
//                         onClick={handleToggleAvailability}
//                         disabled={loading}
//                         className={`font-bold py-2 px-6 rounded-lg ${isAvailable ? 'bg-red-500' : 'bg-green-500'} text-white disabled:bg-gray-500`}
//                     >
//                         {loading ? 'Updating...' : (isAvailable ? "Go Offline" : "Go Online")}
//                     </button>
//                 </div>
//             </div>

//             <div>
//                 <h3 className="text-xl font-bold mb-4">Incoming Offers & Current Jobs</h3>
//                 <MyOrdersView />
//             </div>
//         </div>
//     );
// };

// "use client";
// import { useAuth } from "../../context/AuthContext";
// import { useState } from "react";
// import { MyOrdersView } from "./MyOrdersView";
// import { AgentOffers } from "./AgentOffers";
// export const AgentHub = () => {
//     const { user, updateUser } = useAuth();
//     const [loading, setLoading] = useState(false);

//     const handleToggleAvailability = async () => {
//         setLoading(true);
//         try {
//             const response = await fetch('/api/user/availability', { method: 'POST' });
//             if (!response.ok) throw new Error("Failed to update status.");
//             const { isAvailable } = await response.json();
//             updateUser({ ...user, isAvailable });
//         } catch (error) {
//             console.error(error);
//             alert("Could not update your availability status.");
//         } finally {
//             setLoading(false);
//         }
//     };

//     const isAvailable = user.isAvailable || false;

//     return (
//         <div>
//             <div className="bg-gray-800/60 p-6 rounded-lg mb-8">
//                 <h3 className="text-xl font-bold">Your Status</h3>
//                 <div className="flex items-center justify-between mt-4">
//                     <p className={`font-bold text-lg ${isAvailable ? 'text-green-400' : 'text-red-400'}`}>
//                         {isAvailable ? "Available for Offers" : "Not Available"}
//                     </p>
//                     <button 
//                         onClick={handleToggleAvailability}
//                         disabled={loading}
//                         className={`font-bold py-2 px-6 rounded-lg ${isAvailable ? 'bg-red-500' : 'bg-green-500'} text-white disabled:bg-gray-500`}
//                     >
//                         {loading ? 'Updating...' : (isAvailable ? "Go Offline" : "Go Online")}
//                     </button>
//                 </div>
//             </div>

//             <div className="mb-8">
//                 <h3 className="text-2xl font-bold mb-4">Pending Offers</h3>
//                 <AgentOffers />
//             </div>

//             <div>
//                 <h3 className="text-2xl font-bold mb-4">My Active Jobs</h3>
//                 <p className="text-gray-400 mb-6">These are deliveries you have accepted and are currently assigned to.</p>
//                 <MyOrdersView />
//             </div>
//         </div>
//     );
// };

"use client";
import { useAuth } from "../../context/AuthContext";
import { useState } from "react";
import { MyOrdersView } from "./MyOrdersView";
import { AgentOffers } from "./AgentOffers";
import { motion } from "framer-motion";

export const AgentHub = () => {
    const { user, updateUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<"status" | "jobs">("status");

    const handleToggleAvailability = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/user/availability", { method: "POST" });
            if (!response.ok) throw new Error("Failed to update status.");
            const { isAvailable } = await response.json();
            updateUser({ ...user, isAvailable });
        } catch (error) {
            console.error(error);
            alert("Could not update your availability status.");
        } finally {
            setLoading(false);
        }
    };

    const isAvailable = user.isAvailable || false;

    return (
        <div>
            {/* Tabs */}
            <div className="flex justify-center border-b border-border mb-6">
                {["status", "jobs"].map((tab) => (
                    <motion.button
                        key={tab}
                        onClick={() => setActiveTab(tab as "status" | "jobs")}
                        whileHover={{ scale: 1.05 }}
                        className={`whitespace-nowrap py-3 px-4 font-medium text-sm border-b-2 mx-2 transition-colors ${activeTab === tab
                                ? "border-accent-teal text-foreground"
                                : "border-transparent text-muted hover:text-foreground"
                            }`}
                    >
                        {tab === "status" ? "Status & Pending Offers" : "My Active Jobs"}
                    </motion.button>
                ))}
            </div>

            {/* Tab Content */}
{activeTab === "status" ? (
  <div className="mx-auto max-w-xl space-y-6">
    <div className="bg-card/60 p-6 rounded-lg border border-border">
      <h3 className="text-xl font-bold text-foreground">Your Status</h3>
      <div className="flex items-center justify-between mt-4">
        <p
          className={`font-bold text-lg ${
            isAvailable ? "text-green-400" : "text-red-400"
          }`}
        >
          {isAvailable ? "Available for Offers" : "Not Available"}
        </p>
        <button
          onClick={handleToggleAvailability}
          disabled={loading}
          className={`font-bold py-2 px-6 rounded-lg ${
            isAvailable ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
          } text-background transition-colors disabled:bg-muted`}
        >
          {loading ? "Updating..." : isAvailable ? "Go Offline" : "Go Online"}
        </button>
      </div>
    </div>

    <div>
      <h3 className="text-2xl font-bold mb-4 text-foreground">Pending Offers</h3>
      <AgentOffers />
    </div>
  </div>
) : (
  <div>
    <h3 className="text-2xl font-bold mb-4 text-foreground">My Active Jobs</h3>
    <p className="text-muted mb-6">
      These are deliveries you have accepted and are currently assigned to.
    </p>
    <MyOrdersView />
  </div>
)}

        </div>
    );
};
