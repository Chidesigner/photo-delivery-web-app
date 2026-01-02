// app/admin/dashboard/layout.tsx

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <section className="p-6">
      {children}
    </section>
  )
}
