// "use client";

// import { useAuth } from "../../context/AuthContext";
// import { useRouter } from "next/navigation"; // <-- Import the router

// const LoginButton = () => {
//   const { user, loading, login, logout } = useAuth();
//   const router = useRouter(); // <-- Initialize the router

//   const handleLogin = async () => {
//     const loggedInUser = await login();
//     if (loggedInUser) {
//       router.push('/dashboard'); // <-- Redirect to dashboard on success
//     }
//   };

//   if (loading) {
//     return <div>Loading...</div>;
//   }

//   return (
//     <div>
//       {user.isLoggedIn ? (
//         <div>
//           {/* You can add a button here to go to the dashboard */}
//           <button onClick={() => router.push('/dashboard')} style={{ padding: '8px', background: 'green', color: 'white', border: 'none', borderRadius: '4px', marginRight: '10px' }}>
//             Go to Dashboard
//           </button>
//           <button onClick={logout} style={{ padding: '8px', background: 'red', color: 'white', border: 'none', borderRadius: '4px' }}>
//             Logout
//           </button>
//         </div>
//       ) : (
//         // Call the new handleLogin function
//         <button onClick={handleLogin} style={{ padding: '8px', background: 'blue', color: 'white', border: 'none', borderRadius: '4px' }}>
//           Login with MetaMask
//         </button>
//       )}
//     </div>
//   );
// };

// export default LoginButton;

"use client";

import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";

const LoginButton = () => {
  const { user, loading, login, logout } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    const loggedInUser = await login();
    if (loggedInUser) {
      router.push("/dashboard");
    }
  };

  if (loading) return <div className="text-gray-400">Loading...</div>;

  return (
    <div className="flex gap-4">
      {user?.isLoggedIn ? (
        <>
          <motion.button
            whileHover={{ scale: 1.1, boxShadow: "0px 0px 15px #00ffcc" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => router.push("/dashboard")}
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold shadow-lg"
          >
            Go to Dashboard
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1, boxShadow: "0px 0px 15px #ff4444" }}
            whileTap={{ scale: 0.95 }}
            onClick={logout}
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-red-500 to-pink-600 text-white font-semibold shadow-lg"
          >
            Logout
          </motion.button>
        </>
      ) : (
        <motion.button
          whileHover={{ scale: 1.1, boxShadow: "0px 0px 15px #00bfff" }}
          whileTap={{ scale: 0.95 }}
          onClick={handleLogin}
          className="px-8 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold shadow-lg"
        >
          Login with MetaMask
        </motion.button>
      )}
    </div>
  );
};

export default LoginButton;
