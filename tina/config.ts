import { defineConfig } from "tinacms";

// Your hosting provider likely exposes this as an environment variable
const branch =
  process.env.GITHUB_BRANCH ||
  process.env.VERCEL_GIT_COMMIT_REF ||
  process.env.HEAD ||
  "main";

export default defineConfig({
  branch,

  // Get this from tina.io
  clientId: process.env.NEXT_PUBLIC_TINA_CLIENT_ID,
  // Get this from tina.io
  token: process.env.TINA_TOKEN,

  build: {
    outputFolder: "admin",
    publicFolder: "public",
  },
  media: {
    tina: {
      mediaRoot: "images",
      publicFolder: "public",
    },
  },
  schema: {
    collections: [
      // ============================================
      // HOME PAGE
      // ============================================
      {
        name: "home",
        label: "Home Page",
        path: "content/pages",
        format: "json",
        ui: {
          allowedActions: {
            create: false,
            delete: false,
          },
          router: () => `/`,
        },
        match: {
          include: "home",
        },
        fields: [
          // Hero Section
          {
            type: "object",
            name: "hero",
            label: "Hero Section",
            fields: [
              {
                type: "string",
                name: "title",
                label: "Title",
                required: true,
              },
              {
                type: "string",
                name: "subtitle",
                label: "Subtitle",
                ui: {
                  component: "textarea",
                },
              },
              {
                type: "string",
                name: "primaryCta",
                label: "Primary CTA Text",
              },
              {
                type: "string",
                name: "primaryCtaLink",
                label: "Primary CTA Link",
              },
              {
                type: "string",
                name: "secondaryCta",
                label: "Secondary CTA Text",
              },
              {
                type: "string",
                name: "videoId",
                label: "YouTube Video ID",
              },
            ],
          },
          // Problem/Solution Section
          {
            type: "object",
            name: "problems",
            label: "Problems Section",
            fields: [
              {
                type: "string",
                name: "title",
                label: "Section Title",
              },
              {
                type: "string",
                name: "subtitle",
                label: "Section Subtitle",
              },
              {
                type: "object",
                name: "items",
                label: "Problem Items",
                list: true,
                ui: {
                  itemProps: (item) => ({ label: item?.title }),
                },
                fields: [
                  { type: "string", name: "title", label: "Title" },
                  { type: "string", name: "description", label: "Description" },
                  { type: "string", name: "icon", label: "Icon (lucide icon name)" },
                ],
              },
            ],
          },
          // Features Section
          {
            type: "object",
            name: "features",
            label: "Features Section",
            fields: [
              {
                type: "string",
                name: "title",
                label: "Section Title",
              },
              {
                type: "object",
                name: "items",
                label: "Feature Items",
                list: true,
                ui: {
                  itemProps: (item) => ({ label: item?.title }),
                },
                fields: [
                  { type: "string", name: "title", label: "Title" },
                  { type: "string", name: "description", label: "Description" },
                  { type: "string", name: "icon", label: "Icon (lucide icon name)" },
                ],
              },
            ],
          },
          // Social Proof Section
          {
            type: "object",
            name: "socialProof",
            label: "Social Proof Section",
            fields: [
              {
                type: "string",
                name: "title",
                label: "Section Title",
              },
              {
                type: "object",
                name: "stats",
                label: "Statistics",
                list: true,
                ui: {
                  itemProps: (item) => ({ label: item?.label }),
                },
                fields: [
                  { type: "string", name: "value", label: "Value" },
                  { type: "string", name: "label", label: "Label" },
                ],
              },
              {
                type: "object",
                name: "testimonial",
                label: "Testimonial",
                fields: [
                  { type: "string", name: "quote", label: "Quote", ui: { component: "textarea" } },
                  { type: "string", name: "author", label: "Author" },
                  { type: "string", name: "role", label: "Role/Title" },
                ],
              },
            ],
          },
          // FAQ Section
          {
            type: "object",
            name: "faq",
            label: "FAQ Section",
            fields: [
              {
                type: "string",
                name: "title",
                label: "Section Title",
              },
              {
                type: "object",
                name: "items",
                label: "FAQ Items",
                list: true,
                ui: {
                  itemProps: (item) => ({ label: item?.question }),
                },
                fields: [
                  { type: "string", name: "question", label: "Question" },
                  { type: "string", name: "answer", label: "Answer", ui: { component: "textarea" } },
                ],
              },
            ],
          },
          // SEO
          {
            type: "object",
            name: "seo",
            label: "SEO Settings",
            fields: [
              { type: "string", name: "title", label: "Meta Title" },
              { type: "string", name: "description", label: "Meta Description", ui: { component: "textarea" } },
              { type: "image", name: "ogImage", label: "Open Graph Image" },
            ],
          },
        ],
      },
      // ============================================
      // PRICING PAGE
      // ============================================
      {
        name: "pricing",
        label: "Pricing Page",
        path: "content/pages",
        format: "json",
        ui: {
          allowedActions: {
            create: false,
            delete: false,
          },
          router: () => `/pricing`,
        },
        match: {
          include: "pricing",
        },
        fields: [
          {
            type: "object",
            name: "hero",
            label: "Hero Section",
            fields: [
              { type: "string", name: "title", label: "Title" },
              { type: "string", name: "subtitle", label: "Subtitle" },
            ],
          },
          {
            type: "object",
            name: "socialProof",
            label: "Social Proof Section",
            fields: [
              { type: "string", name: "title", label: "Section Title" },
              {
                type: "object",
                name: "stats",
                label: "Statistics",
                list: true,
                ui: {
                  itemProps: (item) => ({ label: item?.label }),
                },
                fields: [
                  { type: "string", name: "value", label: "Value" },
                  { type: "string", name: "label", label: "Label" },
                ],
              },
              {
                type: "object",
                name: "testimonial",
                label: "Testimonial",
                fields: [
                  { type: "string", name: "quote", label: "Quote", ui: { component: "textarea" } },
                  { type: "string", name: "author", label: "Author" },
                  { type: "string", name: "role", label: "Role/Title" },
                ],
              },
            ],
          },
          {
            type: "object",
            name: "faq",
            label: "FAQ Section",
            fields: [
              { type: "string", name: "title", label: "Section Title" },
              {
                type: "object",
                name: "items",
                label: "FAQ Items",
                list: true,
                ui: {
                  itemProps: (item) => ({ label: item?.question }),
                },
                fields: [
                  { type: "string", name: "question", label: "Question" },
                  { type: "string", name: "answer", label: "Answer", ui: { component: "textarea" } },
                ],
              },
            ],
          },
          {
            type: "object",
            name: "seo",
            label: "SEO Settings",
            fields: [
              { type: "string", name: "title", label: "Meta Title" },
              { type: "string", name: "description", label: "Meta Description", ui: { component: "textarea" } },
              { type: "image", name: "ogImage", label: "Open Graph Image" },
            ],
          },
        ],
      },
      // ============================================
      // FEATURE PAGES
      // ============================================
      {
        name: "feature",
        label: "Feature Pages",
        path: "content/features",
        format: "json",
        ui: {
          router: ({ document }) => `/features/${document._sys.filename}`,
        },
        fields: [
          { type: "string", name: "slug", label: "URL Slug", required: true },
          // Hero Section
          {
            type: "object",
            name: "hero",
            label: "Hero Section",
            fields: [
              { type: "string", name: "title", label: "Title", required: true },
              { type: "string", name: "subtitle", label: "Subtitle", ui: { component: "textarea" } },
              { type: "string", name: "primaryCta", label: "Primary CTA Text" },
              { type: "string", name: "primaryCtaLink", label: "Primary CTA Link" },
              { type: "string", name: "secondaryCta", label: "Secondary CTA Text" },
              { type: "image", name: "heroImage", label: "Hero Image" },
            ],
          },
          // Content Sections (flexible)
          {
            type: "object",
            name: "sections",
            label: "Content Sections",
            list: true,
            templates: [
              {
                name: "textWithImage",
                label: "Text with Image",
                ui: {
                  itemProps: (item) => ({ label: item?.title || "Text with Image" }),
                },
                fields: [
                  { type: "string", name: "title", label: "Title" },
                  { type: "string", name: "description", label: "Description", ui: { component: "textarea" } },
                  { type: "image", name: "image", label: "Image" },
                  { type: "boolean", name: "imageOnRight", label: "Image on Right Side" },
                  {
                    type: "object",
                    name: "bullets",
                    label: "Bullet Points",
                    list: true,
                    fields: [
                      { type: "string", name: "text", label: "Text" },
                    ],
                  },
                ],
              },
              {
                name: "featureGrid",
                label: "Feature Grid",
                ui: {
                  itemProps: (item) => ({ label: item?.title || "Feature Grid" }),
                },
                fields: [
                  { type: "string", name: "title", label: "Section Title" },
                  { type: "string", name: "subtitle", label: "Section Subtitle" },
                  {
                    type: "object",
                    name: "features",
                    label: "Features",
                    list: true,
                    ui: {
                      itemProps: (item) => ({ label: item?.title }),
                    },
                    fields: [
                      { type: "string", name: "title", label: "Title" },
                      { type: "string", name: "description", label: "Description" },
                      { type: "string", name: "icon", label: "Icon (lucide icon name)" },
                    ],
                  },
                ],
              },
              {
                name: "howItWorks",
                label: "How It Works",
                ui: {
                  itemProps: (item) => ({ label: item?.title || "How It Works" }),
                },
                fields: [
                  { type: "string", name: "title", label: "Section Title" },
                  { type: "string", name: "subtitle", label: "Section Subtitle" },
                  {
                    type: "object",
                    name: "steps",
                    label: "Steps",
                    list: true,
                    ui: {
                      itemProps: (item) => ({ label: item?.title }),
                    },
                    fields: [
                      { type: "string", name: "title", label: "Title" },
                      { type: "string", name: "description", label: "Description" },
                      { type: "string", name: "icon", label: "Icon (lucide icon name)" },
                      { type: "string", name: "link", label: "Learn More Link" },
                      { type: "string", name: "linkText", label: "Link Text" },
                    ],
                  },
                ],
              },
              {
                name: "testimonial",
                label: "Testimonial",
                fields: [
                  { type: "string", name: "quote", label: "Quote", ui: { component: "textarea" } },
                  { type: "string", name: "author", label: "Author" },
                  { type: "string", name: "role", label: "Role/Title" },
                  { type: "image", name: "avatar", label: "Avatar" },
                ],
              },
              {
                name: "faq",
                label: "FAQ Section",
                ui: {
                  itemProps: () => ({ label: "FAQ Section" }),
                },
                fields: [
                  { type: "string", name: "title", label: "Section Title" },
                  {
                    type: "object",
                    name: "items",
                    label: "FAQ Items",
                    list: true,
                    ui: {
                      itemProps: (item) => ({ label: item?.question }),
                    },
                    fields: [
                      { type: "string", name: "question", label: "Question" },
                      { type: "string", name: "answer", label: "Answer", ui: { component: "textarea" } },
                    ],
                  },
                ],
              },
              {
                name: "socialProof",
                label: "Social Proof",
                fields: [
                  { type: "string", name: "title", label: "Section Title" },
                  {
                    type: "object",
                    name: "stats",
                    label: "Statistics",
                    list: true,
                    ui: {
                      itemProps: (item) => ({ label: item?.label }),
                    },
                    fields: [
                      { type: "string", name: "value", label: "Value" },
                      { type: "string", name: "label", label: "Label" },
                    ],
                  },
                ],
              },
            ],
          },
          // SEO
          {
            type: "object",
            name: "seo",
            label: "SEO Settings",
            fields: [
              { type: "string", name: "title", label: "Meta Title" },
              { type: "string", name: "description", label: "Meta Description", ui: { component: "textarea" } },
              { type: "image", name: "ogImage", label: "Open Graph Image" },
            ],
          },
        ],
      },
      // ============================================
      // RESTAURANT WAITLIST APP PAGE
      // ============================================
      {
        name: "restaurantPage",
        label: "Restaurant Waitlist App Page",
        path: "content/pages",
        format: "json",
        ui: {
          allowedActions: {
            create: false,
            delete: false,
          },
          router: () => `/restaurant-waitlist-app`,
        },
        match: {
          include: "restaurant-waitlist-app",
        },
        fields: [
          {
            type: "object",
            name: "hero",
            label: "Hero Section",
            fields: [
              { type: "string", name: "title", label: "Title" },
              { type: "string", name: "highlightedText", label: "Highlighted Text (muted)" },
              { type: "string", name: "subtitle", label: "Subtitle", ui: { component: "textarea" } },
              { type: "string", name: "ctaText", label: "CTA Button Text" },
              { type: "string", name: "ctaLink", label: "CTA Button Link" },
              { type: "string", name: "ctaSubtext", label: "CTA Subtext" },
            ],
          },
          {
            type: "object",
            name: "problems",
            label: "Problems Section",
            fields: [
              { type: "string", name: "title", label: "Section Title" },
              { type: "string", name: "subtitle", label: "Section Subtitle" },
              {
                type: "object",
                name: "items",
                label: "Problem Items",
                list: true,
                ui: {
                  itemProps: (item) => ({ label: item?.title }),
                },
                fields: [
                  { type: "string", name: "title", label: "Title" },
                  { type: "string", name: "description", label: "Description" },
                  { type: "string", name: "icon", label: "Icon (lucide icon name)" },
                ],
              },
            ],
          },
          {
            type: "object",
            name: "features",
            label: "Features Section",
            fields: [
              { type: "string", name: "title", label: "Section Title" },
              { type: "string", name: "subtitle", label: "Section Subtitle" },
              {
                type: "object",
                name: "items",
                label: "Feature Items",
                list: true,
                ui: {
                  itemProps: (item) => ({ label: item?.title }),
                },
                fields: [
                  { type: "string", name: "title", label: "Title" },
                  { type: "string", name: "description", label: "Description" },
                  { type: "string", name: "icon", label: "Icon (lucide icon name)" },
                ],
              },
            ],
          },
          {
            type: "object",
            name: "testimonial",
            label: "Testimonial",
            fields: [
              { type: "string", name: "quote", label: "Quote", ui: { component: "textarea" } },
              { type: "string", name: "author", label: "Author" },
              { type: "string", name: "role", label: "Role/Title" },
            ],
          },
          {
            type: "object",
            name: "seo",
            label: "SEO Settings",
            fields: [
              { type: "string", name: "title", label: "Meta Title" },
              { type: "string", name: "description", label: "Meta Description", ui: { component: "textarea" } },
              { type: "image", name: "ogImage", label: "Open Graph Image" },
            ],
          },
        ],
      },
      // ============================================
      // TERMS PAGE
      // ============================================
      {
        name: "terms",
        label: "Terms & Legal Pages",
        path: "content/legal",
        format: "mdx",
        ui: {
          router: ({ document }) => `/${document._sys.filename}`,
        },
        fields: [
          { type: "string", name: "title", label: "Page Title", isTitle: true, required: true },
          { type: "datetime", name: "lastUpdated", label: "Last Updated" },
          {
            type: "rich-text",
            name: "body",
            label: "Content",
            isBody: true,
          },
          {
            type: "object",
            name: "seo",
            label: "SEO Settings",
            fields: [
              { type: "string", name: "title", label: "Meta Title" },
              { type: "string", name: "description", label: "Meta Description", ui: { component: "textarea" } },
            ],
          },
        ],
      },
      // ============================================
      // GLOBAL SETTINGS
      // ============================================
      {
        name: "global",
        label: "Global Settings",
        path: "content/settings",
        format: "json",
        ui: {
          global: true,
          allowedActions: {
            create: false,
            delete: false,
          },
        },
        match: {
          include: "global",
        },
        fields: [
          {
            type: "object",
            name: "header",
            label: "Header",
            fields: [
              { type: "image", name: "logo", label: "Logo" },
              { type: "string", name: "siteName", label: "Site Name" },
              {
                type: "object",
                name: "navLinks",
                label: "Navigation Links",
                list: true,
                ui: {
                  itemProps: (item) => ({ label: item?.label }),
                },
                fields: [
                  { type: "string", name: "label", label: "Label" },
                  { type: "string", name: "href", label: "URL" },
                ],
              },
            ],
          },
          {
            type: "object",
            name: "footer",
            label: "Footer",
            fields: [
              { type: "string", name: "copyright", label: "Copyright Text" },
              {
                type: "object",
                name: "links",
                label: "Footer Links",
                list: true,
                ui: {
                  itemProps: (item) => ({ label: item?.label }),
                },
                fields: [
                  { type: "string", name: "label", label: "Label" },
                  { type: "string", name: "href", label: "URL" },
                ],
              },
              {
                type: "object",
                name: "social",
                label: "Social Links",
                list: true,
                ui: {
                  itemProps: (item) => ({ label: item?.platform }),
                },
                fields: [
                  { type: "string", name: "platform", label: "Platform" },
                  { type: "string", name: "url", label: "URL" },
                ],
              },
            ],
          },
          {
            type: "object",
            name: "cta",
            label: "Global CTA",
            fields: [
              { type: "string", name: "title", label: "Title" },
              { type: "string", name: "subtitle", label: "Subtitle" },
              { type: "string", name: "buttonText", label: "Button Text" },
              { type: "string", name: "buttonLink", label: "Button Link" },
            ],
          },
        ],
      },
    ],
  },
});
