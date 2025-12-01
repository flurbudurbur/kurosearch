// Pre-render is enabled by default - routes can disable it if needed
// SSR is now enabled by default for pre-rendering to work
// Routes that need client-only rendering should set ssr = false in their own +page.ts
export const prerender = true;
