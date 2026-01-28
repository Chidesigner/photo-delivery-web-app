"use client"

import AdminGuard from "@/components/AdminGaurd"
import InvoiceModal from "@/components/InvoiceModal"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import toast from "react-hot-toast"
import { Input } from "@/components/ui/input"
import Switch from "@/components/ui/switch"

interface Gallery {
  id: string
  event_name: string
  client_email: string
  paid: boolean
  created_at: string
}

interface Invoice {
  id: string
  invoice_number: string
  total: number
  payment_status: string
}

export default function AdminGalleriesPage() {
  const router = useRouter()
  const [galleries, setGalleries] = useState<Gallery[]>([])
  const [invoices, setInvoices] = useState<{ [key: string]: Invoice }>({})
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [emailInput, setEmailInput] = useState("")
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [selectedGallery, setSelectedGallery] = useState<Gallery | null>(null)
  const [existingInvoice, setExistingInvoice] = useState<any>(null)
  const [updatingPaid, setUpdatingPaid] = useState<string | null>(null)
  const [updatingEmail, setUpdatingEmail] = useState<string | null>(null)
  const [copyingLink, setCopyingLink] = useState<string | null>(null)
  const [deletingGallery, setDeletingGallery] = useState<string | null>(null)

  /** Build client gallery URL */
  const getClientGalleryUrl = (id: string) => {
    if (typeof window === "undefined") return ""
    return `${window.location.origin}/client/gallery/${id}`
  }

  /** Copy gallery link */
  const copyGalleryLink = async (id: string) => {
    setCopyingLink(id)
    try {
      await navigator.clipboard.writeText(getClientGalleryUrl(id))
      toast.success("Client link copied to clipboard", {
        style: {
          background: '#059669',
          color: '#fff',
          borderRadius: '12px',
        }
      })
    } catch {
      toast.error("Failed to copy link")
    } finally {
      setCopyingLink(null)
    }
  }

  /** Fetch galleries and their invoices */
  const fetchGalleries = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("galleries")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      toast.error("Failed to load galleries")
      console.error(error)
    } else {
      setGalleries(data || [])

      // Fetch invoices for all galleries
      if (data && data.length > 0) {
        const galleryIds = data.map(g => g.id)
        const { data: invoiceData } = await supabase
          .from("invoices")
          .select("*")
          .in("gallery_id", galleryIds)

        if (invoiceData) {
          const invoiceMap: { [key: string]: Invoice } = {}
          invoiceData.forEach(inv => {
            invoiceMap[inv.gallery_id] = inv
          })
          setInvoices(invoiceMap)
        }
      }
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchGalleries()
  }, [])

  /** Toggle paid status */
  const togglePaid = async (id: string, value: boolean) => {
    setUpdatingPaid(id)
    const { error } = await supabase
      .from("galleries")
      .update({ paid: value })
      .eq("id", id)

    if (error) {
      toast.error("Failed to update status")
      setUpdatingPaid(null)
      return
    }

    setGalleries((prev) =>
      prev.map((g) => (g.id === id ? { ...g, paid: value } : g))
    )
    setUpdatingPaid(null)
    toast.success(`Payment status ${value ? 'enabled' : 'disabled'}`, {
      style: {
        background: '#059669',
        color: '#fff',
        borderRadius: '12px',
      }
    })
  }

  /** Update email */
  const updateEmail = async (id: string) => {
    if (!emailInput || !emailInput.includes("@")) {
      toast.error("Enter a valid email")
      return
    }

    const normalizedEmail = emailInput.toLowerCase()
    setUpdatingEmail(id)

    const { error } = await supabase
      .from("galleries")
      .update({ client_email: normalizedEmail })
      .eq("id", id)

    if (error) {
      toast.error("Failed to update email")
      setUpdatingEmail(null)
      return
    }

    setGalleries((prev) =>
      prev.map((g) => (g.id === id ? { ...g, client_email: normalizedEmail } : g))
    )
    setEditingId(null)
    setUpdatingEmail(null)
    toast.success("Email updated successfully", {
      style: {
        background: '#059669',
        color: '#fff',
        borderRadius: '12px',
      }
    })
  }

  /** Open invoice modal */
  const openInvoiceModal = async (gallery: Gallery) => {
    setSelectedGallery(gallery)

    // Check if invoice already exists
    const { data } = await supabase
      .from("invoices")
      .select("*")
      .eq("gallery_id", gallery.id)
      .single()

    setExistingInvoice(data || null)
    setShowInvoiceModal(true)
  }

  /** Delete gallery */
  const deleteGallery = async (galleryId: string, galleryName: string) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-4 min-w-[280px] max-w-[350px]">
          <div>
            <p className="font-semibold text-[#1c1917] mb-1">Delete Gallery?</p>
            <p className="text-sm text-[#78716c] leading-relaxed">
              Delete <strong>{galleryName}</strong> and all photos? This cannot be undone.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-5 py-2 text-sm rounded-lg border border-[#e7e5e4] bg-white hover:bg-[#fafaf9] transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={async () => {
                toast.dismiss(t.id)
                setDeletingGallery(galleryId)
                // Delete associated invoice first
                await supabase.from("invoices").delete().eq("gallery_id", galleryId)

                // Then delete gallery
                const { error } = await supabase
                  .from("galleries")
                  .delete()
                  .eq("id", galleryId)

                if (error) {
                  toast.error("Failed to delete gallery")
                  setDeletingGallery(null)
                  return
                }

                setGalleries((prev) => prev.filter((g) => g.id !== galleryId))
                setDeletingGallery(null)
                toast.success("Gallery deleted successfully", {
                  style: {
                    background: '#059669',
                    color: '#fff',
                    borderRadius: '12px',
                  }
                })
              }}
              className="px-5 py-2 text-sm rounded-lg bg-[#dc2626] text-white hover:bg-[#b91c1c] transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      ),
      {
        duration: 8000,
        style: {
          background: '#fff',
          borderRadius: '16px',
          border: '1px solid #e7e5e4',
          padding: '20px',
        }
      }
    )
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-[#fafaf9]">
        {/* Header */}
        <div className="bg-white border-b border-[#e7e5e4]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-6 md:py-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-light text-[#1c1917] mb-2">Client Galleries</h1>
                <p className="text-sm md:text-base text-[#78716c]">Manage all client photo galleries</p>
              </div>

              <button
                onClick={() => router.push("/admin/galleries/create")}
                className="w-full sm:w-auto px-5 md:px-6 py-2 md:py-2.5 bg-gradient-to-br from-[#c67b5c] to-[#8b9e87] text-white rounded-xl hover:shadow-lg transition-all duration-300 font-medium text-sm md:text-base"
              >
                Create Gallery
              </button>
            </div>
          </div>
        </div>

        {/* Galleries List */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-6 md:py-8">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-[#e7e5e4] border-t-[#c67b5c] rounded-full animate-spin mx-auto mb-4" />
                <p className="text-[#78716c]">Loading galleries...</p>
              </div>
            </div>
          ) : galleries.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#e7e5e4] p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-[#c67b5c]/10 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#c67b5c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-[#1c1917] mb-2">No galleries yet</h3>
              <p className="text-[#78716c] mb-6">Create your first client gallery to get started</p>
              <button
                onClick={() => router.push("/admin/galleries/create")}
                className="px-6 py-2.5 bg-[#2d2a26] text-white rounded-xl hover:bg-[#3d3731] transition-all duration-300"
              >
                Create Gallery
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {galleries.map((g) => {
                const invoice = invoices[g.id]
                return (
                  <div
                    key={g.id}
                    className="bg-white rounded-2xl border border-[#e7e5e4] hover:border-[#c67b5c] transition-all duration-300 hover:shadow-lg overflow-hidden"
                  >
                    <div className="p-4 sm:p-6">
                      <div className="flex flex-col gap-4">
                        {/* Gallery Info Section */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <h2 className="text-lg sm:text-xl md:text-2xl font-medium text-[#1c1917] mb-2 truncate">
                                {g.event_name}
                              </h2>
                              {editingId === g.id ? (
                                <div className="flex flex-col gap-2 mt-2 w-full">
                                  <Input
                                    value={emailInput}
                                    onChange={(e) => setEmailInput(e.target.value)}
                                    className="w-full rounded-xl border-[#e7e5e4] focus:border-[#c67b5c] focus:ring-[#c67b5c] text-sm"
                                    placeholder="client@email.com"
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => updateEmail(g.id)}
                                      disabled={updatingEmail === g.id}
                                      className="flex-1 px-4 py-2 bg-[#059669] text-white rounded-xl hover:bg-[#047857] transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                      {updatingEmail === g.id ? (
                                        <>
                                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                          <span>Saving...</span>
                                        </>
                                      ) : (
                                        'Save'
                                      )}
                                    </button>
                                    <button
                                      onClick={() => setEditingId(null)}
                                      disabled={updatingEmail === g.id}
                                      className="flex-1 px-4 py-2 bg-white border border-[#e7e5e4] text-[#2d2a26] rounded-xl hover:bg-[#fafaf9] transition-colors text-sm disabled:opacity-50"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-[#78716c]">
                                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                  <span className="text-xs sm:text-sm truncate">{g.client_email}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-[10px] sm:text-xs text-[#78716c] mb-3">
                            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Created {new Date(g.created_at).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </div>

                          {/* Invoice badge */}
                          {invoice && (
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-br from-[#c67b5c]/10 to-[#8b9e87]/10 border border-[#c67b5c]/20">
                              <svg className="w-3.5 h-3.5 text-[#c67b5c] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span className="text-[10px] sm:text-xs font-medium text-[#c67b5c] truncate">
                                {invoice.invoice_number} • ₦{invoice.total.toLocaleString()} • {invoice.payment_status}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Actions Section - Mobile Optimized */}
                        <div className="flex flex-col gap-3 pt-4 border-t border-[#e7e5e4]">
                          {/* Payment Toggle */}
                          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#fafaf9] border border-[#e7e5e4]">
                            <span className="text-xs sm:text-sm font-medium text-[#1c1917]">
                              Payment Status
                            </span>
                            <div className="flex items-center gap-2">
                              {updatingPaid === g.id ? (
                                <div className="w-5 h-5 border-2 border-[#c67b5c] border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Switch
                                  checked={g.paid}
                                  onCheckedChange={(value) => togglePaid(g.id, value)}
                                  className="h-5 w-9 sm:h-6 sm:w-11"
                                />
                              )}
                              <span className={`text-[10px] sm:text-xs font-medium min-w-[50px] ${g.paid ? 'text-[#059669]' : 'text-[#78716c]'}`}>
                                {updatingPaid === g.id ? 'Updating...' : (g.paid ? 'Enabled' : 'Disabled')}
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <button
                              onClick={() => copyGalleryLink(g.id)}
                              disabled={copyingLink === g.id}
                              className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#fafaf9] border border-[#e7e5e4] hover:bg-white hover:border-[#c67b5c] transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Copy client link"
                            >
                              {copyingLink === g.id ? (
                                <>
                                  <div className="w-5 h-5 border-2 border-[#78716c] border-t-transparent rounded-full animate-spin mb-1" />
                                  <span className="text-xs font-medium text-[#78716c]">Copying...</span>
                                </>
                              ) : (
                                <>
                                  <svg className="w-5 h-5 text-[#78716c] group-hover:text-[#c67b5c] mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                  <span className="text-xs font-medium text-[#78716c] group-hover:text-[#c67b5c]">Copy</span>
                                </>
                              )}
                            </button>

                            <button
                              onClick={() => {
                                setEditingId(g.id)
                                setEmailInput(g.client_email)
                              }}
                              className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#fafaf9] border border-[#e7e5e4] hover:bg-white hover:border-[#c67b5c] transition-all duration-300 group"
                              title="Edit client email"
                            >
                              <svg className="w-5 h-5 text-[#78716c] group-hover:text-[#c67b5c] mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              <span className="text-xs font-medium text-[#78716c] group-hover:text-[#c67b5c]">Edit</span>
                            </button>

                            <button
                              onClick={() => openInvoiceModal(g)}
                              className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#fafaf9] border border-[#e7e5e4] hover:bg-white hover:border-[#c67b5c] transition-all duration-300 group"
                              title="Create/Edit invoice"
                            >
                              <svg className="w-5 h-5 text-[#78716c] group-hover:text-[#c67b5c] mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span className="text-xs font-medium text-[#78716c] group-hover:text-[#c67b5c]">Invoice</span>
                            </button>

                            <button
                              onClick={() => deleteGallery(g.id, g.event_name)}
                              className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#fef2f2] border border-[#fecaca] hover:bg-[#fee2e2] transition-all duration-300 group"
                              title="Delete gallery"
                            >
                              <svg className="w-5 h-5 text-[#dc2626] mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              <span className="text-xs font-medium text-[#dc2626]">Delete</span>
                            </button>
                          </div>

                          {/* Manage Button - Full Width */}
                          <button
                            onClick={() => router.push(`/admin/galleries/${g.id}/upload`)}
                            className="w-full px-6 py-3 rounded-xl bg-gradient-to-br from-[#2d2a26] to-[#3d3731] text-white hover:shadow-lg transition-all duration-300 font-medium text-sm sm:text-base"
                          >
                            Manage Gallery
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Invoice Modal */}
      {showInvoiceModal && selectedGallery && (
        <InvoiceModal
          galleryId={selectedGallery.id}
          galleryName={selectedGallery.event_name}
          clientEmail={selectedGallery.client_email}
          existingInvoice={existingInvoice}
          onClose={() => {
            setShowInvoiceModal(false)
            setSelectedGallery(null)
            setExistingInvoice(null)
          }}
          onSuccess={() => {
            fetchGalleries() // Reload to show new invoice
          }}
        />
      )}
    </AdminGuard>
  )
}