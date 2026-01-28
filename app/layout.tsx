import "./globals.css"
import { Toaster } from "react-hot-toast"
import type { Metadata } from "next"

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  
  // Basic Meta Tags
  title: "A2Studios - Professional Photography Services in Nigeria",
  description: "A2Studios offers professional photography services for weddings, portraits, events, graduations, and corporate photography in Nigeria. Book your session today.",
  
  // Keywords for SEO
  keywords: [
    "A2Studios",
    "photography Nigeria",
    "wedding photography",
    "portrait photography",
    "event photography",
    "professional photographer Nigeria",
    "Lagos photographer",
    "photography services",
    "photo delivery",
    "client gallery"
  ],
  
  // Author & Creator
  authors: [{ name: "A2Studios" }],
  creator: "A2Studios",
  publisher: "A2Studios",
  
  // Open Graph (for social media sharing)
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "https://a2studios.com.ng", // UPDATE THIS with your actual domain
    title: "A2Studios - Professional Photography Services",
    description: "Professional photography for weddings, portraits, events, and more in Nigeria.",
    siteName: "A2Studios",
    images: [
      {
        url: "/a2-logo.png", // UPDATE with actual OG image
        width: 1200,
        height: 630,
        alt: "A2Studios Photography",
      },
    ],
  },
  
  // Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "A2Studios - Professional Photography Services",
    description: "Professional photography for weddings, portraits, events, and more in Nigeria.",
    images: ["/a2-logo.png"], // UPDATE with actual image
    creator: "https://www.instagram.com/shotbya2/", // UPDATE with your Twitter handle
  },
  
  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  
  // Verification (add these when you set up Google Search Console)
  // verification: {
  //   google: "your-google-verification-code",
  // },
  
  // Additional
  category: "Photography",
  alternates: {
    canonical: "https://a2studios.com.ng", // UPDATE with your domain
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Favicon */}
        <link rel="icon" href="/icon.png" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        
        {/* Additional SEO */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="format-detection" content="telephone=no" />
        <meta httpEquiv="x-ua-compatible" content="ie=edge" />
        
        {/* Schema.org markup for Google */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LocalBusiness",
              "name": "A2Studios",
              "description": "Professional photography services for weddings, portraits, events, and more in Nigeria",
              "image": "/a2-logo.png",
              "url": "https://a2studios.com.ng", // UPDATE
              "telephone": "+234 913 230 9954", // UPDATE with real phone
              "email": "a2studios002@gmail.com", // UPDATE with real email
              "address": {
                "@type": "PostalAddress",
                "addressCountry": "NG",
                "addressRegion": "Lagos", // UPDATE with actual location
              },
              "priceRange": "₦₦-₦₦₦",
              "openingHours": "Mo-Sa 09:00-18:00",
              "sameAs": [
                "https://www.instagram.com/shotbya2/" // UPDATE with real social links
              ]
            })
          }}
        />
      </head>
      <body className="bg-background text-foreground min-h-screen">
        {children}
        {/* Toast notifications */}
        <Toaster position="top-right" />
      </body>
    </html>
  )
}