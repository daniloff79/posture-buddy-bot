import { motion } from 'framer-motion';

export function PostureIllustration() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="relative w-48 h-48 mx-auto mb-8"
    >
      {/* Background circle */}
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
        className="absolute inset-0 rounded-full gradient-primary opacity-20"
      />
      
      {/* Inner circle */}
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut', delay: 0.5 }}
        className="absolute inset-4 rounded-full bg-primary/30"
      />
      
      {/* Person silhouette with good posture */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.svg
          viewBox="0 0 100 100"
          className="w-24 h-24"
          animate={{ y: [0, -3, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        >
          {/* Head */}
          <circle
            cx="50"
            cy="20"
            r="10"
            className="fill-primary"
          />
          {/* Neck */}
          <rect
            x="47"
            y="28"
            width="6"
            height="8"
            className="fill-primary"
          />
          {/* Torso - straight (good posture) */}
          <path
            d="M35 36 L50 36 L65 36 L62 70 L38 70 Z"
            className="fill-primary"
          />
          {/* Arms */}
          <path
            d="M35 38 L25 55 M65 38 L75 55"
            className="stroke-primary"
            strokeWidth="5"
            strokeLinecap="round"
          />
          {/* Legs */}
          <path
            d="M42 70 L38 95 M58 70 L62 95"
            className="stroke-primary"
            strokeWidth="6"
            strokeLinecap="round"
          />
          {/* Spine indicator - straight line for good posture */}
          <motion.line
            x1="50"
            y1="30"
            x2="50"
            y2="70"
            className="stroke-accent"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="4 4"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
        </motion.svg>
      </div>
      
      {/* Floating decorative elements */}
      <motion.div
        animate={{ 
          y: [-5, 5, -5],
          x: [-3, 3, -3],
          rotate: [0, 10, 0]
        }}
        transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
        className="absolute top-4 right-4 w-3 h-3 rounded-full bg-accent"
      />
      <motion.div
        animate={{ 
          y: [5, -5, 5],
          x: [3, -3, 3],
        }}
        transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut', delay: 1 }}
        className="absolute bottom-8 left-4 w-2 h-2 rounded-full bg-primary"
      />
    </motion.div>
  );
}
