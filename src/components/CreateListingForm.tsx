// "use client";

// import { useState } from "react";
// import { useContract } from "@/app/hooks/useContract";
// import { ethers } from "ethers";
// import { useAuth } from "../../context/AuthContext";
// export const CreateListingForm = () => {
//     const { signedContract } = useContract();
//     const { user } = useAuth();
//     const [name, setName] = useState('');
//     const [price, setPrice] = useState('');
//     const [quantity, setQuantity] = useState('');
//     const [message, setMessage] = useState('');
//     const [loading, setLoading] = useState(false);

//     const handleCreateListing = async (e: React.FormEvent) => {
//         e.preventDefault();
//         if (!signedContract || !user.role) {
//             setMessage("Please connect your wallet first.");
//             return;
//         }

//         setLoading(true);
//         setMessage("Processing transaction...");

//         try {
//             const tx = await signedContract.createListing(
//                 name,
//                 user.role, // Assuming company name is stored in user.role for now
//                 ethers.parseEther(price),
//                 quantity
//             );
//             await tx.wait(); // Wait for the transaction to be mined
//             setMessage("Listing created successfully! It will appear in the marketplace shortly.");
//             // Reset form
//             setName('');
//             setPrice('');
//             setQuantity('');
//         } catch (error) {
//             console.error("Failed to create listing:", error);
//             setMessage("Error: Failed to create listing.");
//         } finally {
//             setLoading(false);
//         }
//     };

//     return (
//         <div style={{ padding: '2rem', border: '1px solid #333', borderRadius: '8px', marginTop: '2rem' }}>
//             <h3>Create a New Listing</h3>
//             <form onSubmit={handleCreateListing} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
//                 <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Material Name (e.g., Scrap Metal)" required />
//                 <input type="text" value={price} onChange={e => setPrice(e.target.value)} placeholder="Price per Unit (in ETH)" required />
//                 <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="Total Quantity" required />
//                 <button type="submit" disabled={loading}>
//                     {loading ? 'Creating...' : 'Create Listing'}
//                 </button>
//             </form>
//             {message && <p>{message}</p>}
//         </div>
//     );
// };

"use client";

import { useState } from "react";
import { useContract } from "@/app/hooks/useContract";
import { ethers } from "ethers";
import { useAuth } from "../../context/AuthContext";
import { motion } from "framer-motion";

export const CreateListingForm = () => {
  const { signedContract } = useContract();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signedContract || !user.role) {
      setMessage("Please connect your wallet first.");
      return;
    }

    setLoading(true);
    setMessage("Processing transaction...");

    try {
      const tx = await signedContract.createListing(
        name,
        user.role,
        ethers.parseEther(price),
        quantity
      );
      await tx.wait();
      setMessage("Listing created successfully! It will appear in the marketplace shortly.");
      setName("");
      setPrice("");
      setQuantity("");
    } catch (error) {
      console.error("Failed to create listing:", error);
      setMessage("Error: Failed to create listing.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="bg-gray-800/50 backdrop-blur-md p-6 rounded-xl border border-teal-500/30 shadow-lg max-w-md mx-auto mt-6"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <h3 className="text-xl font-bold mb-4 text-white">Create a New Listing</h3>
      <form onSubmit={handleCreateListing} className="flex flex-col gap-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Material Name (e.g., Scrap Metal)"
          className="p-2 rounded-lg bg-gray-900 text-white border border-gray-700"
          required
        />
        <input
          type="text"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Price per Unit (in ETH)"
          className="p-2 rounded-lg bg-gray-900 text-white border border-gray-700"
          required
        />
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="Total Quantity"
          className="p-2 rounded-lg bg-gray-900 text-white border border-gray-700"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-teal-500 text-white py-2 rounded-lg hover:bg-teal-400 transition-colors"
        >
          {loading ? "Creating..." : "Create Listing"}
        </button>
      </form>
      {message && <p className="mt-3 text-gray-200">{message}</p>}
    </motion.div>
  );
};
