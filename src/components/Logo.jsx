export default function Logo({ width = "120", height = "120", className = "" }) {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>
        <linearGradient id="grad2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>
        <linearGradient id="grad3" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        <linearGradient id="grad4" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="100%" stopColor="#064e3b" />
        </linearGradient>
      </defs>

      {/* Bar 1 (Shortest, Blue) */}
      <path 
        d="M 10,70 L 10,90 Q 10,95 15,95 L 30,95 L 30,70 Z" 
        fill="url(#grad1)" 
        stroke="white"
        strokeWidth="6"
        strokeLinejoin="round" 
      />
      <path 
        d="M 10,70 C 10,60 20,60 30,60 L 30,95 L 20,95 Q 10,95 10,90 Z" 
        fill="url(#grad1)" 
      />

      {/* Bar 2 (Medium, Light Blue/Teal) */}
      <path 
        d="M 33,50 C 33,40 43,40 53,40 L 53,95 L 43,95 Q 33,95 33,90 Z" 
        fill="url(#grad2)" 
      />

      {/* Bar 3 (Tall, Emerald Green) */}
      <path 
        d="M 56,30 C 56,20 66,20 76,20 L 76,95 L 66,95 Q 56,95 56,90 Z" 
        fill="url(#grad3)" 
      />

      {/* Bar 4 (Tallest, Dark Green) */}
      <path 
        d="M 79,10 C 79,0 89,0 99,0 L 99,95 L 89,95 Q 79,95 79,90 Z" 
        fill="url(#grad4)" 
      />
    </svg>
  );
}
