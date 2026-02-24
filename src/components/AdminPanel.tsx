"use client";
import { ethers } from "ethers";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface CommissionEntry {
    orderId: string;
    seller: string;
    buyer: string;
    sellerPayoutWei: string;
    adminFeeWei: string;
    agentFeeWei: string;
    timestamp: number;
    blockNumber: number;
    paymentMethod: 'ETH' | 'FIAT';
    isLocalAgent: boolean;
}

interface AdminStats {
    totalEarningsWei: string;
    commissionHistory: CommissionEntry[];
}

export const AdminPanel = () => {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [syncing, setSyncing] = useState(false);
    const [syncMessage, setSyncMessage] = useState('');
    const [dbListings, setDbListings] = useState<Array<{listingId: number; name: string; companyName: string}>>([]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch('/api/admin/stats');
                if (!response.ok) {
                    throw new Error(`Failed to fetch stats: ${response.statusText}`);
                }
                const data: AdminStats = await response.json();
                setStats(data);
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : String(err));
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const handleSyncAll = async () => {
        setSyncing(true);
        setSyncMessage('');
        try {
            const response = await fetch('/api/admin/sync-all', {
                method: 'POST',
            });
            const data = await response.json();
            if (response.ok) {
                setSyncMessage(`✅ Synced ${data.synced} listings successfully! (${data.failed} failed)`);
                // Refresh the DB check
                checkDatabase();
            } else {
                setSyncMessage(`❌ Sync failed: ${data.message}`);
            }
        } catch (err) {
            setSyncMessage(`❌ Error: ${err instanceof Error ? err.message : String(err)}`);
        } finally {
            setSyncing(false);
        }
    };

    const checkDatabase = async () => {
        try {
            const response = await fetch('/api/admin/check-db');
            const data = await response.json();
            if (response.ok) {
                setDbListings(data.listings || []);
            }
        } catch (err) {
            console.error('Failed to check database:', err);
        }
    };

    if (loading) return <p className="text-center mt-8 text-muted">Loading admin data...</p>;
    if (error) return <p className="text-center mt-8 text-red-500">Error: {error}</p>;
    if (!stats) return <p className="text-center mt-8 text-muted">No data available.</p>;

    return (
        // <div className="space-y-8">
        //     {/* Total Earnings Card */}
        //     <div className="bg-gray-800/60 backdrop-blur-sm p-8 rounded-xl border border-teal-500/30 text-center">
        //         <h3 className="text-xl font-semibold text-teal-400 mb-2">Total Platform Earnings</h3>
        //         <p className="text-4xl font-bold text-white">
        //             {ethers.formatEther(stats.totalEarnings)} ETH
        //         </p>
        //     </div>

        //     {/* Commission History */}
        //     <div className="bg-gray-800/40 p-6 rounded-xl border border-gray-700">
        //         <h3 className="text-2xl font-bold text-white mb-6">Transaction History</h3>
        //         <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
        //             {stats.commissionHistory.length > 0 ? (
        //                 stats.commissionHistory.map((entry) => (
        //                     <div key={entry.blockNumber + entry.orderId} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
        //                         <div>
        //                             <p className="font-semibold text-white">Order #{entry.orderId}</p>
        //                             <p className="text-xs text-gray-400 mt-1">
        //                                 From: {entry.seller.slice(0, 6)}... to {entry.buyer.slice(0, 6)}...
        //                             </p>
        //                             <p className="text-xs text-gray-500 mt-1">
        //                                 {new Date(entry.timestamp * 1000).toLocaleString()}
        //                             </p>
        //                         </div>
        //                         <div className="text-right">
        //                             <p className="font-bold text-teal-400 text-lg">
        //                                 + {ethers.formatEther(entry.feeAmount)} ETH
        //                             </p>
        //                             <p className="text-xs text-gray-500">Commission</p>
        //                         </div>
        //                     </div>
        //                 ))
        //             ) : (
        //                 <p className="text-gray-400 text-center py-8">No completed transactions yet.</p>
        //             )}
        //         </div>
        //     </div>
        // </div>
        <div className="space-y-8">
            {/* Sync Button */}
            <motion.div
                className="bg-card backdrop-blur-md p-6 rounded-xl border border-border"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h3 className="text-lg font-semibold text-foreground mb-3">Database Sync</h3>
                <p className="text-sm text-muted mb-4">
                    Sync all blockchain listings to the database for recommendations and search.
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={handleSyncAll}
                        disabled={syncing}
                        className="bg-accent-teal hover:opacity-90 disabled:bg-muted text-background font-bold py-2 px-6 rounded-lg transition-all"
                    >
                        {syncing ? 'Syncing...' : 'Sync All Listings'}
                    </button>
                    <button
                        onClick={checkDatabase}
                        className="bg-accent-blue hover:opacity-90 text-white font-bold py-2 px-6 rounded-lg transition-all"
                    >
                        Check Database
                    </button>
                </div>
                {syncMessage && (
                    <p className={`mt-3 text-sm ${syncMessage.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>
                        {syncMessage}
                    </p>
                )}
                {dbListings.length > 0 && (
                    <div className="mt-4 p-4 bg-background/50 rounded-lg max-h-60 overflow-y-auto">
                        <h4 className="text-sm font-semibold text-foreground mb-2">Database Listings ({dbListings.length}):</h4>
                        <div className="space-y-2">
                            {dbListings.map((listing) => (
                                <div key={listing.listingId} className="text-xs text-dim">
                                    <span className="text-accent-teal">#{listing.listingId}</span> - {listing.name} ({listing.companyName})
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </motion.div>

            {/* Total Earnings Card */}
            <motion.div
                className="bg-card backdrop-blur-md p-8 rounded-xl border border-accent-teal/40 text-center shadow-lg"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
            >
                <h3 className="text-xl font-semibold text-accent-teal mb-2">Total Platform Earnings</h3>
                <p className="text-4xl font-bold text-foreground">
                    {/* {ethers.formatEther(BigInt(stats.totalEarningsWei))} ETH */}
                    ₹ {(Number(ethers.formatEther(stats.totalEarningsWei)) * 100000).toFixed(2)}
                </p>
            </motion.div>

            {/* Commission History */}
            <motion.div
                className="bg-card/40 p-6 rounded-xl border border-border shadow-inner max-h-[500px] overflow-y-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
            >
                <h3 className="text-2xl font-bold text-foreground mb-6">Transaction History</h3>
                <div className="space-y-3">
                    {stats.commissionHistory.length > 0 ? (
                        stats.commissionHistory.map((entry) => (
                            <motion.div
                                key={entry.blockNumber + entry.orderId}
                                className="flex items-center justify-between p-4 bg-background/50 rounded-lg hover:bg-background/70 transition-colors"
                                whileHover={{ scale: 1.02 }}
                            >
                                <div>
                                    <p className="font-semibold text-foreground">Order #{entry.orderId}</p>
                                    <p className="text-xs text-muted mt-1">
                                        From: {entry.seller.slice(0, 6)}... → Buyer {entry.buyer.slice(0, 6)}...
                                    </p>
                                    <p className="text-xs text-muted">
                                        Payment: {entry.paymentMethod} · {entry.isLocalAgent ? "Local Logistics" : "Platform Agent"}
                                    </p>
                                    <p className="text-xs text-muted mt-1">
                                        {new Date(entry.timestamp * 1000).toLocaleString()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-accent-teal text-lg">
                                        + {ethers.formatEther(BigInt(entry.adminFeeWei))} ETH
                                    </p>
                                    <p className="text-xs text-muted">
                                        Agent Fee: {entry.isLocalAgent ? "0 (Local)" : `${ethers.formatEther(BigInt(entry.agentFeeWei))} ETH`}
                                    </p>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <p className="text-muted text-center py-8">No completed transactions yet.</p>
                    )}
                </div>
            </motion.div>
        </div>

    );
};