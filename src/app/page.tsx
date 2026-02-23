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
    <div className="min-h-screen bg-[#04040a] text-slate-100 relative overflow-hidden selection:bg-teal-500/30">
      {/* 3D Animated Background */}
      <Background3D />

      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-24">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="inline-flex items-center px-4 py-1.5 mb-8 rounded-full border border-teal-500/20 bg-teal-500/5 text-teal-400 text-sm font-medium backdrop-blur-sm"
          >
            <span className="relative flex h-2 w-2 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
            </span>
            Reimagining Industrial Sustainability
          </motion.div>

          {/* Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="text-7xl md:text-8xl lg:text-9xl font-black tracking-tight mb-6">
              <span className="text-gradient">Circular</span>
              <br />
              <span className="text-white opacity-90">Chain</span>
            </h1>
          </motion.div>

          {/* Tagline */}
          <div className="space-y-4 mb-12">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-2xl md:text-3xl font-light text-slate-300 max-w-3xl mx-auto leading-relaxed"
            >
              Transforming <span className="text-teal-400 font-medium">Industrial Waste</span> into 
              <span className="block italic text-slate-400">Valuable Strategic Assets.</span>
            </motion.p>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 1 }}
            className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed mb-16"
          >
            A blockchain-powered ecosystem connecting industries, logistics, and buyers 
            to architect a seamless circular economy. Transparent. Secure. Visionary.
          </motion.p>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-24"
          >
            <LoginButton />
            <button className="px-8 py-4 rounded-2xl border border-slate-700 bg-transparent text-slate-300 font-medium hover:bg-slate-800/50 hover:text-white transition-all">
              Explore Marketplace
            </button>
          </motion.div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                title: "Immutable Trust", 
                desc: "Every transaction etched into the blockchain for absolute transparency.",
                icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
              },
              { 
                title: "Hyper-Efficiency", 
                desc: "AI-optimized logistics and instant smart contract settlement.",
                icon: "M13 10V3L4 14h7v7l9-11h-7z" 
              },
              { 
                title: "Global Circularity", 
                desc: "Closing the loop with a decentralized network of sustainable partners.",
                icon: "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" 
              },
            ].map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 * idx, duration: 0.8 }}
                className="glass-card p-8 rounded-3xl text-left group"
              >
                <div className="w-12 h-12 mb-6 rounded-2xl bg-teal-500/10 flex items-center justify-center group-hover:bg-teal-500/20 transition-colors">
                  <svg className="w-6 h-6 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={feature.icon} />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      {/* Decorative Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-teal-500/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
    </div>
  );
}
