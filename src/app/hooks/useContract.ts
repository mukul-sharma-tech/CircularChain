"use client";

import { useAuth } from "../../../context/AuthContext";
import { contractABI, contractAddress } from "@/lib/constants";
import { ethers, BrowserProvider, Contract, Signer } from "ethers";
import { useEffect, useState } from "react";

// This hook provides an easy way to get a read-only or signed contract instance
export const useContract = () => {
    const { user } = useAuth();
    const [readOnlyContract, setReadOnlyContract] = useState<Contract | null>(null);
    const [signedContract, setSignedContract] = useState<Contract | null>(null);

    useEffect(() => {
        const setupContracts = async () => {
            if (typeof window === 'undefined' || !(window as any).ethereum) {
                console.log("MetaMask is not installed.");
                return;
            }

            const provider = new BrowserProvider((window as any).ethereum);
            
            // Always create a read-only contract instance
            const readOnlyInstance = new Contract(contractAddress, contractABI, provider);
            setReadOnlyContract(readOnlyInstance);

            // Create a signed contract instance only if the user is logged in
            if (user.isLoggedIn) {
                try {
                    const signer: Signer = await provider.getSigner();
                    const signedInstance = new Contract(contractAddress, contractABI, signer);
                    setSignedContract(signedInstance);
                } catch (error) {
                    console.error("Failed to get signer:", error);
                    setSignedContract(null);
                }
            } else {
                setSignedContract(null);
            }
        };

        setupContracts();

    }, [user.isLoggedIn]); // Re-run this effect when the user's login state changes

    return { readOnlyContract, signedContract };
};