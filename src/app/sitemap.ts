import { MetadataRoute } from 'next';
import { client } from '../../tina/__generated__/client';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://waitq.app';

    // Fetch all content from TinaCMS
    const [
        featuresData,
        landingPagesData,
        legalPagesData,
        aboutData,
    ] = await Promise.all([
        client.queries.featureConnection(),
        client.queries.landingPageConnection(),
        client.queries.termsConnection(),
        client.queries.aboutConnection(),
    ]);

    const features = (featuresData.data.featureConnection.edges || [])
        .filter((edge) => (edge?.node?.seo as any)?.indexable !== false)
        .map((edge) => ({
            url: `${baseUrl}/features/${edge?.node?._sys.filename}`,
            lastModified: new Date(),
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        }));

    const landingPages = (landingPagesData.data.landingPageConnection.edges || [])
        .filter((edge) => (edge?.node?.seo as any)?.indexable !== false)
        .map((edge) => {
            const filename = edge?.node?._sys.filename;
            // The restaurant landing page might be at root if matched correctly in config
            return {
                url: `${baseUrl}/${filename}`,
                lastModified: new Date(),
                changeFrequency: 'weekly' as const,
                priority: 0.8,
            };
        });

    const legalPages = (legalPagesData.data.termsConnection.edges || [])
        .filter((edge) => (edge?.node?.seo as any)?.indexable !== false)
        .map((edge) => ({
            url: `${baseUrl}/${edge?.node?._sys.filename}`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.3,
        }));

    const aboutPages = (aboutData.data.aboutConnection.edges || [])
        .map((edge) => ({
            url: `${baseUrl}/about`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.5,
        }));

    // Static routes
    const routes = [
        '',
        '/pricing',
        '/login',
        '/signup',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    return [
        ...routes,
        ...features,
        ...landingPages,
        ...legalPages,
        ...aboutPages,
    ];
}
