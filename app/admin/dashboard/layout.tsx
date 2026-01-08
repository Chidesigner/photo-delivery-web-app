// app/admin/dashboard/layout.tsx

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="max-w-7xl mx-auto">{children}</div>
}
