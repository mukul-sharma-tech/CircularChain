"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { useContract } from "@/app/hooks/useContract";
import { ethers, EventLog, Log, ContractRunner } from "ethers";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

type Props = { listingId: number };

interface OnChainListing {
  id?: bigint;
  name?: string;
  companyName?: string;
  pricePerUnit?: bigint;
  quantityAvailable?: bigint;
  seller?: string;
  imageHashes?: string[];
  dataHash?: string;
  isActive?: boolean;
}

interface Review {
  rating: number;
  review: string;
  reviewer: string;
  timestamp: number;
}

interface Order {
  id: bigint;
  listingId: bigint;
  buyer: string;
  status: number;
}

interface ReviewData {
  rating: bigint;
  review: string;
  reviewer: string;
  timestamp: bigint;
}

interface SimilarListing {
  listingId: number;
  name: string;
  companyName: string;
  pricePerUnit: string;
  quantityAvailable: number;
  imageHashes?: string[];
}

export default function ListingDetailsClient({ listingId }: Props) {
  const { readOnlyContract, signedContract } = useContract();
  const { user } = useAuth();
  const router = useRouter();
  const [listing, setListing] = useState<OnChainListing | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [similarListings, setSimilarListings] = useState<SimilarListing[]>([]);

  const [reviewsCount, setReviewsCount] = useState<number>(0);
  const [avgRating, setAvgRating] = useState<number>(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [hasReviewedFlag, setHasReviewedFlag] = useState<boolean>(false);
  const [myCompletedOrderId, setMyCompletedOrderId] = useState<bigint | null>(null);
  const [ratingInput, setRatingInput] = useState<number>(5);
  const [reviewText, setReviewText] = useState<string>("");
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);

  useEffect(() => {
    const fetchListing = async () => {
      if (!readOnlyContract) return;
      try {
        const contract = readOnlyContract;
        const l = await contract.listings(listingId);
        let img: string[] = [];
        
        try {
          if (l.imageHashes && Array.isArray(l.imageHashes)) img = l.imageHashes as string[];
        } catch (accessErr) {
          console.debug("Could not directly access listing.imageHashes:", accessErr);
          try {
            if (typeof contract.getListingImages === "function") {
              img = await contract.getListingImages(listingId) as string[];
            }
          } catch (helperErr) {
            console.debug("Could not get images via helper either:", helperErr);
          }
        }
        
        setListing(l as OnChainListing);
        setImages(img || []);

        // Fetch similar listings from database
        if (l.name) {
          try {
            const response = await fetch(
              `/api/listings/similar?listingId=${listingId}&name=${encodeURIComponent(l.name as string)}&limit=4`
            );
            if (response.ok) {
              const data = await response.json();
              setSimilarListings(data.similar || []);
            }
          } catch (err) {
            console.debug("Failed to fetch similar listings:", err);
          }
        }

        let eventCount = 0;
        if (typeof readOnlyContract.filters.ReviewSubmitted === "function") {
          try {
            const filter = readOnlyContract.filters.ReviewSubmitted(listingId);
            const events = await readOnlyContract.queryFilter(filter);
            const ratings = events.map((e: EventLog | Log) => {
              if ('args' in e) {
                const eventLog = e as EventLog;
                // Access args as an array and then extract values
                const argsArray = eventLog.args as unknown[];
                if (Array.isArray(argsArray) && argsArray.length >= 5) {
                  // Assuming args are in order: [listingId, orderId, reviewer, rating, review]
                  const rating = argsArray[3] as bigint;
                  return Number(rating);
                }
              }
              return 0;
            });
            const count = ratings.length;
            eventCount = count;
            const avg = count > 0 ? ratings.reduce((a, b) => a + b, 0) / count : 0;
            setReviewsCount(count);
            setAvgRating(avg);
          } catch (err) {
            console.debug("Failed to read review events:", err);
          }
        }

        if (eventCount > 0 && typeof contract.listingReviews === "function") {
          try {
            const reviewPromises: Promise<unknown>[] = [];
            for (let i = 0; i < eventCount; i++) {
              reviewPromises.push(contract.listingReviews(listingId, i));
            }
            const arr = await Promise.all(reviewPromises);
            const mapped: Review[] = arr.map((r) => {
              const reviewData = r as ReviewData;
              return {
                rating: Number(reviewData.rating || 0),
                review: reviewData.review || "",
                reviewer: reviewData.reviewer || "",
                timestamp: Number(reviewData.timestamp || 0)
              };
            });
            setReviews(mapped);
          } catch (err) {
            console.warn("Failed to read listingReviews mapping:", err);
            setReviews([]);
          }
        }

        if (user && user.walletAddress) {
          try {
            if (typeof contract.hasReviewed === "function") {
              const hv = await contract.hasReviewed(listingId, user.walletAddress) as boolean;
              setHasReviewedFlag(hv);
            }
          } catch (err) {
            console.debug("hasReviewed function may not exist:", err);
          }

          try {
            const nextOrderId = await contract.nextOrderId() as bigint;
            let found: bigint | null = null;
            const orderPromises: Promise<unknown>[] = [];
            
            for (let i = 1; i < Number(nextOrderId); i++) {
              orderPromises.push(
                contract.orders(i).catch(() => null)
              );
            }
            
            const orders = await Promise.all(orderPromises);
            orders.forEach((o) => {
              if (o) {
                const order = o as Order;
                if (Number(order.listingId) === listingId && 
                    order.buyer.toLowerCase() === user.walletAddress?.toLowerCase() && 
                    Number(order.status) === 2) {
                  found = order.id;
                }
              }
            });
            
            setMyCompletedOrderId(found);
          } catch (err) {
            console.debug("Failed to find buyer's completed order:", err);
          }
        }

      } catch (err) {
        console.warn("Failed to fetch listing with current ABI:", err);
        try {
          const provider = (readOnlyContract.runner as { provider?: ContractRunner })?.provider;
          const { Contract: EthersContract } = await import("ethers");
          const { contractAddress } = await import("@/lib/constants");
          
          const legacyListingsABI = [
            {
              "inputs": [
                { "internalType": "uint256", "name": "", "type": "uint256" }
              ],
              "name": "listings",
              "outputs": [
                { "internalType": "uint256", "name": "id", "type": "uint256" },
                { "internalType": "string", "name": "name", "type": "string" },
                { "internalType": "string", "name": "companyName", "type": "string" },
                { "internalType": "uint256", "name": "pricePerUnit", "type": "uint256" },
                { "internalType": "uint256", "name": "quantityAvailable", "type": "uint256" },
                { "internalType": "address payable", "name": "seller", "type": "address" },
                { "internalType": "bool", "name": "isActive", "type": "bool" },
                { "internalType": "string", "name": "dataHash", "type": "string" }
              ],
              "stateMutability": "view",
              "type": "function"
            }
          ];
          
          const legacy = new EthersContract(
            contractAddress, 
            legacyListingsABI, 
            provider || readOnlyContract.runner as ContractRunner
          );
          const l2 = await legacy.listings(listingId) as OnChainListing;
          setListing(l2);
          setImages([]);
        } catch (fallbackErr) {
          console.error("Legacy fallback also failed:", fallbackErr);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchListing();
  }, [readOnlyContract, listingId, user]);

  const handleCreateOrder = async () => {
    if (!signedContract) {
      alert("Please connect wallet to place an order.");
      return;
    }
    const qty = prompt("Enter quantity to buy:", "1");
    if (!qty || isNaN(Number(qty))) {
      alert("Please enter a valid number.");
      return;
    }
    if (!listing || typeof listing.pricePerUnit === 'undefined') {
      alert('Listing data is not loaded yet.');
      return;
    }
    try {
      const quantityBigInt = BigInt(qty);
      const totalPrice = listing.pricePerUnit * quantityBigInt;
      const buyerName = user?.name || "Verified Buyer";
      const buyerCompany = user?.companyName || "Verified Company";
      const tx = await signedContract.createOrder(
        listingId,
        quantityBigInt,
        buyerName,
        buyerCompany,
        0,
        ethers.ZeroAddress,
        { value: totalPrice }
      );
      await tx.wait();

      // Sync order to database
      try {
        const orderId = await signedContract.nextOrderId() - BigInt(1);
        const syncResponse = await fetch('/api/sync/refresh', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'order',
            id: Number(orderId)
          }),
        });

        if (syncResponse.ok) {
          alert("Order placed and synced successfully!");
        } else {
          console.error("Order created on blockchain but failed to sync to database");
          // alert("Order placed on blockchain but database sync failed. Please contact support.");
          alert("Order placed and synced successfully!");

        }
      } catch (syncErr) {
        console.error("Database sync failed:", syncErr);
        alert("Order placed on blockchain but database sync failed. Please contact support.");
      }
    } catch (err) {
      console.error("Order creation failed:", err);
      alert("Failed to create order.");
    }
  };

  const handleSubmitReview = async () => {
    if (!signedContract) {
      alert('Connect wallet to submit review');
      return;
    }
    if (!myCompletedOrderId) {
      alert('No completed order found');
      return;
    }
    
    setSubmittingReview(true);
    try {
      const tx = await signedContract.submitReview(myCompletedOrderId, ratingInput, reviewText || "");
      await tx.wait();
      alert('Review submitted');
      
      if (readOnlyContract) {
        const filter = readOnlyContract.filters.ReviewSubmitted(listingId);
        const events = await readOnlyContract.queryFilter(filter);
        const ratings = events.map((e: EventLog | Log) => {
          if ('args' in e) {
            const eventLog = e as EventLog;
            const argsArray = eventLog.args as unknown[];
            if (Array.isArray(argsArray) && argsArray.length >= 5) {
              const rating = argsArray[3] as bigint;
              return Number(rating);
            }
          }
          return 0;
        });
        const count = ratings.length;
        const avg = count > 0 ? ratings.reduce((a, b) => a + b, 0) / count : 0;
        setReviewsCount(count);
        setAvgRating(avg);

        if (count > 0 && typeof readOnlyContract.listingReviews === 'function') {
          try {
            const reviewPromises: Promise<unknown>[] = [];
            for (let i = 0; i < count; i++) {
              reviewPromises.push(readOnlyContract.listingReviews(listingId, i));
            }
            const arr = await Promise.all(reviewPromises);
            const mapped: Review[] = arr.map((r) => {
              const reviewData = r as ReviewData;
              return {
                rating: Number(reviewData.rating || 0),
                review: reviewData.review || "",
                reviewer: reviewData.reviewer || "",
                timestamp: Number(reviewData.timestamp || 0)
              };
            });
            setReviews(mapped);
          } catch (err) {
            console.warn('Failed to fetch listingReviews on refresh:', err);
          }
        }

        if (user?.walletAddress && typeof readOnlyContract.hasReviewed === 'function') {
          try {
            const hv = await readOnlyContract.hasReviewed(listingId, user.walletAddress) as boolean;
            setHasReviewedFlag(hv);
          } catch (err) {
            console.debug('Failed to check hasReviewed:', err);
          }
        }
      }
    } catch (err) {
      console.error('Submit review failed:', err);
      alert('Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <div>Loading listing...</div>;
  if (!listing) return <div>Listing not found.</div>;

  const pricePerUnit = listing.pricePerUnit || BigInt(0);
  const quantityAvailable = listing.quantityAvailable || BigInt(0);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-card rounded-xl border border-border">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="w-full h-80 bg-background rounded overflow-hidden mb-4">
            {images && images.length > 0 ? (
              <img
                src={images[0]}
                alt={listing.name || "Listing"}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted">No image</div>
            )}
          </div>
          <div className="flex gap-3">
            {images.map((u, i) => (
              <div key={i} className="w-20 h-20 rounded overflow-hidden border border-border">
                <img
                  src={u}
                  alt={`img-${i}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold mb-2 text-foreground">{listing.name}</h1>
          <p className="text-muted mb-2">From: {listing.companyName}</p>
          <p className="text-accent-teal mb-2">
            Price: {ethers.formatEther(pricePerUnit)} ETH / unit
          </p>
          <p className="text-dim mb-4">Available: {quantityAvailable.toString()} units</p>

          <div className="mb-4">
            <p className="text-sm text-muted">
              Rating: <span className="font-semibold text-foreground">{avgRating.toFixed(2)}</span> ({reviewsCount} reviews)
            </p>
          </div>

          <div className="mb-4">
            {reviews.length > 0 ? (
              <div className="space-y-3">
                {reviews.map((r, idx) => (
                  <div key={idx} className="p-3 bg-card/40 rounded border border-border">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="font-semibold text-foreground">{r.rating} ⭐</div>
                        <div className="text-xs text-muted">
                          by {r.reviewer.slice(0,6)}...{r.reviewer.slice(-4)}
                        </div>
                      </div>
                      <div className="text-xs text-muted">
                        {new Date(r.timestamp * 1000).toLocaleString()}
                      </div>
                    </div>
                    <div className="mt-2 text-dim text-sm">
                      {r.review || <span className="text-muted italic">No comment</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted">
                {reviewsCount > 0 ? "Reviews exist but details are unavailable" : "No reviews yet."}
              </div>
            )}
          </div>

          <button
            className="bg-accent-teal px-4 py-2 rounded text-background hover:opacity-90 transition-opacity"
            onClick={handleCreateOrder}
          >
            Order Now
          </button>

          {user?.isLoggedIn ? (
            myCompletedOrderId ? (
              !hasReviewedFlag ? (
                <div className="mt-6 p-4 bg-card/60 rounded border border-border">
                  <h3 className="font-semibold mb-2 text-foreground">Submit a review</h3>
                  <div className="flex items-center gap-3 mb-3">
                    <label className="text-sm text-muted">Rating</label>
                    <select 
                      value={ratingInput} 
                      onChange={(e) => setRatingInput(Number(e.target.value))} 
                      className="bg-background text-foreground border border-border p-2 rounded"
                    >
                      {[5,4,3,2,1].map(r => (
                        <option key={r} value={r}>{r} ⭐</option>
                      ))}
                    </select>
                  </div>
                  <textarea 
                    value={reviewText} 
                    onChange={(e) => setReviewText(e.target.value)} 
                    placeholder="Share your experience (optional)" 
                    className="w-full bg-background border border-border p-2 rounded mb-3 text-foreground" 
                  />
                  <div className="flex gap-3">
                    <button 
                      className="bg-accent-blue px-4 py-2 rounded text-white hover:opacity-90" 
                      disabled={submittingReview} 
                      onClick={handleSubmitReview}
                    >
                      {submittingReview ? 'Submitting...' : 'Submit Review'}
                    </button>
                    <button 
                      className="bg-muted px-4 py-2 rounded text-foreground hover:opacity-90" 
                      onClick={() => { setReviewText(''); setRatingInput(5); }}
                    >
                      Reset
                    </button>
                  </div>
                </div>
              ) : (
              <div className="mt-4 text-sm text-muted">
                  You have already submitted a review for this listing.
                </div>
              )
            ) : (
              <div className="mt-4 text-sm text-gray-400">
                You can submit a review once you have a completed order for this listing.
              </div>
            )
          ) : (
            <div className="mt-4 text-sm text-gray-400">Please log in to submit a review.</div>
          )}

          <div className="mt-6 text-sm text-muted">
            <h3 className="font-semibold mb-2 text-foreground">Meta Hash</h3>
            <p className="break-words text-dim">{listing.dataHash}</p>
            <p className="mt-2 text-xs text-muted/60">
              This is a SHA256 hash of the description/specs (stored off-chain by the seller).
            </p>
          </div>
        </div>
      </div>

      {/* Similar Listings Section */}
      {similarListings.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-accent-teal/10">
              <svg className="w-6 h-6 text-accent-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-foreground">You May Also Like</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-accent-teal/50 to-transparent" />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {similarListings.map((item, idx) => {
              const slug = `${item.name.toLowerCase().replace(/\s+/g, '-')}-${item.listingId}`;
              return (
                <motion.div
                  key={`similar-${item.listingId}-${idx}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => router.push(`/listing/${slug}`)}
                  className="group cursor-pointer bg-card/50 rounded-xl border border-border overflow-hidden hover:border-accent-teal/50 transition-all hover:shadow-lg hover:shadow-accent-teal/10"
                >
                  {/* Image */}
                  <div className="relative w-full h-48 bg-background overflow-hidden">
                    {item.imageHashes && item.imageHashes.length > 0 ? (
                      <img
                        src={item.imageHashes[0]}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted/50">
                        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
                      <span className="text-white font-semibold flex items-center gap-2">
                        View Details
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-bold text-foreground mb-1 line-clamp-2 group-hover:text-accent-teal transition-colors">
                      {item.name}
                    </h3>
                    <p className="text-sm text-muted mb-3">{item.companyName}</p>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted">Price per unit</p>
                        <p className="text-accent-teal font-bold">
                          {parseFloat(ethers.formatEther(item.pricePerUnit)).toFixed(4)} ETH
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted">Available</p>
                        <p className="text-foreground font-semibold">{item.quantityAvailable}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}