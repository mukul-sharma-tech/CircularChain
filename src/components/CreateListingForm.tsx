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
  const [description, setDescription] = useState("");
  const [grade, setGrade] = useState("");
  const [origin, setOrigin] = useState("");
  const [purity, setPurity] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signedContract || user.role !== "user") {
      setMessage("Please connect your wallet as a verified industry user.");
      return;
    }
    if (!user.companyName) {
      setMessage("Complete your profile with a company name before creating listings.");
      return;
    }

    setLoading(true);
    setMessage("Processing transaction...");

    try {
      const quantityBigInt = BigInt(quantity);
      const hashPayload = `${description.trim()}|${grade.trim()}|${origin.trim()}|${purity.trim()}`;
      const dataHash = ethers.sha256(ethers.toUtf8Bytes(hashPayload));

      const tx = await signedContract.createListing(
        name,
        user.companyName,
        ethers.parseEther(price),
        quantityBigInt,
        dataHash
      );
      await tx.wait();
      setMessage("Listing created successfully! It will appear in the marketplace shortly.");
      setName("");
      setPrice("");
      setQuantity("");
      setDescription("");
      setGrade("");
      setOrigin("");
      setPurity("");
    } catch (error) {
      console.error("Failed to create listing:", error);
      setMessage("Error: Failed to create listing.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="bg-gray-800/50 backdrop-blur-md p-6 rounded-xl border border-teal-500/30 shadow-lg max-w-2xl mx-auto mb-6"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <h3 className="text-xl font-bold mb-4 text-white">Create a New Listing</h3>
      <p className="text-sm text-gray-400 mb-4">
        We hash your description + specifications to anchor the data integrity on-chain.
      </p>
      <form onSubmit={handleCreateListing} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Material Name (e.g., Scrap Metal)"
          className="p-2 rounded-lg bg-gray-900 text-white border border-gray-700 col-span-1 md:col-span-2"
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
          min="1"
          required
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short Description (what is the material, condition, etc.)"
          className="p-2 rounded-lg bg-gray-900 text-white border border-gray-700 col-span-1 md:col-span-2 min-h-[100px]"
          required
        />
        <input
          type="text"
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          placeholder="Grade"
          className="p-2 rounded-lg bg-gray-900 text-white border border-gray-700"
          required
        />
        <input
          type="text"
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          placeholder="Origin"
          className="p-2 rounded-lg bg-gray-900 text-white border border-gray-700"
          required
        />
        <input
          type="text"
          value={purity}
          onChange={(e) => setPurity(e.target.value)}
          placeholder="Purity"
          className="p-2 rounded-lg bg-gray-900 text-white border border-gray-700"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="col-span-1 md:col-span-2 bg-teal-500 text-white py-3 rounded-lg hover:bg-teal-400 transition-colors"
        >
          {loading ? "Creating..." : "Create Listing"}
        </button>
      </form>
      {message && <p className="mt-3 text-gray-200">{message}</p>}
    </motion.div>
  );
};
