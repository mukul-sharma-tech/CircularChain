"use client";
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import type { EventLog } from 'ethers';
import { useContract } from './useContract';
import { useAuth } from '../../../context/AuthContext';

export const useUserEarnings = () => {
  const { readOnlyContract } = useContract();
  const { user } = useAuth();
  const [totalEarnings, setTotalEarnings] = useState(0n);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEarnings = async () => {
      if (!readOnlyContract || !user.walletAddress) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const filter = readOnlyContract.filters.DeliveryCompleted();
        const events = await readOnlyContract.queryFilter(filter);

        const userAddress = user.walletAddress.toLowerCase();
        let earnings = 0n;

        for (const event of events.filter((e): e is EventLog => "args" in e)) {
            if (!event.args) continue;

            const order = await readOnlyContract.orders(event.args.orderId);
            const listing = await readOnlyContract.listings(order.listingId);

            if(listing.seller.toLowerCase() === userAddress) {
                earnings += event.args.sellerPayout;
            }
            if(order.deliveryAgent && order.deliveryAgent.toLowerCase() === userAddress && order.deliveryAgent !== ethers.ZeroAddress) {
                earnings += event.args.agentFee;
            }
        }
        
        setTotalEarnings(earnings);
      } catch (error) {
        console.error('Failed to fetch user earnings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEarnings();
  }, [readOnlyContract, user.walletAddress]);

  return { totalEarnings, loading };
};
