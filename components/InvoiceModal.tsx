"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import toast from "react-hot-toast"

interface InvoiceModalProps {
  galleryId: string
  galleryName: string
  clientEmail: string
  onClose: () => void
  onSuccess: () => void
  existingInvoice?: any
}

export default function InvoiceModal({
  galleryId,
  galleryName,
  clientEmail,
  onClose,
  onSuccess,
  existingInvoice
}: InvoiceModalProps) {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    clientName: "",
    serviceDescription: `Photography Services - ${galleryName}`,
    subtotal: "",
    taxPercentage: "0",
    discountPercentage: "0",
    paymentStatus: "unpaid",
    amountPaid: "0",
    paymentMethod: "",
    notes: "",
    dueDate: "",
    issueDate: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    if (existingInvoice) {
      setForm({
        clientName: existingInvoice.client_name,
        serviceDescription: existingInvoice.service_description,
        subtotal: existingInvoice.subtotal.toString(),
        taxPercentage: existingInvoice.tax_percentage.toString(),
        discountPercentage: existingInvoice.discount_percentage.toString(),
        paymentStatus: existingInvoice.payment_status,
        amountPaid: existingInvoice.amount_paid.toString(),
        paymentMethod: existingInvoice.payment_method || "",
        notes: existingInvoice.notes || "",
        dueDate: existingInvoice.due_date || "",
        issueDate: existingInvoice.issue_date
      })
    }
  }, [existingInvoice])

  const calculateTotal = () => {
    const subtotal = parseFloat(form.subtotal) || 0
    const taxPercent = parseFloat(form.taxPercentage) || 0
    const discountPercent = parseFloat(form.discountPercentage) || 0

    const taxAmount = (subtotal * taxPercent) / 100
    const discountAmount = (subtotal * discountPercent) / 100
    const total = subtotal + taxAmount - discountAmount

    return {
      subtotal,
      taxAmount: taxAmount.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      total: total.toFixed(2)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const calculations = calculateTotal()

      const invoiceData = {
        gallery_id: galleryId,
        client_name: form.clientName,
        client_email: clientEmail,
        service_description: form.serviceDescription,
        subtotal: parseFloat(form.subtotal),
        tax_percentage: parseFloat(form.taxPercentage),
        tax_amount: parseFloat(calculations.taxAmount),
        discount_percentage: parseFloat(form.discountPercentage),
        discount_amount: parseFloat(calculations.discountAmount),
        total: parseFloat(calculations.total),
        payment_status: form.paymentStatus,
        amount_paid: parseFloat(form.amountPaid),
        payment_method: form.paymentMethod || null,
        notes: form.notes || null,
        due_date: form.dueDate || null,
        issue_date: form.issueDate,
        updated_at: new Date().toISOString()
      }

      if (existingInvoice) {
        // Update existing invoice
        const { error } = await supabase
          .from("invoices")
          .update(invoiceData)
          .eq("id", existingInvoice.id)

        if (error) throw error
        toast.success("Invoice updated successfully!", {
          style: { background: '#059669', color: '#fff', borderRadius: '12px' }
        })
      } else {
        // Create new invoice - get invoice number first
        const { data: invoiceNumber, error: funcError } = await supabase
          .rpc('generate_invoice_number')

        if (funcError) throw funcError

        const { error } = await supabase
          .from("invoices")
          .insert([{
            ...invoiceData,
            invoice_number: invoiceNumber
          }])

        if (error) throw error
        toast.success("Invoice created successfully!", {
          style: { background: '#059669', color: '#fff', borderRadius: '12px' }
        })
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(err.message || "Failed to save invoice")
    } finally {
      setLoading(false)
    }
  }

  const calculations = calculateTotal()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">
        <div className="sticky top-0 bg-white border-b border-[#e7e5e4] p-4 sm:p-6 z-10">
          <div className="flex justify-between items-start">
            <div className="min-w-0 pr-4">
              <h3 className="text-xl sm:text-2xl font-light text-[#1c1917] mb-0.5 sm:mb-1 truncate">
                {existingInvoice ? 'Edit Invoice' : 'Create Invoice'}
              </h3>
              <p className="text-[#78716c] text-xs sm:text-sm truncate">For {galleryName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#fafaf9] rounded-lg transition-colors flex-shrink-0"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#78716c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 sm:space-y-8">
          {/* Client Info */}
          <div>
            <h4 className="text-sm font-semibold text-[#1c1917] mb-3 uppercase tracking-wider">Client Information</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1c1917] mb-2">Client Name *</label>
                <input
                  type="text"
                  required
                  value={form.clientName}
                  onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-[#e7e5e4] focus:border-[#c67b5c] focus:ring-2 focus:ring-[#c67b5c]/20 outline-none transition-all"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1c1917] mb-2">Client Email</label>
                <input
                  type="email"
                  disabled
                  value={clientEmail}
                  className="w-full px-4 py-3 rounded-xl border border-[#e7e5e4] bg-[#fafaf9] text-[#78716c]"
                />
              </div>
            </div>
          </div>

          {/* Service Details */}
          <div>
            <h4 className="text-sm font-semibold text-[#1c1917] mb-3 uppercase tracking-wider">Service Details</h4>
            <div>
              <label className="block text-sm font-medium text-[#1c1917] mb-2">Service Description *</label>
              <textarea
                required
                value={form.serviceDescription}
                onChange={(e) => setForm({ ...form, serviceDescription: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-[#e7e5e4] focus:border-[#c67b5c] focus:ring-2 focus:ring-[#c67b5c]/20 outline-none transition-all resize-none"
                placeholder="Photography services for wedding event..."
              />
            </div>
          </div>

          {/* Pricing */}
          <div>
            <h4 className="text-sm font-semibold text-[#1c1917] mb-3 uppercase tracking-wider">Pricing</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1c1917] mb-2">Subtotal (₦) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={form.subtotal}
                  onChange={(e) => setForm({ ...form, subtotal: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-[#e7e5e4] focus:border-[#c67b5c] focus:ring-2 focus:ring-[#c67b5c]/20 outline-none transition-all"
                  placeholder="100000"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#1c1917] mb-2">Tax (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={form.taxPercentage}
                    onChange={(e) => setForm({ ...form, taxPercentage: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#e7e5e4] focus:border-[#c67b5c] focus:ring-2 focus:ring-[#c67b5c]/20 outline-none transition-all"
                  />
                  <p className="text-xs text-[#78716c] mt-1">Tax Amount: ₦{calculations.taxAmount}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1c1917] mb-2">Discount (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={form.discountPercentage}
                    onChange={(e) => setForm({ ...form, discountPercentage: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-[#e7e5e4] focus:border-[#c67b5c] focus:ring-2 focus:ring-[#c67b5c]/20 outline-none transition-all"
                  />
                  <p className="text-xs text-[#78716c] mt-1">Discount Amount: ₦{calculations.discountAmount}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-[#c67b5c]/10 to-[#8b9e87]/10 border border-[#c67b5c]/20">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-[#1c1917]">Total Amount</span>
                  <span className="text-2xl font-light text-[#c67b5c]">₦{calculations.total}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Status */}
          <div>
            <h4 className="text-sm font-semibold text-[#1c1917] mb-3 uppercase tracking-wider">Payment Details</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1c1917] mb-2">Payment Status *</label>
                <select
                  required
                  value={form.paymentStatus}
                  onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-[#e7e5e4] focus:border-[#c67b5c] focus:ring-2 focus:ring-[#c67b5c]/20 outline-none transition-all"
                >
                  <option value="unpaid">Unpaid</option>
                  <option value="partial">Partially Paid</option>
                  <option value="paid">Paid</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1c1917] mb-2">Amount Paid (₦)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.amountPaid}
                  onChange={(e) => setForm({ ...form, amountPaid: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-[#e7e5e4] focus:border-[#c67b5c] focus:ring-2 focus:ring-[#c67b5c]/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1c1917] mb-2">Payment Method</label>
                <input
                  type="text"
                  value={form.paymentMethod}
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-[#e7e5e4] focus:border-[#c67b5c] focus:ring-2 focus:ring-[#c67b5c]/20 outline-none transition-all"
                  placeholder="Bank Transfer, Cash, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1c1917] mb-2">Due Date</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-[#e7e5e4] focus:border-[#c67b5c] focus:ring-2 focus:ring-[#c67b5c]/20 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-[#1c1917] mb-2">Additional Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-[#e7e5e4] focus:border-[#c67b5c] focus:ring-2 focus:ring-[#c67b5c]/20 outline-none transition-all resize-none"
              placeholder="Any additional information..."
            />
          </div>

          {/* Actions - Stacking on mobile */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="order-2 sm:order-1 flex-1 px-6 py-3.5 bg-white border-2 border-[#e7e5e4] text-[#2d2a26] rounded-xl hover:bg-[#fafaf9] transition-all duration-300 font-medium text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="order-1 sm:order-2 flex-1 px-6 py-3.5 bg-[#2d2a26] text-white rounded-xl hover:bg-[#3d3731] transition-all duration-300 hover:scale-105 font-medium text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? 'Saving...' : existingInvoice ? 'Update Invoice' : 'Create Invoice'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}