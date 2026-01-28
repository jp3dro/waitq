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
              {
                type: "string",
                name: "trustMessage",
                label: "Trust Message (below buttons)",
              },
            ],
          },
          // Intro Section (image + text below hero)
          {
            type: "object",
            name: "problems",
            label: "Intro Section",
            fields: [
              {
                type: "string",
                name: "title",
                label: "Section Title",
              },
              {
                type: "string",
                name: "description",
                label: "Description",
                ui: { component: "textarea" },
              },
              {
                type: "image",
                name: "image",
                label: "Image",
              },
            ],
          },
          // How It Works Section
          {
            type: "object",
            name: "howItWorks",
            label: "How It Works Section",
            fields: [
              {
                type: "string",
                name: "title",
                label: "Section Title",
              },
              {
                type: "object",
                name: "items",
                label: "Items",
                list: true,
                ui: {
                  itemProps: (item) => ({ label: item?.title }),
                },
                fields: [
                  { type: "string", name: "title", label: "Title" },
                  { type: "string", name: "description", label: "Description", ui: { component: "textarea" } },
                  { type: "image", name: "image", label: "Image" },
                  { type: "string", name: "link", label: "Link URL" },
                  { type: "string", name: "linkText", label: "Link Text" },
                ],
              },
            ],
          },
          // Benefits Section
          {
            type: "object",
            name: "benefits",
            label: "Benefits Section",
            fields: [
              {
                type: "string",
                name: "title",
                label: "Section Title",
              },
              {
                type: "object",
                name: "sections",
                label: "Benefit Sections",
                list: true,
                ui: {
                  itemProps: (item) => ({ label: item?.title }),
                },
                fields: [
                  { type: "string", name: "badge", label: "Badge Text (e.g., For owners)" },
                  { type: "string", name: "title", label: "Title" },
                  { type: "image", name: "image", label: "Image" },
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
            ],
          },
          // Product Showcase Section (Cards)
          {
            type: "object",
            name: "productShowcase",
            label: "Product Showcase Section",
            fields: [
              { type: "string", name: "title", label: "Section Title" },
              { type: "string", name: "subtitle", label: "Section Subtitle" },
              { type: "string", name: "ctaText", label: "CTA Link Text" },
              { type: "string", name: "ctaLink", label: "CTA Link URL" },
              {
                type: "object",
                name: "cards",
                label: "Cards",
                list: true,
                ui: {
                  itemProps: (item) => ({ label: item?.title }),
                },
                fields: [
                  { type: "string", name: "title", label: "Card Title" },
                  { type: "string", name: "description", label: "Card Description", ui: { component: "textarea" } },
                  { type: "image", name: "image", label: "Card Image" },
                ],
              },
            ],
          },
          // Competitive Advantage Section (Bento Box)
          {
            type: "object",
            name: "competitiveAdvantage",
            label: "Competitive Advantage Section",
            fields: [
              {
                type: "string",
                name: "title",
                label: "Section Title",
              },
              {
                type: "object",
                name: "items",
                label: "Bento Items (first 2 large, next 3 small)",
                list: true,
                ui: {
                  itemProps: (item) => ({ label: item?.title }),
                },
                fields: [
                  { type: "string", name: "title", label: "Title" },
                  { type: "string", name: "description", label: "Description", ui: { component: "textarea" } },
                  { type: "image", name: "image", label: "Image" },
                ],
              },
            ],
          },
          // Testimonial with Stats Section
          {
            type: "object",
            name: "testimonialWithStats",
            label: "Testimonial with Stats Section",
            fields: [
              { type: "string", name: "title", label: "Section Title" },
              { type: "string", name: "quote", label: "Quote", ui: { component: "textarea" } },
              { type: "string", name: "author", label: "Author Name" },
              { type: "string", name: "role", label: "Author Role" },
              { type: "image", name: "image", label: "Author Image" },
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
          // Global CTA Section
          {
            type: "object",
            name: "globalCta",
            label: "Bottom CTA Section",
            fields: [
              { type: "string", name: "title", label: "Title" },
              { type: "string", name: "subtitle", label: "Subtitle", ui: { component: "textarea" } },
              { type: "string", name: "primaryButtonText", label: "Primary Button Text" },
              { type: "string", name: "primaryButtonLink", label: "Primary Button Link" },
              { type: "string", name: "secondaryButtonText", label: "Secondary Button Text" },
              { type: "string", name: "secondaryButtonLink", label: "Secondary Button Link" },
              { type: "string", name: "trustMessage", label: "Trust Message" },
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
                  { type: "string", name: "variant", label: "Variant (default, muted-bg, card)" },
                  {
                    type: "object",
                    name: "bullets",
                    label: "Bullet Points",
                    list: true,
                    fields: [
                      { type: "string", name: "text", label: "Text" },
                      { type: "string", name: "icon", label: "Icon (lucide icon name, optional)" },
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
                      { type: "image", name: "image", label: "Step Image" },
                      { type: "string", name: "link", label: "Learn More Link" },
                      { type: "string", name: "linkText", label: "Link Text" },
                    ],
                  },
                ],
              },
              {
                name: "threeColumnCards",
                label: "Three Column Cards",
                ui: {
                  itemProps: (item) => ({ label: item?.title || "Three Column Cards" }),
                },
                fields: [
                  { type: "string", name: "title", label: "Section Title" },
                  { type: "string", name: "subtitle", label: "Section Subtitle" },
                  { type: "string", name: "variant", label: "Variant (default, with-image, icon-only, numbered)" },
                  { type: "number", name: "columns", label: "Number of columns (2 or 3)" },
                  {
                    type: "object",
                    name: "items",
                    label: "Card Items",
                    list: true,
                    ui: {
                      itemProps: (item) => ({ label: item?.title }),
                    },
                    fields: [
                      { type: "string", name: "title", label: "Title" },
                      { type: "string", name: "description", label: "Description", ui: { component: "textarea" } },
                      { type: "string", name: "icon", label: "Icon (lucide icon name)" },
                      { type: "image", name: "image", label: "Image" },
                      { type: "string", name: "link", label: "Link URL" },
                      { type: "string", name: "linkText", label: "Link Text" },
                    ],
                  },
                ],
              },
              {
                name: "testimonialWithStats",
                label: "Testimonial with Stats",
                ui: {
                  itemProps: () => ({ label: "Testimonial with Stats" }),
                },
                fields: [
                  { type: "string", name: "title", label: "Section Title" },
                  { type: "string", name: "quote", label: "Quote", ui: { component: "textarea" } },
                  { type: "string", name: "author", label: "Author" },
                  { type: "string", name: "role", label: "Role/Title" },
                  { type: "image", name: "image", label: "Background Image" },
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
              {
                name: "tabbedContent",
                label: "Tabbed Content",
                ui: {
                  itemProps: (item) => ({ label: item?.title || "Tabbed Content" }),
                },
                fields: [
                  { type: "string", name: "title", label: "Section Title" },
                  { type: "string", name: "subtitle", label: "Section Subtitle" },
                  { type: "string", name: "variant", label: "Tab Style (pills, underline, buttons)" },
                  {
                    type: "object",
                    name: "tabs",
                    label: "Tabs",
                    list: true,
                    ui: {
                      itemProps: (item) => ({ label: item?.label }),
                    },
                    fields: [
                      { type: "string", name: "id", label: "Tab ID" },
                      { type: "string", name: "label", label: "Tab Label" },
                      { type: "string", name: "title", label: "Content Title" },
                      { type: "string", name: "description", label: "Content Description", ui: { component: "textarea" } },
                      { type: "image", name: "image", label: "Content Image" },
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
                ],
              },
              {
                name: "statsRow",
                label: "Stats Row",
                ui: {
                  itemProps: () => ({ label: "Stats Row" }),
                },
                fields: [
                  { type: "string", name: "variant", label: "Variant (default, light, bordered)" },
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
              {
                name: "globalCta",
                label: "Global CTA Section",
                ui: {
                  itemProps: () => ({ label: "Global CTA" }),
                },
                fields: [
                  { type: "string", name: "title", label: "Title" },
                  { type: "string", name: "subtitle", label: "Subtitle", ui: { component: "textarea" } },
                  { type: "string", name: "primaryButtonText", label: "Primary Button Text" },
                  { type: "string", name: "primaryButtonLink", label: "Primary Button Link" },
                  { type: "string", name: "secondaryButtonText", label: "Secondary Button Text" },
                  { type: "string", name: "secondaryButtonLink", label: "Secondary Button Link" },
                  { type: "string", name: "trustMessage", label: "Trust Message" },
                ],
              },
              {
                name: "twoColumnBenefits",
                label: "Two Column Benefits (Two Cards Side by Side)",
                ui: {
                  itemProps: (item) => ({ label: item?.title || "Two Column Benefits" }),
                },
                fields: [
                  { type: "string", name: "title", label: "Section Title" },
                  { type: "string", name: "subtitle", label: "Section Subtitle" },
                  {
                    type: "object",
                    name: "cards",
                    label: "Benefit Cards (max 2)",
                    list: true,
                    ui: { itemProps: (item) => ({ label: item?.title }) },
                    fields: [
                      { type: "string", name: "badge", label: "Badge Text (optional)" },
                      { type: "string", name: "title", label: "Title" },
                      { type: "image", name: "image", label: "Image" },
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
              { type: "string", name: "subtitle", label: "Subtitle", ui: { component: "textarea" } },
              { type: "string", name: "primaryCta", label: "Primary CTA Text" },
              { type: "string", name: "primaryCtaLink", label: "Primary CTA Link" },
              { type: "string", name: "secondaryCta", label: "Secondary CTA Text" },
              { type: "string", name: "secondaryCtaLink", label: "Secondary CTA Link" },
              { type: "string", name: "trustMessage", label: "Trust Message (below buttons)" },
            ],
          },
          {
            type: "object",
            name: "intro",
            label: "Intro Section",
            fields: [
              { type: "string", name: "title", label: "Section Title" },
              { type: "string", name: "description", label: "Description", ui: { component: "textarea" } },
              { type: "image", name: "image", label: "Image" },
            ],
          },
          {
            type: "object",
            name: "howItWorks",
            label: "How It Works Section",
            fields: [
              { type: "string", name: "title", label: "Section Title" },
              {
                type: "object",
                name: "items",
                label: "Steps",
                list: true,
                ui: { itemProps: (item) => ({ label: item?.title }) },
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
            name: "benefits",
            label: "Benefits Section (Steps)",
            fields: [
              { type: "string", name: "title", label: "Section Title" },
              {
                type: "object",
                name: "steps",
                label: "Steps",
                list: true,
                ui: { itemProps: (item) => ({ label: item?.title }) },
                fields: [
                  { type: "number", name: "stepNumber", label: "Step Number" },
                  { type: "string", name: "title", label: "Title" },
                  {
                    type: "object",
                    name: "bullets",
                    label: "Bullet Points",
                    list: true,
                    fields: [
                      { type: "string", name: "text", label: "Text" },
                    ],
                  },
                  { type: "string", name: "link", label: "Link URL" },
                  { type: "string", name: "linkText", label: "Link Text" },
                  { type: "image", name: "image", label: "Image" },
                ],
              },
            ],
          },
          {
            type: "object",
            name: "beforeAfter",
            label: "Before/After Comparison",
            fields: [
              { type: "string", name: "title", label: "Section Title" },
              { type: "string", name: "subtitle", label: "Section Subtitle" },
              { type: "string", name: "beforeTitle", label: "Before Column Title" },
              { type: "string", name: "afterTitle", label: "After Column Title" },
              {
                type: "object",
                name: "beforeItems",
                label: "Before Items",
                list: true,
                ui: { itemProps: (item) => ({ label: item?.title }) },
                fields: [
                  { type: "string", name: "title", label: "Title" },
                  { type: "string", name: "description", label: "Description" },
                  { type: "string", name: "icon", label: "Icon (lucide icon name)" },
                ],
              },
              {
                type: "object",
                name: "afterItems",
                label: "After Items",
                list: true,
                ui: { itemProps: (item) => ({ label: item?.title }) },
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
            name: "whyLove",
            label: "Why Love Section (Bento)",
            fields: [
              { type: "string", name: "title", label: "Section Title" },
              {
                type: "object",
                name: "items",
                label: "Bento Items (first 2 large, next 3 small)",
                list: true,
                ui: { itemProps: (item) => ({ label: item?.title }) },
                fields: [
                  { type: "string", name: "title", label: "Title" },
                  { type: "string", name: "description", label: "Description" },
                  { type: "image", name: "image", label: "Image" },
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
            name: "globalCta",
            label: "Bottom CTA Section",
            fields: [
              { type: "string", name: "title", label: "Title" },
              { type: "string", name: "subtitle", label: "Subtitle", ui: { component: "textarea" } },
              { type: "string", name: "primaryButtonText", label: "Primary Button Text" },
              { type: "string", name: "primaryButtonLink", label: "Primary Button Link" },
              { type: "string", name: "secondaryButtonText", label: "Secondary Button Text" },
              { type: "string", name: "secondaryButtonLink", label: "Secondary Button Link" },
              { type: "string", name: "trustMessage", label: "Trust Message" },
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
      // ABOUT PAGE
      // ============================================
      {
        name: "about",
        label: "About Page",
        path: "content/pages",
        format: "json",
        ui: {
          allowedActions: {
            create: false,
            delete: false,
          },
          router: () => `/about`,
        },
        match: {
          include: "about",
        },
        fields: [
          {
            type: "object",
            name: "hero",
            label: "Hero Section",
            fields: [
              { type: "string", name: "title", label: "Title" },
              { type: "string", name: "subtitle", label: "Subtitle", ui: { component: "textarea" } },
            ],
          },
          {
            type: "object",
            name: "intro",
            label: "Introduction Section",
            fields: [
              { type: "string", name: "title", label: "Title" },
              { type: "string", name: "description", label: "Description", ui: { component: "textarea" } },
              { type: "image", name: "image", label: "Image" },
              {
                type: "object",
                name: "bullets",
                label: "Key Points",
                list: true,
                fields: [
                  { type: "string", name: "text", label: "Text" },
                ],
              },
            ],
          },
          {
            type: "object",
            name: "mission",
            label: "Mission Section",
            fields: [
              { type: "string", name: "title", label: "Title" },
              {
                type: "object",
                name: "paragraphs",
                label: "Paragraphs",
                list: true,
                fields: [
                  { type: "string", name: "text", label: "Text", ui: { component: "textarea" } },
                ],
              },
            ],
          },
          {
            type: "object",
            name: "principles",
            label: "Guiding Principles",
            fields: [
              { type: "string", name: "title", label: "Section Title" },
              {
                type: "object",
                name: "items",
                label: "Principles",
                list: true,
                ui: {
                  itemProps: (item) => ({ label: item?.title }),
                },
                fields: [
                  { type: "string", name: "title", label: "Title" },
                  { type: "string", name: "description", label: "Description", ui: { component: "textarea" } },
                  { type: "image", name: "image", label: "Screenshot Image" },
                ],
              },
            ],
          },
          {
            type: "object",
            name: "howWeOperate",
            label: "How We Operate",
            fields: [
              { type: "string", name: "title", label: "Section Title" },
              { type: "string", name: "description", label: "Section Description", ui: { component: "textarea" } },
              {
                type: "object",
                name: "items",
                label: "Operation Items",
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
