"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

interface ProfileSetupProps {
    onProfileComplete: (updatedUser: {
        walletAddress: string;
        role: 'user' | 'agent' | 'admin';
        isLoggedIn: boolean;
        name?: string;
        companyName?: string;
        addressText?: string;
        isAvailable?: boolean;
    }) => void;
}

const ProfileSetup = ({ onProfileComplete }: ProfileSetupProps) => {
    const [name, setName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [addressText, setAddressText] = useState('');
    const [role, setRole] = useState<'user' | 'agent' | ''>('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name || !companyName || !role || !addressText) {
            setError("Please fill out all fields.");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch('/api/user/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, companyName, role, addressText }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Failed to update profile.");
            }

            const updatedUser = await response.json();
            onProfileComplete(updatedUser);

        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-2xl bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-700/50 overflow-hidden"
            >
                {/* Header */}
                <div className="relative bg-gradient-to-r from-teal-500/20 to-cyan-500/20 p-8 border-b border-slate-700/50">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-teal-500/10 to-transparent blur-2xl" />
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-3 rounded-xl bg-teal-500/20 border border-teal-500/30">
                                <svg className="w-6 h-6 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <h2 className="text-3xl font-bold text-white">Complete Your Profile</h2>
                        </div>
                        <p className="text-slate-300">Tell us about yourself to get started with CircularChain</p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {/* Name Input */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                            Full Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="John Doe"
                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
                        />
                    </div>

                    {/* Company Name Input */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                            Company Name
                        </label>
                        <input
                            type="text"
                            value={companyName}
                            onChange={e => setCompanyName(e.target.value)}
                            placeholder="Acme Industries"
                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
                        />
                    </div>

                    {/* Address Input */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-2">
                            Company Address
                        </label>
                        <textarea
                            value={addressText}
                            onChange={e => setAddressText(e.target.value)}
                            placeholder="123 Main Street, City, Country"
                            rows={3}
                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all resize-none"
                        />
                    </div>

                    {/* Role Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-3">
                            Select Your Role
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Industry Role */}
                            <motion.label
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`relative flex items-start p-5 rounded-xl border-2 cursor-pointer transition-all ${
                                    role === 'user'
                                        ? 'border-teal-500 bg-teal-500/10'
                                        : 'border-slate-700 bg-slate-900/30 hover:border-slate-600'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="role"
                                    value="user"
                                    onChange={() => setRole('user')}
                                    checked={role === 'user'}
                                    className="sr-only"
                                />
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className={`p-2 rounded-lg ${role === 'user' ? 'bg-teal-500/20' : 'bg-slate-800'}`}>
                                            <svg className={`w-5 h-5 ${role === 'user' ? 'text-teal-400' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                        </div>
                                        <span className={`font-bold ${role === 'user' ? 'text-white' : 'text-slate-400'}`}>
                                            Industry (Prosumer)
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        Buy and sell industrial waste materials on the marketplace
                                    </p>
                                </div>
                                {role === 'user' && (
                                    <div className="absolute top-3 right-3">
                                        <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center">
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    </div>
                                )}
                            </motion.label>

                            {/* Agent Role */}
                            <motion.label
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                className={`relative flex items-start p-5 rounded-xl border-2 cursor-pointer transition-all ${
                                    role === 'agent'
                                        ? 'border-teal-500 bg-teal-500/10'
                                        : 'border-slate-700 bg-slate-900/30 hover:border-slate-600'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="role"
                                    value="agent"
                                    onChange={() => setRole('agent')}
                                    checked={role === 'agent'}
                                    className="sr-only"
                                />
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className={`p-2 rounded-lg ${role === 'agent' ? 'bg-teal-500/20' : 'bg-slate-800'}`}>
                                            <svg className={`w-5 h-5 ${role === 'agent' ? 'text-teal-400' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                        </div>
                                        <span className={`font-bold ${role === 'agent' ? 'text-white' : 'text-slate-400'}`}>
                                            Logistics Agent
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        Provide transportation and delivery services for waste materials
                                    </p>
                                </div>
                                {role === 'agent' && (
                                    <div className="absolute top-3 right-3">
                                        <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center">
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    </div>
                                )}
                            </motion.label>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3"
                        >
                            <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm text-red-300">{error}</p>
                        </motion.div>
                    )}

                    {/* Submit Button */}
                    <motion.button
                        type="submit"
                        disabled={isSubmitting}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-900 font-bold text-lg shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                                <span>Saving Profile...</span>
                            </>
                        ) : (
                            <>
                                <span>Save and Continue</span>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                            </>
                        )}
                    </motion.button>
                </form>
            </motion.div>
        </div>
    );
};

export default ProfileSetup;