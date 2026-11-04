import type { SVGProps } from "react";
const base = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
export const HomeIcon = (p: SVGProps<SVGSVGElement>) => (<svg {...base} {...p}><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /></svg>);
export const CarIcon = (p: SVGProps<SVGSVGElement>) => (<svg {...base} {...p}><path d="M5 16V11l2-5h10l2 5v5" /><path d="M3 16h18v3H3z" /><circle cx="7.5" cy="13.5" r="0.8" /><circle cx="16.5" cy="13.5" r="0.8" /></svg>);
export const UserIcon = (p: SVGProps<SVGSVGElement>) => (<svg {...base} {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>);
export const WonIcon = (p: SVGProps<SVGSVGElement>) => (<svg {...base} {...p}><path d="M3 6l3.5 12L12 8l5.5 10L21 6" /><path d="M3 11h18M4 14h16" /></svg>);
export const ChatIcon = (p: SVGProps<SVGSVGElement>) => (<svg {...base} {...p}><path d="M4 5h16v11H9l-5 4z" /></svg>);
