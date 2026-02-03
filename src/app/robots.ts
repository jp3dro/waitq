import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://waitq.app';

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/dashboard/',
                '/api/',
                '/auth/',
                '/profile/',
                '/settings/',
                '/business/',
                '/locations/',
                '/subscriptions/',
                '/notifications/',
                '/lists/',
                '/customers/',
                '/admin/',
            ],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
