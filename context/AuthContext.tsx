// "use client";

// import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
// import { BrowserProvider, JsonRpcSigner } from 'ethers';
// import { SiweMessage } from 'siwe'; 

// // Define the shape of the user object
// interface User {
//   isLoggedIn: boolean;
//   walletAddress?: string;
//   role?: string;
// }

// interface AuthContextType {
//   user: User;
//   loading: boolean;
//   login: () => Promise<void>;
//   logout: () => Promise<void>;
//   updateUser: (newUserData: User) => void; // <-- ADD THIS
// }

// // Define the shape of the context value
// interface AuthContextType {
//   user: User;
//   loading: boolean;
//   login: () => Promise<void>;
//   logout: () => Promise<void>;
// }

// // Create the context with a default value
// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// // Create the AuthProvider component
// export const AuthProvider = ({ children }: { children: ReactNode }) => {
//   const [user, setUser] = useState<User>({ isLoggedIn: false });
//   const [loading, setLoading] = useState(true);

//   // Effect to check for an existing session on initial load
//   useEffect(() => {
//     const checkUserSession = async () => {
//       try {
//         const response = await fetch('/api/auth/me');
//         if (response.ok) {
//           const userData = await response.json();
//           setUser(userData);
//         }
//       } catch (error) {
//         console.error("Could not fetch user session:", error);
//       } finally {
//         setLoading(false);
//       }
//     };
//     checkUserSession();
//   }, []);

//   const updateUser = (newUserData: User) => { // <-- ADD THIS FUNCTION
//     setUser(newUserData);
//   };


//   // Login function
//   const login = async () => {
//     if (!(window as any).ethereum) {
//       alert("Please install MetaMask to use this feature.");
//       return;
//     }

//     try {
//       setLoading(true);
//       const provider = new BrowserProvider((window as any).ethereum);
//       const signer = await provider.getSigner();
//       const address = await signer.getAddress();
//       const chainId = (await provider.getNetwork()).chainId;

//       // 1. Get the nonce from our backend
//       const nonceRes = await fetch(`/api/auth/nonce?address=${address}`);
//       const nonce = await nonceRes.text();

//       // 2. Create the SIWE message object
//       const message = new SiweMessage({
//         domain: window.location.host,
//         address,
//         statement: 'Sign in with Ethereum to the app.',
//         uri: window.location.origin,
//         version: '1',
//         chainId: Number(chainId),
//         nonce: nonce,
//       });

//       // 3. Get the message string to sign
//       const messageToSign = message.prepareMessage();

//       // 4. Sign the message
//       const signature = await signer.signMessage(messageToSign);

//       // 5. Send the message and signature to the backend for verification
//       const verifyRes = await fetch('/api/auth/verify', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         // Send the original message object, not the prepared string
//         body: JSON.stringify({ message, signature }),
//       });

//       if (!verifyRes.ok) {
//         throw new Error("Verification failed");
//       }

//       const userData = await verifyRes.json();
//       setUser(userData);

//     } catch (error) {
//       console.error("Login failed:", error);
//       setUser({ isLoggedIn: false }); // Reset on failure
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Logout function
//   const logout = async () => {
//     try {
//       await fetch('/api/auth/logout');
//       setUser({ isLoggedIn: false });
//     } catch (error) {
//       console.error("Logout failed:", error);
//     }
//   };

//   return (
//     <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// // Custom hook to use the AuthContext
// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };

"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { BrowserProvider } from 'ethers';
import { SiweMessage } from 'siwe';

// 1. Define the shape of the User object
interface User {
    isLoggedIn: boolean;
    walletAddress?: string;
    role?: string;
    name?: string;
    companyName?: string;
    addressText?: string;
    isAvailable?: boolean;
}

// 2. Define the shape of the Context, including the updated login return type and updateUser function
interface AuthContextType {
    user: User;
    loading: boolean;
    login: () => Promise<User | undefined>; // Returns user data on success for redirects
    logout: () => Promise<void>;
    updateUser: (newUserData: User) => void; // For the profile setup form to use
}

// 3. Create the context with a default undefined value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 4. Create the main provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User>({ isLoggedIn: false });
    const [loading, setLoading] = useState(true);

    // Effect to check for an existing session on initial app load
    useEffect(() => {
        const checkUserSession = async () => {
            try {
                const response = await fetch('/api/auth/me');
                if (response.ok) {
                    const userData = await response.json();
                    if (userData.isLoggedIn) {
                        setUser(userData);
                    }
                }
            } catch (error) {
                console.error("Could not fetch user session:", error);
            } finally {
                setLoading(false);
            }
        };
        checkUserSession();
    }, []);

    // Function to allow components like the ProfileSetup form to update the user state
    const updateUser = (newUserData: User) => {
        setUser(newUserData);
    };

    // Login function that handles the full SIWE flow
    const login = async (): Promise<User | undefined> => {
        if (!(window as any).ethereum) {
            alert("Please install MetaMask to use this feature.");
            return undefined;
        }

        try {
            setLoading(true);
            const provider = new BrowserProvider((window as any).ethereum);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();
            const chainId = (await provider.getNetwork()).chainId;

            // Get nonce from the backend
            const nonceRes = await fetch(`/api/auth/nonce?address=${address}`);
            const nonce = await nonceRes.text();

            // Ensure a user record exists in the database for this address (signup/upsert)
            try {
                await fetch('/api/auth/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ address, nonce }),
                });
            } catch (signupErr) {
                // Don't block login on signup failure, but log so we can debug
                console.warn('Signup endpoint failed:', signupErr);
            }

            // Create the full SIWE message
            const message = new SiweMessage({
                domain: window.location.host,
                address,
                statement: 'Sign in with Ethereum to the app.',
                uri: window.location.origin,
                version: '1',
                chainId: Number(chainId),
                nonce: nonce,
            });

            const messageToSign = message.prepareMessage();
            const signature = await signer.signMessage(messageToSign);

            // Verify signature with the backend
            const verifyRes = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message, signature }),
            });

            if (!verifyRes.ok) {
                // Forward the server's error message if available so callers can display it
                const errorBody = await verifyRes.json().catch(() => null);
                throw new Error(errorBody?.message || 'Verification failed');
            }

            const userData = await verifyRes.json();
            setUser(userData);
            return userData; // Return user data on success

        } catch (error) {
            console.error("Login failed:", error);
            if (error instanceof Error) {
                // Surface the backend message to the user
                alert(error.message);
            }
            setUser({ isLoggedIn: false }); // Reset on failure
            return undefined; // Return undefined on failure
        } finally {
            setLoading(false);
        }
    };

    // Logout function
    const logout = async () => {
        try {
            await fetch('/api/auth/logout');
            setUser({ isLoggedIn: false });
        } catch (error) {
            console.error("Logout failed:", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

// 5. Custom hook for easy access to the context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};