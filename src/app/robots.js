// L'espace administrateur et les routes API ne doivent pas être indexés.
export default function robots() {
  return {
    rules: [{
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/dashboard', '/offer-analyzer', '/api/'],
    }],
  }
}
