export const demoMode = import.meta.env.MODE === 'demo'
  || (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('demo') === '1')
