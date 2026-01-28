"use client"

import AdminGuard from "@/components/AdminGaurd"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import toast from "react-hot-toast"

interface Booking {
  id: string
  name: string
  email: string
  phone: string
  event_type: string
  event_date: string
  message: string
  budget: string
  status: string
  created_at: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'pending' | 'contacted' | 'all'>('pending')
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [deletingBooking, setDeletingBooking] = useState<string | null>(null)

  const fetchBookings = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      toast.error("Failed to load bookings")
      console.error(error)
    } else {
      setBookings(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  const updateBookingStatus = async (id: string, status: string) => {
    setUpdatingStatus(id)
    const { error } = await supabase
      .from("bookings")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) {
      toast.error("Failed to update status")
      setUpdatingStatus(null)
      return
    }

    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status } : b))
    )
    setUpdatingStatus(null)
    toast.success(`Booking marked as ${status}`, {
      style: {
        background: '#059669',
        color: '#fff',
        borderRadius: '12px',
      }
    })
  }

  const deleteBooking = async (id: string, name: string) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-4 min-w-[280px] max-w-[350px]">
          <div>
            <p className="font-semibold text-[#1c1917] mb-1">Delete Booking?</p>
            <p className="text-sm text-[#78716c] leading-relaxed">
              Delete booking from <strong>{name}</strong>? This cannot be undone.
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
                setDeletingBooking(id)
                const { error } = await supabase
                  .from("bookings")
                  .delete()
                  .eq("id", id)

                if (error) {
                  toast.error("Failed to delete booking")
                  setDeletingBooking(null)
                  return
                }

                setBookings((prev) => prev.filter((b) => b.id !== id))
                setDeletingBooking(null)
                toast.success("Booking deleted", {
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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/admin/login")
  }

  const filteredBookings = bookings.filter(b => {
    if (activeTab === 'all') return true
    return b.status === activeTab
  })

  const pendingCount = bookings.filter(b => b.status === 'pending').length

  return (
    <AdminGuard>
      <div className="min-h-screen bg-[#fafaf9]">
        {/* Header */}
        <div className="bg-white border-b border-[#e7e5e4]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-6 md:py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-light text-[#1c1917] mb-2">A2Studios Dashboard</h1>
                <p className="text-sm md:text-base text-[#78716c]">Manage bookings and galleries</p>
              </div>

              <button
                onClick={handleLogout}
                className="px-5 md:px-6 py-2 md:py-2.5 bg-white border border-[#e7e5e4] text-[#2d2a26] rounded-xl hover:bg-[#fafaf9] transition-all duration-300 text-sm md:text-base"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-6 md:py-8">
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
            <button
              onClick={() => router.push("/admin/galleries")}
              className="group p-6 md:p-8 rounded-2xl bg-white border-2 border-[#e7e5e4] hover:border-[#c67b5c] transition-all duration-300 hover:shadow-lg text-left"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-[#c67b5c] to-[#8b9e87] flex items-center justify-center text-white">
                  <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <svg className="w-5 h-5 text-[#78716c] group-hover:text-[#c67b5c] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl font-medium mb-2 text-[#1c1917]">Galleries</h3>
              <p className="text-sm md:text-base text-[#78716c]">Manage client galleries</p>
            </button>

            <button
              onClick={() => router.push("/admin/galleries/create")}
              className="group p-6 md:p-8 rounded-2xl bg-white border-2 border-[#e7e5e4] hover:border-[#8b9e87] transition-all duration-300 hover:shadow-lg text-left"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-[#8b9e87] to-[#c67b5c] flex items-center justify-center text-white">
                  <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <svg className="w-5 h-5 text-[#78716c] group-hover:text-[#8b9e87] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <h3 className="text-xl md:text-2xl font-medium mb-2 text-[#1c1917]">New Gallery</h3>
              <p className="text-sm md:text-base text-[#78716c]">Create a client gallery</p>
            </button>

            <div className="sm:col-span-2 md:col-span-1 p-6 md:p-8 rounded-2xl bg-gradient-to-br from-[#c67b5c] to-[#8b9e87] text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                {pendingCount > 0 && (
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-white text-[#c67b5c] flex items-center justify-center font-bold text-xs md:text-sm">
                    {pendingCount}
                  </div>
                )}
              </div>
              <h3 className="text-xl md:text-2xl font-medium mb-2">New Bookings</h3>
              <p className="text-sm md:text-base text-white/80">
                {pendingCount > 0
                  ? `${pendingCount} pending ${pendingCount === 1 ? 'request' : 'requests'}`
                  : 'No pending requests'}
              </p>
            </div>
          </div>

          {/* Bookings Section */}
          <div className="bg-white rounded-2xl border border-[#e7e5e4] shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-[#e7e5e4]">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl md:text-2xl font-medium text-[#1c1917]">Booking Requests</h2>

                <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
                  {['pending', 'contacted', 'all'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab as any)}
                      className={`flex-shrink-0 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab
                          ? 'bg-[#2d2a26] text-white'
                          : 'bg-[#fafaf9] text-[#78716c] hover:bg-[#e7e5e4]'
                        }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      {tab === 'pending' && pendingCount > 0 && (
                        <span className="ml-2 px-2 py-0.5 rounded-full bg-[#c67b5c] text-white text-xs">
                          {pendingCount}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-[#e7e5e4] border-t-[#c67b5c] rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-[#78716c]">Loading bookings...</p>
                  </div>
                </div>
              ) : filteredBookings.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-full bg-[#c67b5c]/10 flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-[#c67b5c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-medium text-[#1c1917] mb-2">No {activeTab} bookings</h3>
                  <p className="text-[#78716c]">Booking requests will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="p-4 sm:p-6 rounded-xl border border-[#e7e5e4] hover:border-[#c67b5c] transition-all duration-300 hover:shadow-md"
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base sm:text-lg font-medium text-[#1c1917] mb-2 truncate">{booking.name}</h3>
                            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-3 text-xs sm:text-sm text-[#78716c]">
                              <span className="flex items-center gap-1 truncate">
                                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span className="truncate">{booking.email}</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                {booking.phone}
                              </span>
                            </div>
                          </div>
                          <span className={`flex-shrink-0 px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${booking.status === 'pending'
                              ? 'bg-[#fef3c7] text-[#92400e]'
                              : booking.status === 'contacted'
                                ? 'bg-[#dbeafe] text-[#1e40af]'
                                : 'bg-[#d1fae5] text-[#065f46]'
                            }`}>
                            {booking.status}
                          </span>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                          <div>
                            <span className="text-[#78716c]">Event Type:</span>
                            <p className="text-[#1c1917] font-medium capitalize">{booking.event_type}</p>
                          </div>
                          <div>
                            <span className="text-[#78716c]">Event Date:</span>
                            <p className="text-[#1c1917] font-medium">
                              {new Date(booking.event_date).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                          </div>
                        </div>

                        {booking.message && (
                          <div className="pt-2">
                            <span className="text-xs sm:text-sm text-[#78716c]">Message:</span>
                            <p className="text-sm sm:text-base text-[#1c1917] mt-1 break-words">{booking.message}</p>
                          </div>
                        )}

                        <div className="text-xs text-[#78716c]">
                          Received {new Date(booking.created_at).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-[#e7e5e4]">
                          {booking.status === 'pending' && (
                            <button
                              onClick={() => updateBookingStatus(booking.id, 'contacted')}
                              disabled={updatingStatus === booking.id}
                              className="w-full sm:w-auto px-4 py-2 bg-[#2d2a26] text-white rounded-lg hover:bg-[#3d3731] transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              {updatingStatus === booking.id ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  <span>Updating...</span>
                                </>
                              ) : (
                                'Mark Contacted'
                              )}
                            </button>
                          )}
                          {booking.status === 'contacted' && (
                            <button
                              onClick={() => updateBookingStatus(booking.id, 'booked')}
                              disabled={updatingStatus === booking.id}
                              className="w-full sm:w-auto px-4 py-2 bg-[#059669] text-white rounded-lg hover:bg-[#047857] transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              {updatingStatus === booking.id ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  <span>Updating...</span>
                                </>
                              ) : (
                                'Mark Booked'
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => deleteBooking(booking.id, booking.name)}
                            disabled={deletingBooking === booking.id}
                            className="w-full sm:w-auto px-4 py-2 bg-[#fef2f2] text-[#dc2626] border border-[#fecaca] rounded-lg hover:bg-[#fee2e2] transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {deletingBooking === booking.id ? (
                              <>
                                <div className="w-4 h-4 border-2 border-[#dc2626] border-t-transparent rounded-full animate-spin" />
                                <span>Deleting...</span>
                              </>
                            ) : (
                              'Delete'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminGuard>
  )
}