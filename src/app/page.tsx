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
import { Background3D } from "@/components/Background3D";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#101020] to-[#1a1a2e] text-white relative overflow-hidden">
      <main className="flex flex-col justify-center items-center min-h-screen pt-16 pb-20 px-4">
        {/* 3D Animated Background */}
        <Background3D />

        {/* Main Content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <motion.h1
              className="text-6xl md:text-7xl lg:text-8xl font-extrabold bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent"
              style={{ marginBottom: '32px' }}
              animate={{
                backgroundPosition: ["0%", "100%", "0%"],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              CircularChain
            </motion.h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 1 }}
            className="text-xl md:text-2xl text-gray-300 mb-4 font-light"
          >
            Transforming Industrial Waste into
          </motion.p>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 1 }}
            className="text-2xl md:text-3xl font-bold mb-8 bg-gradient-to-r from-teal-400 to-cyan-400 bg-clip-text text-transparent"
          >
            Valuable Assets
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 1 }}
            className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed"
            style={{ marginBottom: '40px' }}
          >
            A blockchain-powered marketplace connecting industries, logistics agents, and buyers
            to create a sustainable circular economy. Secure, transparent, and efficient.
          </motion.p>

          {/* Feature Cards */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            style={{ marginTop: '10px', marginBottom: '60px' }}
          >
            {[
              { icon: "🔒", title: "Secure", desc: "Blockchain-powered transactions" },
              { icon: "⚡", title: "Fast", desc: "Instant order processing" },
              { icon: "🌍", title: "Sustainable", desc: "Circular economy focus" },
            ].map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + idx * 0.1, duration: 0.6 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-gray-800/40 backdrop-blur-md p-6 rounded-2xl border border-teal-500/20 hover:border-teal-500/40 transition-all"
              >
                <div className="text-4xl mb-3">{feature.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="relative z-10"
            style={{ marginTop: '40px' }}
          >
            <LoginButton />
          </motion.div>
        </div>
      </main>
    </div>
  );
}