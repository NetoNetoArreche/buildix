import { cn } from "@/lib/utils";

interface CosmosLogoProps {
  className?: string;
}

export function CosmosLogo({ className }: CosmosLogoProps) {
  return (
    <svg
      className={cn("cosmos-logo", className)}
      viewBox="0 0 512 512"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <style>{`
          /* Animation Keyframes - Faster and more intense */
          @keyframes pulseOpacityBasic {
            0% { opacity: 0.3; }
            50% { opacity: 1; }
            100% { opacity: 0.3; }
          }
          @keyframes pulseNebula1 {
            0% { opacity: 0.4; }
            50% { opacity: 1; }
            100% { opacity: 0.4; }
          }
          @keyframes pulseNebula2 {
            0% { opacity: 0.3; }
            50% { opacity: 1; }
            100% { opacity: 0.3; }
          }
          @keyframes pulseStars1 {
            0% { opacity: 0.1; }
            50% { opacity: 1; }
            100% { opacity: 0.1; }
          }
          @keyframes pulseStars2 {
            0% { opacity: 1; }
            50% { opacity: 0.1; }
            100% { opacity: 1; }
          }
          @keyframes pulseShine {
            0% { opacity: 0.3; }
            50% { opacity: 1; }
            100% { opacity: 0.3; }
          }

          /* Base states with faster transition */
          .anim-ring { opacity: 0.5; transition: opacity 0.3s; }
          .anim-nebula1 { opacity: 0.7; transition: opacity 0.3s; }
          .anim-nebula2 { opacity: 0.6; transition: opacity 0.3s; }
          .anim-stars1 { opacity: 0.3; transition: opacity 0.3s; }
          .anim-stars2 { opacity: 1; transition: opacity 0.3s; }
          .anim-shine { opacity: 0.6; transition: opacity 0.3s; }

          /* Hover animations - Faster durations */
          .cosmos-logo:hover .anim-ring {
            animation: pulseOpacityBasic 0.8s infinite ease-in-out;
          }
          .cosmos-logo:hover .anim-nebula1 {
            animation: pulseNebula1 1.2s infinite ease-in-out;
          }
          .cosmos-logo:hover .anim-nebula2 {
            animation: pulseNebula2 1.5s infinite ease-in-out;
          }
          .cosmos-logo:hover .anim-stars1 {
            animation: pulseStars1 0.5s infinite ease-in-out;
          }
          .cosmos-logo:hover .anim-stars2 {
            animation: pulseStars2 0.6s infinite ease-in-out;
          }
          .cosmos-logo:hover .anim-shine {
            animation: pulseShine 0.8s infinite ease-in-out;
          }
        `}</style>

        {/* Clipping Path for the Sphere */}
        <clipPath id="sphereClip">
          <circle cx="256" cy="256" r="200" />
        </clipPath>

        {/* Deep Space Background Gradient */}
        <radialGradient id="deepSpace" cx="50%" cy="50%" r="50%" fx="30%" fy="30%">
          <stop offset="0%" stopColor="#4a1a88" />
          <stop offset="40%" stopColor="#200d50" />
          <stop offset="100%" stopColor="#02010a" />
        </radialGradient>

        {/* Nebula Gradient 1 (Purple/Pink) */}
        <radialGradient id="nebula1" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff33dd" stopOpacity="0.8" />
          <stop offset="70%" stopColor="#330044" stopOpacity="0" />
        </radialGradient>

        {/* Nebula Gradient 2 (Cyan/Blue) */}
        <radialGradient id="nebula2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#55ffff" stopOpacity="0.7" />
          <stop offset="70%" stopColor="#003366" stopOpacity="0" />
        </radialGradient>

        {/* Glass Reflection Gradient */}
        <linearGradient id="glassShine" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
          <stop offset="25%" stopColor="#ffffff" stopOpacity="0.2" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        {/* Outer Glow Filter */}
        <filter id="outerGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="8" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Main Group */}
      <g>
        {/* Outer Aura/Glow (Behind the sphere) */}
        <circle
          className="anim-ring"
          cx="256"
          cy="256"
          r="202"
          fill="none"
          stroke="#aa88ff"
          strokeWidth="3"
          filter="url(#outerGlow)"
        />

        {/* Sphere Container */}
        <g clipPath="url(#sphereClip)">
          {/* 1. Background Base */}
          <rect x="0" y="0" width="512" height="512" fill="url(#deepSpace)" />

          {/* 2. Animated Nebula Layer 1 - Faster rotation (15s) */}
          <g style={{ transformOrigin: "256px 256px" }}>
            <circle
              className="anim-nebula1"
              cx="180"
              cy="180"
              r="300"
              fill="url(#nebula1)"
              style={{ mixBlendMode: "screen" }}
            />
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 256 256"
              to="360 256 256"
              dur="15s"
              repeatCount="indefinite"
            />
          </g>

          {/* 3. Animated Nebula Layer 2 - Faster counter-rotation (20s) */}
          <g style={{ transformOrigin: "256px 256px" }}>
            <circle
              className="anim-nebula2"
              cx="350"
              cy="350"
              r="280"
              fill="url(#nebula2)"
              style={{ mixBlendMode: "screen" }}
            />
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="360 256 256"
              to="0 256 256"
              dur="20s"
              repeatCount="indefinite"
            />
          </g>

          {/* 4. Stars */}
          <g fill="#ffffff">
            {/* Static Stars */}
            <circle cx="200" cy="150" r="2" opacity="0.9" />
            <circle cx="100" cy="300" r="1.5" opacity="0.7" />
            <circle cx="350" cy="100" r="1.8" opacity="0.8" />
            <circle cx="400" cy="300" r="1.2" opacity="0.6" />
            <circle cx="280" cy="380" r="2" opacity="0.7" />
            <circle cx="150" cy="400" r="1.2" opacity="0.5" />
            <circle cx="300" cy="200" r="1.2" opacity="0.6" />

            {/* Pulsing/Twinkling Stars Group 1 */}
            <g className="anim-stars1">
              <circle cx="256" cy="256" r="2" />
              <circle cx="120" cy="180" r="1.5" />
              <circle cx="380" cy="350" r="1.8" />
              <circle cx="320" cy="160" r="1.2" />
            </g>
            {/* Pulsing/Twinkling Stars Group 2 */}
            <g className="anim-stars2">
              <circle cx="180" cy="280" r="1.5" />
              <circle cx="300" cy="120" r="1" />
              <circle cx="420" cy="220" r="1.5" />
            </g>
          </g>

          {/* 5. Inner Shadow (For 3D depth at edges) */}
          <circle
            cx="256"
            cy="256"
            r="200"
            fill="none"
            stroke="url(#deepSpace)"
            strokeWidth="40"
            opacity="0.6"
          />

          {/* 6. Specular Highlight (Glass Gloss) */}
          <ellipse
            className="anim-shine"
            cx="200"
            cy="150"
            rx="160"
            ry="120"
            fill="url(#glassShine)"
            transform="rotate(-45, 200, 150)"
          />
        </g>
        {/* End of Sphere Clip */}

        {/* Fine Border Ring */}
        <circle
          cx="256"
          cy="256"
          r="200"
          fill="none"
          stroke="#6d58a6"
          strokeWidth="1.5"
          opacity="0.3"
        />
      </g>
    </svg>
  );
}
