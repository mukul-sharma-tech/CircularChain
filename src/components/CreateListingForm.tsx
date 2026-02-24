// "use client";

// import { useState } from "react";
// import { useContract } from "@/app/hooks/useContract";
// import { ethers } from "ethers";
// import { useAuth } from "../../context/AuthContext";
// import { motion } from "framer-motion";

// export const CreateListingForm = () => {
//   const { signedContract } = useContract();
//   const { user } = useAuth();
//   const [name, setName] = useState("");
//   const [price, setPrice] = useState("");
//   const [quantity, setQuantity] = useState("");
//   const [description, setDescription] = useState("");
//   const [grade, setGrade] = useState("");
//   const [origin, setOrigin] = useState("");
//   const [purity, setPurity] = useState("");
//   const [message, setMessage] = useState("");
//   const [loading, setLoading] = useState(false);

//   // Images
//   const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
//   const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
//   const [uploadingImages, setUploadingImages] = useState(false);

//   const uploadFile = async (file: File) => {
//     const form = new FormData();
//     form.append("file", file);
//     try {
//       const res = await fetch("/api/upload", { method: "POST", body: form });
//       const json = await res.json();
//       if (!res.ok) throw new Error(json.error || "Upload failed");
//       return json.url as string;
//     } catch (err) {
//       console.error("Upload error:", err);
//       throw err;
//     }
//   };

//   const handleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const files = e.target.files;
//     if (!files || files.length === 0) return;
//     const arr = Array.from(files);
//     setSelectedFiles(arr);

//     setUploadingImages(true);
//     try {
//       const urls: string[] = [];
//       for (const f of arr) {
//         const url = await uploadFile(f);
//         urls.push(url);
//       }
//       setUploadedImageUrls(urls);
//     } catch (err) {
//       setMessage("Image upload failed. Try again.");
//     } finally {
//       setUploadingImages(false);
//     }
//   };

//   const handleCreateListing = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!signedContract || user.role !== "user") {
//       setMessage("Please connect your wallet as a verified industry user.");
//       return;
//     }
//     if (!user.companyName) {
//       setMessage("Complete your profile with a company name before creating listings.");
//       return;
//     }

//     setLoading(true);
//     setMessage("Processing transaction...");

//     try {
//       const quantityBigInt = BigInt(quantity);
//       const hashPayload = `${description.trim()}|${grade.trim()}|${origin.trim()}|${purity.trim()}`;
//       const dataHash = ethers.sha256(ethers.toUtf8Bytes(hashPayload));

//       // Ensure images have been uploaded (or none selected)
//       if (selectedFiles.length > 0 && uploadedImageUrls.length === 0) {
//         setMessage("Please wait for image uploads to finish.");
//         setLoading(false);
//         return;
//       }

//       const imageHashes = uploadedImageUrls; // These are ImageKit URLs

//       const tx = await signedContract.createListing(
//         name,
//         user.companyName,
//         ethers.parseEther(price),
//         quantityBigInt,
//         dataHash,
//         imageHashes
//       );
//       const receipt = await tx.wait();

//       // Try to parse the ListingCreated event from the receipt logs to get the new listing ID
//       let listingId: number | undefined;
//       try {
//         for (const log of receipt.logs) {
//           if (log.address && log.address.toLowerCase() === (signedContract.address || signedContract.target).toLowerCase()) {
//             try {
//               const parsed = signedContract.interface.parseLog(log);
//               if (parsed.name === 'ListingCreated') {
//                 listingId = Number(parsed.args?.id ?? parsed.args?.listingId ?? parsed.args?._id);
//                 break;
//               }
//             } catch (err) {
//               // ignore parse errors for unrelated logs
//             }
//           }
//         }
//       } catch (err) {
//         console.warn('Could not parse receipt logs for listing ID:', err);
//       }

//       // Fire-and-forget a refresh call so the listing is written to MongoDB immediately
//       if (typeof listingId === 'number') {
//         try {
//           await fetch('/api/sync/refresh', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ type: 'listing', id: listingId })
//           });
//         } catch (err) {
//           console.warn('Refresh sync failed:', err);
//         }
//       }

//       setMessage('Listing created successfully! It will appear in the marketplace shortly.');
//       setName('');
//       setPrice('');
//       setQuantity('');
//       setDescription('');
//       setGrade('');
//       setOrigin('');
//       setPurity('');
//       setSelectedFiles([]);
//       setUploadedImageUrls([]);
//     } catch (error) {
//       console.error('Failed to create listing:', error);
//       setMessage('Error: Failed to create listing.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <motion.div
//       className="bg-gray-800/50 backdrop-blur-md p-6 rounded-xl border border-teal-500/30 shadow-lg max-w-2xl mx-auto mb-6"
//       initial={{ opacity: 0, y: -20 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.8 }}
//     >
//       {/* <h3 className="text-xl font-bold mb-4 text-white">Create a New Listing</h3>
//       <p className="text-sm text-gray-400 mb-4">
//         We hash your description + specifications to anchor the data integrity on-chain.
//       </p> */}
//       <form onSubmit={handleCreateListing} className="grid grid-cols-1 md:grid-cols-2 gap-4">
//         <input
//           type="text"
//           value={name}
//           onChange={(e) => setName(e.target.value)}
//           placeholder="Material Name (e.g., Scrap Metal)"
//           className="p-2 rounded-lg bg-gray-900 text-white border border-gray-700 col-span-1 md:col-span-2"
//           required
//         />
//         <input
//           type="text"
//           value={price}
//           onChange={(e) => setPrice(e.target.value)}
//           placeholder="Price per Unit (in ETH)"
//           className="p-2 rounded-lg bg-background text-foreground border border-border"
//           required
//         />
//         <input
//           type="number"
//           value={quantity}
//           onChange={(e) => setQuantity(e.target.value)}
//           placeholder="Total Quantity"
//           className="p-2 rounded-lg bg-background text-foreground border border-border"
//           min="1"
//           required
//         />
//         <textarea
//           value={description}
//           onChange={(e) => setDescription(e.target.value)}
//           placeholder="Short Description (what is the material, condition, etc.)"
//           className="p-2 rounded-lg bg-gray-900 text-white border border-gray-700 col-span-1 md:col-span-2 min-h-[100px]"
//           required
//         />
//         <input
//           type="text"
//           value={grade}
//           onChange={(e) => setGrade(e.target.value)}
//           placeholder="Grade"
//           className="p-2 rounded-lg bg-background text-foreground border border-border"
//           required
//         />
//         <input
//           type="text"
//           value={origin}
//           onChange={(e) => setOrigin(e.target.value)}
//           placeholder="Origin"
//           className="p-2 rounded-lg bg-background text-foreground border border-border"
//           required
//         />
//         <input
//           type="text"
//           value={purity}
//           onChange={(e) => setPurity(e.target.value)}
//           placeholder="Purity"
//           className="p-2 rounded-lg bg-background text-foreground border border-border"
//           required
//         />

//         {/* Image Uploads */}
//         <div className="col-span-1 md:col-span-2">
//           <label className="block text-sm text-gray-300 mb-2">Upload Images</label>
//           <input
//             type="file"
//             accept="image/*"
//             multiple
//             onChange={handleFilesChange}
//             className="w-full text-sm text-gray-200"
//           />
//           <div className="mt-3 flex gap-3 flex-wrap">
//             {selectedFiles.map((f, idx) => (
//               <div key={idx} className="w-20 h-20 bg-gray-900 rounded overflow-hidden flex items-center justify-center border border-gray-700">
//                 <img src={URL.createObjectURL(f)} alt={f.name} className="w-full h-full object-cover" />
//               </div>
//             ))}
//             {uploadingImages && <p className="text-sm text-gray-400">Uploading images...</p>}
//           </div>
//         </div>

//         <button
//           type="submit"
//           disabled={loading}
//           className="col-span-1 md:col-span-2 bg-teal-500 text-white py-3 rounded-lg hover:bg-teal-400 transition-colors"
//         >
//           {loading ? "Creating..." : "Create Listing"}
//         </button>
//       </form>
//       {message && <p className="mt-3 text-gray-200">{message}</p>}
//     </motion.div>
//   );
// };

// "use client";

// import { useState } from "react";
// import { useContract } from "@/app/hooks/useContract";
// import { ethers } from "ethers";
// import { useAuth } from "../../context/AuthContext";
// import { motion } from "framer-motion";
// import Image from "next/image";

// interface UploadResponse {
//   url: string;
//   error?: string;
// }

// export const CreateListingForm = () => {
//   const { signedContract } = useContract();
//   const { user } = useAuth();
//   const [name, setName] = useState<string>("");
//   const [price, setPrice] = useState<string>("");
//   const [quantity, setQuantity] = useState<string>("");
//   const [description, setDescription] = useState<string>("");
//   const [grade, setGrade] = useState<string>("");
//   const [origin, setOrigin] = useState<string>("");
//   const [purity, setPurity] = useState<string>("");
//   const [message, setMessage] = useState<string>("");
//   const [loading, setLoading] = useState<boolean>(false);

//   // Images
//   const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
//   const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
//   const [uploadingImages, setUploadingImages] = useState<boolean>(false);

//   const uploadFile = async (file: File): Promise<string> => {
//     const form = new FormData();
//     form.append("file", file);
//     try {
//       const res = await fetch("/api/upload", { method: "POST", body: form });
//       const json: UploadResponse = await res.json();
//       if (!res.ok) throw new Error(json.error || "Upload failed");
//       return json.url;
//     } catch (err) {
//       console.error("Upload error:", err);
//       throw err;
//     }
//   };

//   const handleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
//     const files = e.target.files;
//     if (!files || files.length === 0) return;
//     const arr = Array.from(files);
//     setSelectedFiles(arr);

//     setUploadingImages(true);
//     try {
//       const urls: string[] = [];
//       for (const f of arr) {
//         const url = await uploadFile(f);
//         urls.push(url);
//       }
//       setUploadedImageUrls(urls);
//     } catch {
//       setMessage("Image upload failed. Try again.");
//     } finally {
//       setUploadingImages(false);
//     }
//   };

//   const handleCreateListing = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
//     e.preventDefault();
//     if (!signedContract || user.role !== "user") {
//       setMessage("Please connect your wallet as a verified industry user.");
//       return;
//     }
//     if (!user.companyName) {
//       setMessage("Complete your profile with a company name before creating listings.");
//       return;
//     }

//     setLoading(true);
//     setMessage("Processing transaction...");

//     try {
//       const quantityBigInt = BigInt(quantity);
//       const hashPayload = `${description.trim()}|${grade.trim()}|${origin.trim()}|${purity.trim()}`;
//       const dataHash = ethers.sha256(ethers.toUtf8Bytes(hashPayload));

//       // Ensure images have been uploaded (or none selected)
//       if (selectedFiles.length > 0 && uploadedImageUrls.length === 0) {
//         setMessage("Please wait for image uploads to finish.");
//         setLoading(false);
//         return;
//       }

//       const imageHashes = uploadedImageUrls; // These are ImageKit URLs

//       const tx = await signedContract.createListing(
//         name,
//         user.companyName,
//         ethers.parseEther(price),
//         quantityBigInt,
//         dataHash,
//         imageHashes
//       );
//       const receipt = await tx.wait();

//       // Try to parse the ListingCreated event from the receipt logs to get the new listing ID
//       let listingId: number | undefined;
//       try {
//         for (const log of receipt.logs) {
//           const contractAddress = typeof signedContract.target === 'string' 
//             ? signedContract.target 
//             : (signedContract.address as string | undefined);
          
//           if (contractAddress && log.address && log.address.toLowerCase() === contractAddress.toLowerCase()) {
//             try {
//               const parsed = signedContract.interface.parseLog({
//                 topics: [...log.topics],
//                 data: log.data
//               });
//               if (parsed && parsed.name === 'ListingCreated') {
//                 listingId = Number(parsed.args?.id ?? parsed.args?.listingId ?? parsed.args?._id);
//                 break;
//               }
//             } catch {
//               // ignore parse errors for unrelated logs
//             }
//           }
//         }
//       } catch (err) {
//         console.warn('Could not parse receipt logs for listing ID:', err);
//       }

//       // Fire-and-forget a refresh call so the listing is written to MongoDB immediately
//       if (typeof listingId === 'number') {
//         try {
//           await fetch('/api/sync/refresh', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ type: 'listing', id: listingId })
//           });
//         } catch (err) {
//           console.warn('Refresh sync failed:', err);
//         }
//       }

//       setMessage('Listing created successfully! It will appear in the marketplace shortly.');
//       setName('');
//       setPrice('');
//       setQuantity('');
//       setDescription('');
//       setGrade('');
//       setOrigin('');
//       setPurity('');
//       setSelectedFiles([]);
//       setUploadedImageUrls([]);
//     } catch (error) {
//       console.error('Failed to create listing:', error);
//       setMessage('Error: Failed to create listing.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <motion.div
//       className="bg-gray-800/50 backdrop-blur-md p-6 rounded-xl border border-teal-500/30 shadow-lg max-w-2xl mx-auto mb-6"
//       initial={{ opacity: 0, y: -20 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.8 }}
//     >
//       {/* <h3 className="text-xl font-bold mb-4 text-white">Create a New Listing</h3>
//       <p className="text-sm text-gray-400 mb-4">
//         We hash your description + specifications to anchor the data integrity on-chain.
//       </p> */}
//       <form onSubmit={handleCreateListing} className="grid grid-cols-1 md:grid-cols-2 gap-4">
//         <input
//           type="text"
//           value={name}
//           onChange={(e) => setName(e.target.value)}
//           placeholder="Material Name (e.g., Scrap Metal)"
//           className="p-2 rounded-lg bg-gray-900 text-white border border-gray-700 col-span-1 md:col-span-2"
//           required
//         />
//         <input
//           type="text"
//           value={price}
//           onChange={(e) => setPrice(e.target.value)}
//           placeholder="Price per Unit (in ETH)"
//           className="p-2 rounded-lg bg-background text-foreground border border-border"
//           required
//         />
//         <input
//           type="number"
//           value={quantity}
//           onChange={(e) => setQuantity(e.target.value)}
//           placeholder="Total Quantity"
//           className="p-2 rounded-lg bg-background text-foreground border border-border"
//           min="1"
//           required
//         />
//         <textarea
//           value={description}
//           onChange={(e) => setDescription(e.target.value)}
//           placeholder="Short Description (what is the material, condition, etc.)"
//           className="p-2 rounded-lg bg-gray-900 text-white border border-gray-700 col-span-1 md:col-span-2 min-h-[100px]"
//           required
//         />
//         <input
//           type="text"
//           value={grade}
//           onChange={(e) => setGrade(e.target.value)}
//           placeholder="Grade"
//           className="p-2 rounded-lg bg-background text-foreground border border-border"
//           required
//         />
//         <input
//           type="text"
//           value={origin}
//           onChange={(e) => setOrigin(e.target.value)}
//           placeholder="Origin"
//           className="p-2 rounded-lg bg-background text-foreground border border-border"
//           required
//         />
//         <input
//           type="text"
//           value={purity}
//           onChange={(e) => setPurity(e.target.value)}
//           placeholder="Purity"
//           className="p-2 rounded-lg bg-background text-foreground border border-border"
//           required
//         />

//         {/* Image Uploads */}
//         <div className="col-span-1 md:col-span-2">
//           <label className="block text-sm text-gray-300 mb-2">Upload Images</label>
//           <input
//             type="file"
//             accept="image/*"
//             multiple
//             onChange={handleFilesChange}
//             className="w-full text-sm text-gray-200"
//           />
//           <div className="mt-3 flex gap-3 flex-wrap">
//             {selectedFiles.map((f, idx) => (
//               <div key={idx} className="w-20 h-20 bg-gray-900 rounded overflow-hidden relative border border-gray-700">
//                 <Image
//                   src={URL.createObjectURL(f)}
//                   alt={f.name}
//                   fill
//                   className="object-cover"
//                 />
//               </div>
//             ))}
//             {uploadingImages && <p className="text-sm text-gray-400">Uploading images...</p>}
//           </div>
//         </div>

//         <button
//           type="submit"
//           disabled={loading}
//           className="col-span-1 md:col-span-2 bg-teal-500 text-white py-3 rounded-lg hover:bg-teal-400 transition-colors"
//         >
//           {loading ? "Creating..." : "Create Listing"}
//         </button>
//       </form>
//       {message && <p className="mt-3 text-gray-200">{message}</p>}
//     </motion.div>
//   );
// };

"use client";

import { useState } from "react";
import { useContract } from "@/app/hooks/useContract";
import { ethers } from "ethers";
import { useAuth } from "../../context/AuthContext";
import { motion } from "framer-motion";
import Image from "next/image";

interface UploadResponse {
  url: string;
  error?: string;
}

export const CreateListingForm = () => {
  const { signedContract } = useContract();
  const { user } = useAuth();
  const [name, setName] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [grade, setGrade] = useState<string>("");
  const [origin, setOrigin] = useState<string>("");
  const [purity, setPurity] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // Images
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedImageUrls, setUploadedImageUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState<boolean>(false);

  const uploadFile = async (file: File): Promise<string> => {
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const json: UploadResponse = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");
      return json.url;
    } catch (err) {
      console.error("Upload error:", err);
      throw err;
    }
  };

  const handleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const arr = Array.from(files);
    setSelectedFiles(arr);

    setUploadingImages(true);
    try {
      const urls: string[] = [];
      for (const f of arr) {
        const url = await uploadFile(f);
        urls.push(url);
      }
      setUploadedImageUrls(urls);
    } catch {
      setMessage("Image upload failed. Try again.");
    } finally {
      setUploadingImages(false);
    }
  };

  const handleCreateListing = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
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

      // Ensure images have been uploaded (or none selected)
      if (selectedFiles.length > 0 && uploadedImageUrls.length === 0) {
        setMessage("Please wait for image uploads to finish.");
        setLoading(false);
        return;
      }

      const imageHashes = uploadedImageUrls; // These are ImageKit URLs

      const tx = await signedContract.createListing(
        name,
        user.companyName,
        ethers.parseEther(price),
        quantityBigInt,
        dataHash,
        imageHashes
      );
      const receipt = await tx.wait();

      // Try to parse the ListingCreated event from the receipt logs to get the new listing ID
      let listingId: number | undefined;
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
              if (parsed && parsed.name === 'ListingCreated') {
                listingId = Number(parsed.args?.id ?? parsed.args?.listingId ?? parsed.args?._id);
                break;
              }
            } catch {
              // ignore parse errors for unrelated logs
            }
          }
        }
      } catch (err) {
        console.warn('Could not parse receipt logs for listing ID:', err);
      }

      // Fire-and-forget a refresh call so the listing is written to MongoDB immediately
      if (typeof listingId === 'number') {
        try {
          await fetch('/api/sync/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'listing', id: listingId })
          });
        } catch (err) {
          console.warn('Refresh sync failed:', err);
        }
      }

      setMessage('Listing created successfully! It will appear in the marketplace shortly.');
      setName('');
      setPrice('');
      setQuantity('');
      setDescription('');
      setGrade('');
      setOrigin('');
      setPurity('');
      setSelectedFiles([]);
      setUploadedImageUrls([]);
    } catch (error) {
      console.error('Failed to create listing:', error);
      setMessage('Error: Failed to create listing.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="bg-card backdrop-blur-md p-6 rounded-xl border border-accent-teal/30 shadow-lg max-w-2xl mx-auto mb-6"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* <h3 className="text-xl font-bold mb-4 text-white">Create a New Listing</h3>
      <p className="text-sm text-gray-400 mb-4">
        We hash your description + specifications to anchor the data integrity on-chain.
      </p> */}
      <form onSubmit={handleCreateListing} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Material Name (e.g., Scrap Metal)"
          className="p-2 rounded-lg bg-background text-foreground border border-border col-span-1 md:col-span-2"
          required
        />
        <input
          type="text"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Price per Unit (in ETH)"
          className="p-2 rounded-lg bg-background text-foreground border border-border"
          required
        />
        <input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="Total Quantity"
          className="p-2 rounded-lg bg-background text-foreground border border-border"
          min="1"
          required
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short Description (what is the material, condition, etc.)"
          className="p-2 rounded-lg bg-background text-foreground border border-border col-span-1 md:col-span-2 min-h-[100px]"
          required
        />
        <input
          type="text"
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          placeholder="Grade"
          className="p-2 rounded-lg bg-background text-foreground border border-border"
          required
        />
        <input
          type="text"
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          placeholder="Origin"
          className="p-2 rounded-lg bg-background text-foreground border border-border"
          required
        />
        <input
          type="text"
          value={purity}
          onChange={(e) => setPurity(e.target.value)}
          placeholder="Purity"
          className="p-2 rounded-lg bg-background text-foreground border border-border"
          required
        />

        {/* Image Uploads */}
        <div className="col-span-1 md:col-span-2">
          <label className="block text-sm text-dim mb-2">Upload Images</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFilesChange}
            className="w-full text-sm text-muted"
          />
          <div className="mt-3 flex gap-3 flex-wrap">
            {selectedFiles.map((f, idx) => (
              <div key={idx} className="w-20 h-20 bg-background rounded overflow-hidden relative border border-border">
                <Image
                  src={URL.createObjectURL(f)}
                  alt={f.name}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
            {uploadingImages && <p className="text-sm text-muted">Uploading images...</p>}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="col-span-1 md:col-span-2 bg-accent-teal text-background py-3 rounded-lg hover:opacity-90 transition-opacity"
        >
          {loading ? "Creating..." : "Create Listing"}
        </button>
      </form>
      {message && <p className="mt-3 text-gray-200">{message}</p>}
    </motion.div>
  );
};