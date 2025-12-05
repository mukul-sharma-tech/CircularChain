// "use client";

// import { useEffect, useState } from "react";
// import { useContract } from "@/app/hooks/useContract";
// import { ethers } from "ethers";

// // Define a type for our listing structure
// type Listing = {
//     id: bigint;
//     name: string;
//     companyName: string;
//     pricePerUnit: bigint;
//     quantityAvailable: bigint;
//     seller: string;
// };

// export const MarketplaceView = () => {
//     const { readOnlyContract, signedContract } = useContract();
//     const [listings, setListings] = useState<Listing[]>([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState('');

//     useEffect(() => {
//         const fetchListings = async () => {
//             if (!readOnlyContract) return;
//             try {
//                 const nextId = await readOnlyContract.nextListingId();
//                 const allListings: Listing[] = [];

//                 for (let i = 1; i < Number(nextId); i++) {
//                     const listing = await readOnlyContract.listings(i);
//                     if (listing.isActive && listing.quantityAvailable > 0) {
//                         allListings.push({
//                             id: listing.id,
//                             name: listing.name,
//                             companyName: listing.companyName,
//                             pricePerUnit: listing.pricePerUnit,
//                             quantityAvailable: listing.quantityAvailable,
//                             seller: listing.seller,
//                         });
//                     }
//                 }
//                 setListings(allListings.reverse()); // Show newest first
//             } catch (err) {
//                 console.error("Could not fetch listings:", err);
//                 setError("Failed to load marketplace data.");
//             } finally {
//                 setLoading(false);
//             }
//         };

//         fetchListings();
//     }, [readOnlyContract]);

//     const handleCreateOrder = async (listingId: bigint, price: bigint) => {
//         if (!signedContract) {
//             alert("Please connect wallet to place an order.");
//             return;
//         }
//         const quantity = prompt("Enter quantity to buy:", "1");
//         if (!quantity || isNaN(Number(quantity))) {
//             alert("Please enter a valid number.");
//             return;
//         }

//         try {
//             const totalPrice = price * BigInt(quantity);
//             const tx = await signedContract.createOrder(
//                 listingId,
//                 quantity,
//                 "Buyer Name", // Replace with actual buyer name from profile
//                 "Buyer Company", // Replace with actual buyer company
//                 { value: totalPrice }
//             );
//             await tx.wait();
//             alert("Order placed successfully!");
//             // Optionally, refresh listings here
//         } catch (err) {
//             console.error("Order creation failed:", err);
//             alert("Failed to create order.");
//         }
//     };

//     if (loading) return <p>Loading marketplace...</p>;
//     if (error) return <p style={{ color: 'red' }}>{error}</p>;

//     return (
//         <div>
//             <h3>Available Materials</h3>
//             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
//                 {listings.length === 0 ? <p>No listings available right now.</p> :
//                     listings.map(l => (
//                         <div key={String(l.id)} style={{ border: '1px solid #333', padding: '1rem', borderRadius: '8px' }}>
//                             <h4>{l.name}</h4>
//                             <p>From: {l.companyName}</p>
//                             <p><b>Price:</b> {ethers.formatEther(l.pricePerUnit)} ETH / unit</p>
//                             <p><b>Available:</b> {String(l.quantityAvailable)} units</p>
//                             <p><small>Seller: {l.seller.slice(0, 6)}...</small></p>
//                             <button onClick={() => handleCreateOrder(l.id, l.pricePerUnit)}>
//                                 Order Now
//                             </button>
//                         </div>
//                     ))
//                 }
//             </div>
//         </div>
//     );
// };

"use client";

import { useEffect, useState } from "react";
import { useContract } from "@/app/hooks/useContract";
import { ethers } from "ethers";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";

type Listing = {
  id: bigint;
  name: string;
  companyName: string;
  pricePerUnit: bigint;
  quantityAvailable: bigint;
  seller: string;
};

export const MarketplaceView = () => {
  const { readOnlyContract, signedContract } = useContract();
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchListings = async () => {
      if (!readOnlyContract) return;
      try {
        let nextId: bigint;
        try {
          nextId = await readOnlyContract.nextListingId();
        } catch (error) {
          console.warn("Failed to fetch nextListingId, defaulting to 0:", error);
          setError("Unable to connect to contract. Please check your network connection.");
          setListings([]);
          setLoading(false);
          return;
        }
        const allListings: Listing[] = [];

        for (let i = 1; i < Number(nextId); i++) {
          const listing = await readOnlyContract.listings(i);
          if (listing.isActive && listing.quantityAvailable > 0) {
            allListings.push({
              id: listing.id,
              name: listing.name,
              companyName: listing.companyName,
              pricePerUnit: listing.pricePerUnit,
              quantityAvailable: listing.quantityAvailable,
              seller: listing.seller,
            });
          }
        }
        setListings(allListings.reverse());
      } catch (err) {
        console.error("Could not fetch listings:", err);
        setError("Failed to load marketplace data.");
      } finally {
        setLoading(false);
      }
    };

    fetchListings();
  }, [readOnlyContract]);

  const handleCreateOrder = async (listingId: bigint, price: bigint) => {
    if (!signedContract) {
      alert("Please connect wallet to place an order.");
      return;
    }
    const quantity = prompt("Enter quantity to buy:", "1");
    if (!quantity || isNaN(Number(quantity))) {
      alert("Please enter a valid number.");
      return;
    }

    try {
      const quantityBigInt = BigInt(quantity);
      const totalPrice = price * quantityBigInt;
      const buyerName = user.name || "Verified Buyer";
      const buyerCompany = user.companyName || "Verified Company";
      const tx = await signedContract.createOrder(
        listingId,
        quantityBigInt,
        buyerName,
        buyerCompany,
        0, // PaymentMethod.ETH
        ethers.ZeroAddress,
        { value: totalPrice }
      );
      await tx.wait();
      alert("Order placed successfully!");
    } catch (err) {
      console.error("Order creation failed:", err);
      alert("Failed to create order.");
    }
  };

  if (loading) return <p className="text-center mt-4">Loading marketplace...</p>;
  if (error) return <p className="text-red-500 text-center mt-4">{error}</p>;

  return (
    <div>
      <h3 className="text-xl md:text-2xl font-bold mb-4">Available Materials</h3>
      {listings.length === 0 ? (
        <p>No listings available right now.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {listings.map((l) => (
            <motion.div
              key={String(l.id)}
              className="bg-gray-800/50 backdrop-blur-md p-6 rounded-xl border border-teal-500/30 shadow-lg hover:shadow-teal-400/50 transition-shadow"
              whileHover={{ scale: 1.03 }}
            >
              <h4 className="font-bold text-white text-lg">{l.name}</h4>
              <p className="text-gray-400 mt-1">From: {l.companyName}</p>
              <p className="text-teal-400 mt-1">
                Price: {ethers.formatEther(l.pricePerUnit)} ETH / unit
              </p>
              <p className="text-gray-300 mt-1">Available: {String(l.quantityAvailable)} units</p>
              <p className="text-gray-500 text-xs mt-1">Seller: {l.seller.slice(0, 6)}...</p>
              <button
                className="mt-4 w-full bg-teal-500 text-white py-2 rounded-lg hover:bg-teal-400 transition-colors"
                onClick={() => handleCreateOrder(l.id, l.pricePerUnit)}
              >
                Order Now
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
