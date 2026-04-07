// Disable SSR globally — this app uses Canvas, D3, and Scrollama
// which are browser-only and crash Vercel's Node.js serverless runtime.
export const ssr = false;
