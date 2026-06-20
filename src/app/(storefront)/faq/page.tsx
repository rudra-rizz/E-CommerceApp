'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Search, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const faqs = [
  {
    category: 'Orders',
    questions: [
      { q: 'How do I place an order?', a: 'Browse our products, select your desired items, choose options (size/color), and click "Add to Cart". When ready, proceed to checkout, enter your shipping details, and complete payment.' },
      { q: 'Can I modify or cancel my order?', a: 'Orders can be modified or cancelled within 1 hour of placement. Contact our support team immediately with your order number for assistance.' },
      { q: 'How do I track my order?', a: 'Once your order ships, you\'ll receive a tracking number via email. You can also track orders from your Account dashboard under "Order History".' },
    ],
  },
  {
    category: 'Shipping',
    questions: [
      { q: 'What shipping options do you offer?', a: 'We offer Standard (5-7 business days, free over $50), Express (2-3 business days, $12.99), and Overnight (1 business day, $24.99) shipping.' },
      { q: 'Do you ship internationally?', a: 'Yes, we ship to over 50 countries. International shipping rates and times vary by destination and are calculated at checkout.' },
      { q: 'How are shipping costs calculated?', a: 'Shipping costs are based on the shipping method selected, package weight, and destination. Standard shipping is free for orders over $50 within the US.' },
    ],
  },
  {
    category: 'Returns & Exchanges',
    questions: [
      { q: 'What is your return policy?', a: 'We accept returns within 30 days of delivery. Items must be unworn, unwashed, and with tags attached. Refunds are processed within 5-7 business days.' },
      { q: 'How do I start a return?', a: 'Log into your account, go to Orders, find the item you want to return, and click "Return". Print the return label and drop off at any carrier location.' },
      { q: 'Can I exchange an item?', a: 'For exchanges, please initiate a return and place a new order for the desired item. This ensures the fastest processing.' },
    ],
  },
  {
    category: 'Payment',
    questions: [
      { q: 'What payment methods do you accept?', a: 'We accept Visa, Mastercard, American Express, Discover, PayPal, Apple Pay, Google Pay, and UPI.' },
      { q: 'Is my payment information secure?', a: 'Absolutely. We use 256-bit SSL encryption and are PCI-DSS compliant. Your payment data is never stored on our servers.' },
      { q: 'Do you offer installment payments?', a: 'Yes, we offer Buy Now, Pay Later options through Razorpay at checkout for orders over $50.' },
    ],
  },
  {
    category: 'Account',
    questions: [
      { q: 'How do I create an account?', a: 'Click the user icon in the top right corner and select "Sign Up". Enter your email, create a password, and fill in your details.' },
      { q: 'I forgot my password. What should I do?', a: 'Click "Forgot Password?" on the login page. Enter your email, and we\'ll send you a reset link.' },
      { q: 'How do I update my profile?', a: 'Log into your account and navigate to Account Settings. You can update your name, email, phone number, and shipping addresses there.' },
    ],
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function FAQPage() {
  const [pageData, setPageData] = useState<{ title: string; content: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [openIndex, setOpenIndex] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetch('/api/pages/faq')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setPageData(data)
      })
      .finally(() => setLoading(false))
  }, [])

  const filteredFaqs = faqs.map(cat => ({
    ...cat,
    questions: cat.questions.filter(
      item => item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
             item.a.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(cat => cat.questions.length > 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#2563EB]" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1440px] px-6 md:px-16 py-16 md:py-24">
      <motion.div initial="hidden" animate="visible" variants={fadeUp} className="text-center mb-12">
        <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2">{pageData?.title || 'Frequently Asked Questions'}</h1>
        <p className="text-sm text-[#6B6B6B] mb-8">Find answers to common questions below.</p>
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
          <input
            type="text"
            placeholder="Search FAQs..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-10 pr-4 bg-white border border-[rgba(0,0,0,0.1)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          />
        </div>
      </motion.div>

      {pageData?.content && (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="prose prose-sm max-w-3xl mx-auto mb-12 text-[#6B6B6B]"
          dangerouslySetInnerHTML={{ __html: pageData.content }}
        />
      )}

      <div className="max-w-3xl mx-auto space-y-8">
        {filteredFaqs.map(category => (
          <motion.div key={category.category} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <h2 className="font-serif text-xl font-bold mb-4">{category.category}</h2>
            <div className="divide-y divide-[rgba(0,0,0,0.06)] bg-white rounded-2xl border border-[rgba(0,0,0,0.04)] overflow-hidden">
              {category.questions.map((item, idx) => {
                const key = `${category.category}-${idx}`
                return (
                  <div key={key}>
                    <button
                      onClick={() => setOpenIndex(openIndex === key ? null : key)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-[#F5F5F0] transition-colors"
                    >
                      <span className="text-sm font-medium pr-4">{item.q}</span>
                      <ChevronDown className={cn(
                        'w-4 h-4 text-[#6B6B6B] shrink-0 transition-transform duration-200',
                        openIndex === key && 'rotate-180'
                      )} />
                    </button>
                    <AnimatePresence>
                      {openIndex === key && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <p className="px-4 pb-4 text-sm text-[#6B6B6B] leading-relaxed">{item.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        className="text-center mt-12 p-8 bg-[#2563EB]/5 rounded-2xl max-w-2xl mx-auto"
      >
        <h3 className="font-medium mb-2">Still have questions?</h3>
        <p className="text-sm text-[#6B6B6B] mb-4">Our support team is here to help.</p>
        <a href="/contact" className="inline-flex items-center justify-center h-11 px-6 text-sm font-medium rounded-xl bg-[#2563EB] text-white hover:bg-[#1d4ed8] transition-colors">
          Contact Us
        </a>
      </motion.div>
    </div>
  )
}
