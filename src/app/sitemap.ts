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
        .map((edge) => {
            const node = edge?.node;
            const seo = node?.seo as any;
            // Use custom slug if set, otherwise use filename
            const slug = seo?.slug || node?._sys.filename;
            return {
                url: `${baseUrl}/features/${slug}`,
                lastModified: new Date(),
                changeFrequency: 'weekly' as const,
                priority: 0.7,
            };
        });

    const landingPages = (landingPagesData.data.landingPageConnection.edges || [])
        .filter((edge) => (edge?.node?.seo as any)?.indexable !== false)
        .map((edge) => {
            const node = edge?.node;
            const seo = node?.seo as any;
            // Use custom slug if set, otherwise use filename
            const slug = seo?.slug || node?._sys.filename;
            return {
                url: `${baseUrl}/${slug}`,
                lastModified: new Date(),
                changeFrequency: 'weekly' as const,
                priority: 0.8,
            };
        });

    const legalPages = (legalPagesData.data.termsConnection.edges || [])
        .filter((edge) => (edge?.node?.seo as any)?.indexable !== false)
        .map((edge) => {
            const node = edge?.node;
            const seo = node?.seo as any;
            // Use custom slug if set, otherwise use filename
            const slug = seo?.slug || node?._sys.filename;
            return {
                url: `${baseUrl}/${slug}`,
                lastModified: new Date(),
                changeFrequency: 'monthly' as const,
                priority: 0.3,
            };
        });

    const aboutPages = (aboutData.data.aboutConnection.edges || [])
        .filter((edge) => (edge?.node?.seo as any)?.indexable !== false)
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
