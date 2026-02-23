"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard?view=marketplace", label: "Marketplace" },
    { href: "/dashboard?view=orders", label: "My Orders" },
    { href: "/circular-sag", label: "Circular Sage" },
    { href: "/waste-compliance", label: "Waste Compliance" },
  ];

  return (
    <nav className="bg-gray-800/80 backdrop-blur-md border-b border-gray-700 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-teal-500 w-8 h-8 rounded-md flex items-center justify-center">
              <i className="fas fa-recycle text-gray-900 text-sm"></i>
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-cyan-400">
              CircularChain
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                  pathname === item.href.split('?')[0]
                    ? "bg-teal-500/20 text-teal-400 border border-teal-500/30"
                    : "text-gray-300 hover:text-teal-400 hover:bg-gray-700/50"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}