"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { supabase } from "@/lib/supabase"
import toast from "react-hot-toast"

export default function HomePage() {
  const router = useRouter()
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [bookingForm, setBookingForm] = useState({
    name: "",
    email: "",
    phone: "",
    eventType: "",
    eventDate: "",
    message: ""
  })

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const { error } = await supabase
        .from("bookings")
        .insert([{
          name: bookingForm.name,
          email: bookingForm.email,
          phone: bookingForm.phone,
          event_type: bookingForm.eventType,
          event_date: bookingForm.eventDate,
          message: bookingForm.message,
          status: "pending",
          created_at: new Date().toISOString()
        }])

      if (error) throw error

      toast.success("Booking request sent! We'll get back to you soon.", {
        duration: 5000,
        style: {
          background: '#059669',
          color: '#fff',
          borderRadius: '12px',
        }
      })

      setBookingForm({
        name: "",
        email: "",
        phone: "",
        eventType: "",
        eventDate: "",
        message: ""
      })
      setShowBookingModal(false)
    } catch (err: any) {
      toast.error(err.message || "Failed to send booking request")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#fafaf9]">
      {/* HEADER/NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-[#e7e5e4]/50">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Image
              src="/a2-logo.png"
              alt="A2Studios"
              width={60}
              height={60}
              className="w-12 h-12"
            />
            <span className="text-2xl font-light text-[#1c1917]">A2Studios</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#services" className="text-[#78716c] hover:text-[#c67b5c] transition-colors">Services</a>
            <a href="#portfolio" className="text-[#78716c] hover:text-[#c67b5c] transition-colors">Portfolio</a>
            <a href="#contact" className="text-[#78716c] hover:text-[#c67b5c] transition-colors">Contact</a>
            <button
              onClick={() => setShowBookingModal(true)}
              className="px-6 py-2.5 bg-[#2d2a26] text-white rounded-xl hover:bg-[#3d3731] transition-all duration-300 hover:scale-105"
            >
              Book Session
            </button>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative min-h-screen flex items-center justify-center px-6 md:px-12 pt-20 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute top-20 right-20 w-96 h-96 bg-[#c67b5c]/10 rounded-full blur-3xl animate-float"
            style={{ animationDelay: '0s' }}
          />
          <div
            className="absolute bottom-20 left-20 w-80 h-80 bg-[#8b9e87]/10 rounded-full blur-3xl animate-float"
            style={{ animationDelay: '1s' }}
          />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto text-center space-y-8">
          {/* Large logo */}
          <div className="flex justify-center mb-8 animate-scale-in">
            <Image
              src="/a2-logo.png"
              alt="A2Studios"
              width={200}
              height={200}
              className="w-32 h-32 md:w-48 md:h-48"
            />
          </div>

          <h1 className="text-4xl md:text-7xl font-light text-[#1c1917] leading-tight animate-slide-up stagger-1">
            Capturing Life's
            <br />
            <span className="text-gradient font-medium whitespace-nowrap">Beautiful Moments</span>
          </h1>

          <p className="text-lg md:text-2xl text-[#78716c] max-w-3xl mx-auto font-light leading-relaxed animate-slide-up stagger-2">
            Professional photography services for weddings, portraits, events, and more.
            Based in Nigeria, creating timeless memories.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 animate-slide-up stagger-3 w-full max-w-sm mx-auto sm:max-w-none">
            <button
              onClick={() => setShowBookingModal(true)}
              className="w-full sm:w-auto group relative px-8 py-4 bg-[#2d2a26] text-white rounded-xl font-medium text-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:scale-105"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                Book Your Session
                <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-[#c67b5c] to-[#8b9e87] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>

            <button
              onClick={() => document.getElementById('portfolio')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full sm:w-auto px-8 py-4 bg-white border-2 border-[#e7e5e4] text-[#2d2a26] rounded-xl font-medium text-lg hover:border-[#c67b5c] transition-all duration-300 hover:shadow-lg"
            >
              View Portfolio
            </button>
          </div>

          {/* Stats - Stacking on mobile */}
          <div className="grid grid-cols-1 xs:grid-cols-3 gap-6 sm:gap-8 pt-12 sm:pt-16 max-w-3xl mx-auto animate-fade-in stagger-4">
            {[
              { label: 'Happy Clients', value: '500+' },
              { label: 'Events Covered', value: '1000+' },
              { label: 'Years Experience', value: '5+' }
            ].map((stat, i) => (
              <div key={i} className="text-center p-4 sm:p-0 rounded-2xl bg-[#fafaf9] sm:bg-transparent border sm:border-0 border-[#e7e5e4]/50">
                <div className="text-2xl md:text-4xl font-light text-[#c67b5c] mb-1">{stat.value}</div>
                <div className="text-xs sm:text-sm text-[#78716c] uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-[#78716c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* SERVICES SECTION */}
      <section id="services" className="py-32 px-6 md:px-12 bg-white relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-16 bg-gradient-to-b from-transparent via-[#c67b5c] to-transparent" />

        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <span className="inline-block text-[#c67b5c] text-sm font-semibold tracking-wider uppercase mb-4">
              What We Offer
            </span>
            <h2 className="text-5xl md:text-6xl font-light text-[#1c1917] mb-6">
              Photography Services
            </h2>
            <p className="text-xl text-[#78716c] max-w-2xl mx-auto">
              Professional photography for every occasion
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: "💍",
                title: "Weddings",
                description: "Capture your special day with stunning wedding photography that tells your love story."
              },
              {
                icon: "👤",
                title: "Portraits",
                description: "Professional portrait sessions for individuals, couples, and families."
              },
              {
                icon: "🎉",
                title: "Events",
                description: "Corporate events, parties, and celebrations covered with professionalism."
              },
              {
                icon: "🎓",
                title: "Graduations",
                description: "Preserve your achievement with memorable graduation photography."
              },
              {
                icon: "💼",
                title: "Corporate",
                description: "Professional headshots and corporate event photography."
              },
              {
                icon: "📸",
                title: "Custom Sessions",
                description: "Specialized photography tailored to your unique needs."
              }
            ].map((service, i) => (
              <div
                key={i}
                className="group p-8 rounded-2xl bg-[#fafaf9] border border-[#e7e5e4] hover:border-[#c67b5c] transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  {service.icon}
                </div>
                <h3 className="text-2xl font-medium text-[#1c1917] mb-3">
                  {service.title}
                </h3>
                <p className="text-[#78716c] leading-relaxed">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PORTFOLIO SECTION */}
      <section id="portfolio" className="py-32 px-6 md:px-12 bg-[#fafaf9]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <span className="inline-block text-[#c67b5c] text-sm font-semibold tracking-wider uppercase mb-4">
              Our Work
            </span>
            <h2 className="text-5xl md:text-6xl font-light text-[#1c1917] mb-6">
              Recent Projects
            </h2>
            <p className="text-xl text-[#78716c] max-w-2xl mx-auto">
              A glimpse of the memories we've captured
            </p>
          </div>

          {/* Placeholder for portfolio - you'll add real images later */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div
                key={item}
                className="group relative aspect-square rounded-2xl bg-gradient-to-br from-[#c67b5c]/20 to-[#8b9e87]/20 overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-16 h-16 text-[#78716c]/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-[#78716c] italic">Portfolio images coming soon - add your best work here!</p>
          </div>
        </div>
      </section>

      {/* CONTACT SECTION */}
      <section id="contact" className="py-32 px-6 md:px-12 bg-gradient-to-br from-[#2d2a26] via-[#3d3731] to-[#2d2a26] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-5xl md:text-6xl font-light mb-6">
            Let's Create
            <br />
            <span className="text-gradient">Something Beautiful</span>
          </h2>
          <p className="text-xl text-white/70 mb-12 max-w-2xl mx-auto">
            Ready to book your session? Get in touch and let's discuss your photography needs.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12">
            <button
              onClick={() => setShowBookingModal(true)}
              className="group px-10 py-5 bg-white text-[#2d2a26] rounded-xl font-medium text-lg hover:bg-[#fafaf9] transition-all duration-300 hover:shadow-2xl hover:scale-105 inline-flex items-center gap-3"
            >
              Book Now
              <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-white/80">
            <a href="mailto:a2studios002@gmail.com" className="flex items-center gap-2 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              a2studios002@gmail.com
            </a>
            <a href="tel:+234 913 230 9954" className="flex items-center gap-2 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              +234 913 230 9954
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 px-6 bg-white border-t border-[#e7e5e4]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <Image
                src="/a2-logo.png"
                alt="A2Studios"
                width={40}
                height={40}
                className="w-10 h-10"
              />
              <span className="text-xl font-light text-[#1c1917]">A2Studios</span>
            </div>

            <div className="text-center text-[#78716c] text-sm">
              <p>© {new Date().getFullYear()} A2Studios. All rights reserved.</p>
            </div>

            <button
              onClick={() => router.push('/admin')}
              className="text-[#78716c] hover:text-[#c67b5c] text-xs transition-colors"
            >
              Admin
            </button>
          </div>
        </div>
      </footer>

      {/* BOOKING MODAL */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-2xl sm:text-3xl font-light text-[#1c1917] mb-2">Book Your Session</h3>
                  <p className="text-[#78716c] text-sm sm:text-base">Fill out the form and we'll get back to you soon</p>
                </div>
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="p-2 hover:bg-[#fafaf9] rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#78716c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleBookingSubmit} className="space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-[#1c1917] mb-2">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={bookingForm.name}
                      onChange={(e) => setBookingForm({ ...bookingForm, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[#e7e5e4] focus:border-[#c67b5c] focus:ring-2 focus:ring-[#c67b5c]/20 outline-none transition-all"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1c1917] mb-2">Email *</label>
                    <input
                      type="email"
                      required
                      value={bookingForm.email}
                      onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[#e7e5e4] focus:border-[#c67b5c] focus:ring-2 focus:ring-[#c67b5c]/20 outline-none transition-all"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-[#1c1917] mb-2">Phone *</label>
                    <input
                      type="tel"
                      required
                      value={bookingForm.phone}
                      onChange={(e) => setBookingForm({ ...bookingForm, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[#e7e5e4] focus:border-[#c67b5c] focus:ring-2 focus:ring-[#c67b5c]/20 outline-none transition-all"
                      placeholder="+234 913 230 9954"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#1c1917] mb-2">Event Type *</label>
                    <select
                      required
                      value={bookingForm.eventType}
                      onChange={(e) => setBookingForm({ ...bookingForm, eventType: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[#e7e5e4] focus:border-[#c67b5c] focus:ring-2 focus:ring-[#c67b5c]/20 outline-none transition-all"
                    >
                      <option value="">Select type</option>
                      <option value="wedding">Wedding</option>
                      <option value="portrait">Portrait</option>
                      <option value="event">Event</option>
                      <option value="graduation">Graduation</option>
                      <option value="corporate">Corporate</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-[#1c1917] mb-2">Event Date *</label>
                    <input
                      type="date"
                      required
                      value={bookingForm.eventDate}
                      onChange={(e) => setBookingForm({ ...bookingForm, eventDate: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[#e7e5e4] focus:border-[#c67b5c] focus:ring-2 focus:ring-[#c67b5c]/20 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1c1917] mb-2">Message</label>
                  <textarea
                    value={bookingForm.message}
                    onChange={(e) => setBookingForm({ ...bookingForm, message: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-[#e7e5e4] focus:border-[#c67b5c] focus:ring-2 focus:ring-[#c67b5c]/20 outline-none transition-all resize-none"
                    placeholder="Tell us more about your event..."
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowBookingModal(false)}
                    className="order-2 sm:order-1 flex-1 px-6 py-3.5 bg-white border-2 border-[#e7e5e4] text-[#2d2a26] rounded-xl hover:bg-[#fafaf9] transition-all duration-300 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="order-1 sm:order-2 flex-1 px-6 py-3.5 bg-[#2d2a26] text-white rounded-xl hover:bg-[#3d3731] transition-all duration-300 hover:scale-105 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}