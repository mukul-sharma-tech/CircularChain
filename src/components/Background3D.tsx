"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

export const Background3D = () => {
  // Generate stable random 3D shapes using useMemo
  const shapes = useMemo(() => {
    // Use a seeded random function for consistency
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };

    return Array.from({ length: 20 }, (_, i) => {
      const seed = i * 0.1;
      return {
        id: i,
        size: seededRandom(seed) * 80 + 40,
        x: seededRandom(seed + 1) * 100,
        y: seededRandom(seed + 2) * 100,
        delay: seededRandom(seed + 3) * 5,
        duration: seededRandom(seed + 4) * 15 + 10,
        color: [
          'rgba(20, 184, 166, 0.2)',
          'rgba(6, 182, 212, 0.2)',
          'rgba(59, 130, 246, 0.2)',
          'rgba(139, 92, 246, 0.2)',
        ][Math.floor(seededRandom(seed + 5) * 4)],
        type: Math.floor(seededRandom(seed + 6) * 3), // 0: cube, 1: sphere, 2: tetrahedron
      };
    });
  }, []);

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{
        perspective: '1200px',
        perspectiveOrigin: '50% 50%',
      }}
    >
      {/* 3D Geometric Shapes */}
      {shapes.map((shape) => (
        <motion.div
          key={shape.id}
          className="absolute"
          style={{
            left: `${shape.x}%`,
            top: `${shape.y}%`,
            width: `${shape.size}px`,
            height: `${shape.size}px`,
            transformStyle: 'preserve-3d',
            filter: 'blur(1px)', // Depth of field effect
          }}
          animate={{
            rotateX: [0, 360],
            rotateY: [0, 360],
            rotateZ: [0, 180],
            y: [0, -40, 0],
            x: [0, Math.sin(shape.id) * 20, 0],
            scale: [1, 1.1, 1],
            opacity: [0.1, 0.25, 0.1], // Deeper, more subtle
          }}
          transition={{
            duration: shape.duration * 1.5, // Slower, more majestic
            repeat: Infinity,
            ease: "easeInOut",
            delay: shape.delay,
          }}
        >
          {shape.type === 0 ? (
            // 3D Cube
            <div
              className="relative w-full h-full"
              style={{
                transformStyle: 'preserve-3d',
                transform: 'rotateX(45deg) rotateY(45deg)',
              }}
            >
              {[
                { transform: 'translateZ(25px)', border: '1px solid rgba(255, 255, 255, 0.1)' },
                { transform: 'translateZ(-25px) rotateY(180deg)', border: '1px solid rgba(255, 255, 255, 0.1)' },
                { transform: 'rotateY(90deg) translateZ(25px)', border: '1px solid rgba(255, 255, 255, 0.05)' },
                { transform: 'rotateY(-90deg) translateZ(25px)', border: '1px solid rgba(255, 255, 255, 0.05)' },
                { transform: 'rotateX(90deg) translateZ(25px)', border: '1px solid rgba(255, 255, 255, 0.05)' },
                { transform: 'rotateX(-90deg) translateZ(25px)', border: '1px solid rgba(255, 255, 255, 0.05)' },
              ].map((face, idx) => (
                <div
                  key={idx}
                  className="absolute w-full h-full"
                  style={{
                    background: `linear-gradient(135deg, ${shape.color}, transparent)`,
                    border: face.border,
                    transform: face.transform,
                    backfaceVisibility: 'hidden',
                  }}
                />
              ))}
            </div>
          ) : shape.type === 1 ? (
            // 3D Sphere
            <div
              className="w-full h-full rounded-full"
              style={{
                background: `radial-gradient(circle at 30% 30%, ${shape.color}, transparent 80%)`,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: `inset 0 0 20px ${shape.color}`,
              }}
            />
          ) : (
            // 3D Tetrahedron (simplified as triangle)
            <div
              className="relative w-full h-full"
              style={{
                transformStyle: 'preserve-3d',
              }}
            >
              <div
                className="absolute w-full h-full"
                style={{
                  clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                  background: `linear-gradient(135deg, ${shape.color}, transparent)`,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  transform: 'translateZ(20px)',
                }}
              />
            </div>
          )}
        </motion.div>
      ))}

      {/* Animated gradient orbs for depth */}
      <motion.div
        className="absolute top-20 left-10 w-[500px] h-[500px] rounded-full blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(20, 184, 166, 0.4), transparent 70%)',
        }}
        animate={{
          x: [0, 150, 0],
          y: [0, 100, 0],
          scale: [1, 1.4, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-[600px] h-[600px] rounded-full blur-3xl"
        style={{
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4), transparent 70%)',
        }}
        animate={{
          x: [0, -150, 0],
          y: [0, -100, 0],
          scale: [1.2, 1, 1.2],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 w-[400px] h-[400px] rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"
        style={{
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.3), transparent 70%)',
        }}
        animate={{
          scale: [1, 1.5, 1],
          rotate: [0, 360],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
};

