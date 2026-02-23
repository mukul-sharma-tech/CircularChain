"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";

const LoginButton = () => {
  const { user, loading, login, logout } = useAuth();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleLogin = async () => {
    setIsConnecting(true);
    try {
      const loggedInUser = await login();
      if (loggedInUser) {
        setShowModal(false);
        router.push("/dashboard");
      }
    } finally {
      setIsConnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-slate-400">
        <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        <span className="font-medium">Authenticating...</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-wrap gap-4 items-center justify-center">
        {user?.isLoggedIn ? (
          <>
            <motion.button
              whileHover={{ y: -2, boxShadow: "0 10px 25px -10px rgba(20, 184, 166, 0.5)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push("/dashboard")}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-900 font-bold tracking-tight shadow-lg shadow-teal-500/20 transition-all hover:shadow-teal-500/40"
            >
              Go to Dashboard
            </motion.button>

            <motion.button
              whileHover={{ y: -2, backgroundColor: "rgba(239, 68, 68, 0.1)" }}
              whileTap={{ scale: 0.98 }}
              onClick={logout}
              className="px-8 py-4 rounded-2xl border border-red-500/20 text-red-500 font-semibold transition-all hover:border-red-500/40 hover:bg-red-500/5"
            >
              Logout
            </motion.button>
          </>
        ) : (
          <motion.button
            whileHover={{ y: -2, boxShadow: "0 10px 30px -10px rgba(6, 182, 212, 0.5)" }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowModal(true)}
            className="group relative px-10 py-4 rounded-2xl bg-gradient-to-r from-slate-100 to-white text-slate-900 font-bold overflow-hidden transition-all hover:shadow-xl"
          >
            <div className="relative z-10 flex items-center gap-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <span>Connect Wallet</span>
              <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </motion.button>
        )}
      </div>

      {/* Enhanced Login Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            onClick={() => !isConnecting && setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl shadow-2xl border border-slate-700/50 overflow-hidden"
            >
              {/* Close Button */}
              <button
                onClick={() => !isConnecting && setShowModal(false)}
                disabled={isConnecting}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-800/50 hover:bg-slate-700/50 transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Decorative Background */}
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-teal-500/20 to-cyan-500/20 blur-3xl" />

              <div className="relative p-8">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-500/30">
                    <svg className="w-12 h-12 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-3xl font-bold text-center text-white mb-3">
                  Connect Your Wallet
                </h2>
                <p className="text-center text-slate-400 mb-8">
                  Sign in securely with your Web3 wallet to access CircularChain
                </p>

                {/* Connect Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogin}
                  disabled={isConnecting}
                  className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-900 font-bold text-lg shadow-lg shadow-teal-500/30 hover:shadow-teal-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {isConnecting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6" viewBox="0 0 40 40" fill="none">
                        <path d="M10 14L20 4L30 14L26 18L20 12L14 18L10 14Z" fill="currentColor"/>
                        <path d="M20 24L14 18V28L20 34L26 28V18L20 24Z" fill="currentColor"/>
                      </svg>
                      <span>Connect with MetaMask</span>
                    </>
                  )}
                </motion.button>

                {/* Info Cards */}
                <div className="mt-8 space-y-3">
                  {[
                    { icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", text: "Secure blockchain authentication" },
                    { icon: "M13 10V3L4 14h7v7l9-11h-7z", text: "Instant access to marketplace" },
                    { icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z", text: "Your keys, your control" },
                  ].map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * idx }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
                        <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                        </svg>
                      </div>
                      <span className="text-sm text-slate-300">{item.text}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Footer */}
                <p className="mt-6 text-center text-xs text-slate-500">
                  By connecting, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default LoginButton;
