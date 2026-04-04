import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api/', '/dashboard', '/apply', '/auth', '/login'],
    },
    sitemap: 'https://seisly.com/sitemap.xml',
  }
}
