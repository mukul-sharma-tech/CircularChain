"use client";

import React, { useState } from "react";

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name || !companyName || !role || !addressText) {
            setError("Please fill out all fields.");
            return;
        }

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
            onProfileComplete(updatedUser); // Notify the parent/context to update the user state

        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : String(err));
        }
    };

    return (
        <div style={{ maxWidth: '500px', margin: 'auto', padding: '2rem', border: '1px solid #333', borderRadius: '8px' }}>
            <h2>Complete Your Profile</h2>
            <p>Please select your role and enter your details to continue.</p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your Name" style={{ padding: '0.5rem' }} />
                <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Company Name" style={{ padding: '0.5rem' }} />
                <textarea value={addressText} onChange={e => setAddressText(e.target.value)} placeholder="Company Address" style={{ padding: '0.5rem', minHeight: '80px' }} />
                
                <div>
                    <p>Select your role:</p>
                    <label>
                        <input type="radio" name="role" value="user" onChange={_e => setRole('user')} checked={role === 'user'} /> Industry (Prosumer)
                    </label>
                    <label style={{ marginLeft: '1rem' }}>
                        <input type="radio" name="role" value="agent" onChange={_e => setRole('agent')} checked={role === 'agent'} /> Logistics Agent
                    </label>
                </div>
                
                {error && <p style={{ color: 'red' }}>{error}</p>}

                <button type="submit" style={{ padding: '0.75rem', background: 'green', color: 'white', border: 'none', borderRadius: '4px' }}>
                    Save and Continue
                </button>
            </form>
        </div>
    );
};

export default ProfileSetup;