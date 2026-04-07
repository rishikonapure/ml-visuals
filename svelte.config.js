import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter({
      // SPA fallback — lets dynamic routes like /[algo] work client-side
      fallback: 'index.html'
    })
  }
};

export default config;
