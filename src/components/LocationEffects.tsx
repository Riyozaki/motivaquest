
import React from 'react';
import { motion } from 'framer-motion';

type LocationId = 'village' | 'forest' | 'mountains' | 'castle' | 'desert' | 'throne';

interface LocationEffectsProps {
  locationId: string;
}

const VillageWind = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    {[...Array(15)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute h-[2px] bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full"
        style={{
          top: `${Math.random() * 100}%`,
          left: -100,
          width: Math.random() * 200 + 100,
        }}
        animate={{
          x: ['-100%', '200vw'],
          opacity: [0, 0.8, 0]
        }}
        transition={{
          duration: Math.random() * 2 + 3,
          repeat: Infinity,
          ease: "linear",
          delay: Math.random() * 5
        }}
      />
    ))}
    <div className="absolute inset-0 bg-blue-500/5 mix-blend-overlay" />
  </div>
);

const ForestLeaves = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    {[...Array(20)].map((_, i) => {
        const isGreen = Math.random() > 0.3;
        return (
          <motion.div
            key={i}
            className={`absolute w-3 h-3 ${isGreen ? 'bg-emerald-500/40' : 'bg-amber-600/40'} rounded-tl-none rounded-br-2xl`}
            style={{
              left: `${Math.random() * 100}%`,
              top: -20,
            }}
            animate={{
              y: ['0vh', '100vh'],
              x: [0, Math.random() * 40 - 20, 0],
              rotate: [0, 360],
              opacity: [0, 1, 0]
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 10
            }}
          />
        )
    })}
    <div className="absolute inset-0 bg-green-900/10 mix-blend-overlay" />
    {/* Sunbeams */}
    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-400/10 blur-[100px] rounded-full mix-blend-screen" />
  </div>
);

const MountainSnow = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    {[...Array(40)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute bg-white rounded-full blur-[1px]"
        style={{
          left: `${Math.random() * 100}%`,
          top: -10,
          width: Math.random() * 4 + 2,
          height: Math.random() * 4 + 2,
        }}
        animate={{
          y: ['0vh', '110vh'],
          x: [0, Math.random() * 20 - 10],
          opacity: [0, 0.8, 0]
        }}
        transition={{
          duration: Math.random() * 5 + 5,
          repeat: Infinity,
          ease: "linear",
          delay: Math.random() * 5
        }}
      />
    ))}
    <div className="absolute inset-0 bg-slate-200/5 mix-blend-overlay" />
    {/* Cold Vignette */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(255,255,255,0.1)_100%)]" />
  </div>
);

const CastleEmbers = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    {[...Array(25)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 bg-orange-500 rounded-full blur-[0.5px]"
        style={{
          left: `${Math.random() * 100}%`,
          bottom: -10,
        }}
        animate={{
          y: [0, -window.innerHeight * 0.4],
          x: [0, Math.random() * 20 - 10],
          opacity: [1, 0],
          scale: [1, 0]
        }}
        transition={{
          duration: Math.random() * 3 + 2,
          repeat: Infinity,
          ease: "easeOut",
          delay: Math.random() * 2
        }}
      />
    ))}
    {/* Torch Flicker Overlay */}
    <motion.div 
      className="absolute inset-0 bg-orange-900/10 mix-blend-overlay"
      animate={{ opacity: [0.1, 0.2, 0.1] }}
      transition={{ duration: 2, repeat: Infinity }}
    />
  </div>
);

const DesertSand = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    {[...Array(50)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-[2px] h-[2px] bg-amber-300/60 rounded-full"
        style={{
          top: `${Math.random() * 100}%`,
          left: -10,
        }}
        animate={{
          x: ['-10%', '110%'],
          y: [0, Math.random() * 50],
          opacity: [0, 0.8, 0]
        }}
        transition={{
          duration: Math.random() * 2 + 1,
          repeat: Infinity,
          ease: "linear",
          delay: Math.random() * 2
        }}
      />
    ))}
    <div className="absolute inset-0 bg-amber-500/10 mix-blend-overlay" />
    {/* Heat Haze Simulation (Subtle scale pulsing) */}
    <motion.div 
        className="absolute inset-0 backdrop-blur-[0.5px]"
        animate={{ opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 3, repeat: Infinity }}
    />
  </div>
);

const ThroneMagic = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    {[...Array(20)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-2 h-2 bg-purple-600 rounded-full blur-sm"
        style={{
          left: `${Math.random() * 100}%`,
          bottom: -20,
        }}
        animate={{
          y: [0, -window.innerHeight],
          scale: [1, 2, 0],
          opacity: [0, 0.7, 0]
        }}
        transition={{
          duration: Math.random() * 6 + 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: Math.random() * 5
        }}
      />
    ))}
    {/* Dark Aura */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,#4c1d9533_0%,transparent_70%)]" />
    <motion.div 
       className="absolute inset-0 bg-purple-900/10 mix-blend-overlay"
       animate={{ opacity: [0.2, 0.4, 0.2] }}
       transition={{ duration: 4, repeat: Infinity }}
    />
  </div>
);

const LocationEffects: React.FC<LocationEffectsProps> = ({ locationId }) => {
  switch (locationId as LocationId) {
    case 'village': return <VillageWind />;
    case 'forest': return <ForestLeaves />;
    case 'mountains': return <MountainSnow />;
    case 'castle': return <CastleEmbers />;
    case 'desert': return <DesertSand />;
    case 'throne': return <ThroneMagic />;
    default: return <VillageWind />; // Default fallback
  }
};

export default LocationEffects;
