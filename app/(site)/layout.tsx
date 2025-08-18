import LayoutClient from "./layout-client"

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  // Wrap the site pages with client providers without altering the global app/layout.tsx
  return <LayoutClient>{children}</LayoutClient>
}
