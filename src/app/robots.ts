import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/platform-safety', '/my-occasions'],
    },
    sitemap: 'https://occasionspaces.app/sitemap.xml',
  };
}

