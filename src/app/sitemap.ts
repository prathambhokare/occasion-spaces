import { MetadataRoute } from 'next';
import { getSpaces } from '@/lib/db';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://occasionspaces.app';
  
  let dynamicSpaces: MetadataRoute.Sitemap = [];
  try {
    const spaces = getSpaces({ status: 'all' });
    dynamicSpaces = spaces
      .filter((s) => s.visibility === 'public')
      .map((s) => ({
        url: `${baseUrl}/spaces/${s.id}`,
        lastModified: new Date(s.updatedAt || s.createdAt),
        changeFrequency: 'hourly' as const,
        priority: 0.8,
      }));
  } catch (err) {
    console.error('Error generating sitemap dynamic spaces:', err);
  }

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/spaces/new`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    ...dynamicSpaces,
  ];
}

