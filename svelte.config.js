import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter({
      runtime: 'nodejs22.x'  // stable Node.js runtime on Vercel
    })
  }
};

export default config;
