"use client";

import React from 'react';
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
  imageUrls?: string[];
  // Raw values returned from on-chain fields or helper call for debugging
  rawImageValues?: string[];
};

const slugify = (name: string, id: bigint): string =>
  `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${String(id)}`;

export const MarketplaceView = () => {
  const { readOnlyContract, signedContract } = useContract();
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Helper: extract potential IPFS hash from various formats
  const extractIpfsHash = (s?: string | null): string | null => {
    if (!s) return null;
    const str = String(s).trim();
    const m1 = str.match(/ipfs:\/\/(.*)/i);
    if (m1 && m1[1]) return m1[1].replace(/^ipfs:\/\//i, '').replace(/^\/ipfs\//, '').replace(/\?.*$/, '');
    const m2 = str.match(/ipfs\/([^?#]+)/i);
    if (m2 && m2[1]) return m2[1].replace(/\?.*$/, '');
    const m3 = str.match(/(Qm[1-9A-Za-z]{40,})/);
    if (m3 && m3[1]) return m3[1];
    const m4 = str.match(/([A-Za-z0-9_-]{40,})/);
    if (m4 && m4[1]) return m4[1];
    return null;
  };

  // Normalize image url value into an http(s) URL where possible
  const normalizeImage = (v: unknown): string => {
    try {
      const s = String(v || "").trim();
      if (!s) return "";
      if (s.startsWith("ipfs://")) return s.replace(/^ipfs:\/\//i, "https://ipfs.io/ipfs/");
      if (/^Qm[1-9A-Za-z]{40,}$/.test(s) || /^[A-Za-z0-9_-]{40,}$/.test(s)) return `https://ipfs.io/ipfs/${s}`;
      return s;
    } catch (err) {
      console.warn('Failed to normalize image value', v, err);
      return String(v || "");
    }
  };

  useEffect(() => {
    const fetchListings = async (): Promise<void> => {
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
            // listing.imageHashes may be present in the newest contract
            let imageUrlsRaw: string[] = [];
            try {
              if (listing.imageHashes && listing.imageHashes.length) {
                imageUrlsRaw = listing.imageHashes.map(String);
              } else if (typeof readOnlyContract.getListingImages === "function") {
                imageUrlsRaw = (await readOnlyContract.getListingImages(i)).map(String);
              }
            } catch (err) {
              console.debug(`listing ${String(listing.id)} - get images failed:`, err);
              imageUrlsRaw = [];
            }

            let imageUrls: string[] = (imageUrlsRaw || []).map(normalizeImage).filter(Boolean);

            // If no images found, try calling helper with listing.id (some contracts expect explicit id)
            if (imageUrls.length === 0 && typeof readOnlyContract.getListingImages === "function") {
              try {
                const byId = await readOnlyContract.getListingImages(listing.id);
                if (byId && byId.length) {
                  imageUrls = (byId || []).map(normalizeImage).filter(Boolean);
                  imageUrlsRaw = (byId || []).map(String);
                  console.debug(`Listing ${String(listing.id)} - found images via getListingImages(listing.id):`, imageUrls);
                }
              } catch (err) {
                console.debug(`Listing ${String(listing.id)} - getListingImages(listing.id) failed:`, err);
              }
            }

            // If still no images, try to load metadata from dataHash (common pattern: JSON with image field)
            if (imageUrls.length === 0 && listing.dataHash) {
              try {
                const metaUrl = listing.dataHash.startsWith('http') ? listing.dataHash : `https://ipfs.io/ipfs/${listing.dataHash}`;
                console.debug(`Listing ${String(listing.id)} - attempting metadata fetch from`, metaUrl);
                const res = await fetch(metaUrl);
                if (res.ok) {
                  const json = await res.json();
                  // Common fields: image, image_url
                  const candidate = json.image || json.image_url || json.imageUrl || json.assets && json.assets[0] || null;
                  if (candidate) {
                    const normalized = normalizeImage(candidate);
                    if (normalized) {
                      imageUrls = [normalized];
                      imageUrlsRaw = [String(candidate)];
                      console.debug(`Listing ${String(listing.id)} - discovered image via metadata:`, normalized);
                    }
                  } else {
                    console.debug(`Listing ${String(listing.id)} - metadata fetched but no image field`);
                  }
                } else {
                  console.debug(`Listing ${String(listing.id)} - metadata fetch failed status`, res.status);
                }
              } catch (err) {
                console.debug(`Listing ${String(listing.id)} - metadata fetch failed:`, err);
              }
            }

            if (imageUrls.length === 0) console.warn(`Listing ${String(listing.id)} - no normalized images. Raw values:`, imageUrlsRaw);
            else console.debug(`Listing ${String(listing.id)} images:`, imageUrls);

            allListings.push({
              id: listing.id,
              name: listing.name,
              companyName: listing.companyName,
              pricePerUnit: listing.pricePerUnit,
              quantityAvailable: listing.quantityAvailable,
              seller: listing.seller,
              imageUrls,
              rawImageValues: (imageUrlsRaw || []).map(String),
            });

            if (imageUrls.length === 0) {
              console.warn(`Listing ${String(listing.id)} - no normalized images. Raw values:`, imageUrlsRaw);
            }
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

  const handleCreateOrder = async (listingId: bigint, price: bigint): Promise<void> => {
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

      const receipt = await tx.wait();

      // Parse OrderCreated event to get the new order ID and trigger a refresh
      let newOrderId: number | undefined;
      try {
        for (const log of receipt.logs) {
          let contractAddress: string | undefined;

          if (typeof signedContract.target === 'string') {
            contractAddress = signedContract.target;
          } else if (signedContract.address && typeof signedContract.address === 'string') {
            contractAddress = signedContract.address;
          } else {
            // Try to get the address from the contract if available
            const addr = await signedContract.getAddress?.();
            contractAddress = typeof addr === 'string' ? addr : undefined;
          }

          if (contractAddress && log.address && log.address.toLowerCase() === contractAddress.toLowerCase()) {
            try {
              const parsed = signedContract.interface.parseLog({
                topics: [...log.topics],
                data: log.data
              });
              if (parsed && parsed.name === 'OrderCreated') {
                newOrderId = Number(parsed.args?.orderId ?? parsed.args?.id ?? parsed.args?._orderId);
                break;
              }
            } catch {
              // ignore parse errors for unrelated logs
            }
          }
        }
      } catch (err) {
        console.warn('Failed to parse order logs:', err);
      }

      if (typeof newOrderId === 'number') {
        try {
          await fetch('/api/sync/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'order', id: newOrderId })
          });
        } catch (err) {
          console.warn('Order refresh failed:', err);
        }
      }

      alert('Order placed successfully!');
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
      <div className="mb-4 flex items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or company..."
          className="p-2 rounded-lg bg-gray-900 text-white border border-gray-700 flex-1"
        />
      </div>

      {listings.length === 0 ? (
        <p>No listings available right now.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {listings
            .filter((l) =>
              search.trim() === "" ||
              l.name.toLowerCase().includes(search.toLowerCase()) ||
              l.companyName.toLowerCase().includes(search.toLowerCase())
            )
            .map((l) => (
              <motion.div
                key={String(l.id)}
                className="bg-gray-800/50 backdrop-blur-md p-6 rounded-xl border border-teal-500/30 shadow-lg hover:shadow-teal-400/50 transition-shadow"
                whileHover={{ scale: 1.03 }}
              >
                <a href={`/listing/${slugify(l.name, l.id)}`} className="block">
                  <div className="w-full h-36 bg-gray-900 rounded overflow-hidden mb-3 flex items-center justify-center">
                    {l.imageUrls && l.imageUrls.length > 0 ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={l.imageUrls && l.imageUrls[0] ? l.imageUrls[0] : ''}
                        alt={l.name}
                        className="w-full h-full object-cover"
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                          const img = e.currentTarget as HTMLImageElement;
                          img.onerror = null; // avoid loop
                          console.warn('Image failed to load, attempting gateway fallbacks for', img.src);
                          // Try to extract IPFS hash from raw values or from current src
                          const raw = (l.rawImageValues && l.rawImageValues[0]) || '';
                          const hash = extractIpfsHash(raw) || extractIpfsHash(img.src || '');
                          if (hash) {
                            const alt1 = `https://ipfs.io/ipfs/${hash}`;
                            const alt2 = `https://cloudflare-ipfs.com/ipfs/${hash}`;
                            console.log('Retrying image via gateway:', alt1);
                            img.src = alt1;
                            setTimeout(() => {
                              if (!img.complete || img.naturalWidth === 0) {
                                console.log('Gateway 1 failed, trying fallback gateway:', alt2);
                                img.src = alt2;
                              }
                            }, 1200);
                          } else {
                            console.warn('No IPFS hash could be extracted for fallback. Raw:', raw);
                            img.src = '/images/placeholder.png';
                          }
                        }}
                      />
                    ) : (
                      <div className="text-gray-500 text-center px-2">
                        <div>No image</div>
                        {l.rawImageValues && l.rawImageValues.length > 0 && (
                          <div className="mt-2 text-xs text-gray-400">
                            <div className="truncate">Raw: {l.rawImageValues?.[0]}</div>
                            <div className="mt-1">
                              {l.rawImageValues?.[0] && (
                                <>
                                  <a href={l.rawImageValues?.[0].startsWith('http') ? l.rawImageValues?.[0] : `https://ipfs.io/ipfs/${l.rawImageValues?.[0]}`} target="_blank" rel="noreferrer" className="underline text-xs">Open raw image</a>
                                  <button onClick={() => window.open(l.rawImageValues?.[0].startsWith('http') ? l.rawImageValues?.[0] : `https://ipfs.io/ipfs/${l.rawImageValues?.[0]}`)} className="ml-2 text-xs text-gray-300 underline">Open</button>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <h4 className="font-bold text-white text-lg">{l.name}</h4>
                </a>
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