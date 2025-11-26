// import LoginButton from "@/components/LoginButton";

// export default function Home() {
//   return (
//     <main style={{ padding: '2rem' }}>
//       <h1>Welcome to CircularChain</h1>
//       <LoginButton />
//     </main>
//   );
// }


"use client";
import { motion } from "framer-motion";
import LoginButton from "@/components/LoginButton";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-[#0a0a1a] via-[#101020] to-[#1a1a2e] text-white relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
      </div>

      {/* Animated Title */}
      <motion.h1
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="text-5xl md:text-6xl font-bold text-center bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent"
      >
        Welcome to CircularChain
      </motion.h1>

      {/* Tagline */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 1 }}
        className="text-gray-400 text-lg mt-4 text-center max-w-lg"
      >
        A blockchain-powered marketplace turning industrial waste into valuable assets 🌍
      </motion.p>

      {/* Login Button Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="mt-10"
      >
        <LoginButton />
      </motion.div>
    </main>
  );
}
