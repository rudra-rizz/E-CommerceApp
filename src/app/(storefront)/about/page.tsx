'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Shield, Heart, Award, Users, ShoppingBag, Globe, Star, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
}

const team = [
  { name: 'Alex Chen', role: 'Founder & CEO', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&q=80' },
  { name: 'Sarah Kim', role: 'Creative Director', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&q=80' },
  { name: 'Marcus Johnson', role: 'Head of Operations', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&q=80' },
  { name: 'Priya Patel', role: 'Marketing Lead', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&q=80' },
]

const values = [
  { icon: Shield, title: 'Quality First', desc: 'Every product is handpicked and rigorously tested.' },
  { icon: Heart, title: 'Customer Love', desc: 'We put our customers at the heart of everything we do.' },
  { icon: Award, title: 'Sustainability', desc: 'Committed to ethical sourcing and eco-friendly practices.' },
  { icon: Users, title: 'Community', desc: 'Building a community of conscious consumers.' },
]

const stats = [
  { icon: ShoppingBag, value: '10K+', label: 'Happy Customers' },
  { icon: Globe, value: '50+', label: 'Countries Served' },
  { icon: Star, value: '4.9', label: 'Average Rating' },
  { icon: Truck, value: '5K+', label: 'Orders Delivered' },
]

const fallbackContent = (
  <div className="grid md:grid-cols-2 gap-12 items-center">
    <div>
      <h2 className="font-serif text-3xl font-bold mb-6">Why We Started</h2>
      <div className="space-y-4 text-sm text-[#6B6B6B] leading-relaxed">
        <p>STORE was born from a simple belief: shopping should be effortless, inspiring, and trustworthy. We saw a gap between what people wanted and what was available — generic products with no soul, no story, no quality.</p>
        <p>Our founders, a team of designers and retail veterans, set out to curate a collection that blends timeless design with modern functionality. Every piece in our collection is chosen for its craftsmanship, durability, and aesthetic appeal.</p>
        <p>Today, STORE serves thousands of customers worldwide, delivering premium products that elevate everyday life. We remain committed to our founding principles: quality, transparency, and exceptional service.</p>
      </div>
    </div>
    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
      <Image
        src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80"
        alt="Our workspace"
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 50vw"
      />
    </div>
  </div>
)

export default function AboutPage() {
  const [pageData, setPageData] = useState<{ title?: string; content?: string; meta_description?: string; image_url?: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/pages/about')
      .then((res) => res.json())
      .then((data) => {
        if (data?.content) setPageData(data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[50vh] min-h-[400px] bg-[#1A1A1A]">
        <Image
          src={
            pageData?.image_url ||
            'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1920&q=80'
          }
          alt="About us"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/30" />
        <div className="relative z-10 h-full flex items-center mx-auto max-w-[1440px] px-6 md:px-16">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} className="max-w-2xl">
            <h1 className="font-serif text-4xl md:text-6xl font-bold text-white mb-4">
              {pageData?.title || 'Our Story'}
            </h1>
            {pageData?.meta_description && (
              <p className="text-lg text-white/70 max-w-lg">{pageData.meta_description}</p>
            )}
          </motion.div>
        </div>
      </section>

      {/* Main content */}
      <section className="py-16 md:py-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="mx-auto max-w-[1440px] px-6 md:px-16"
        >
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : pageData?.content ? (
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: pageData.content }}
            />
          ) : (
            fallbackContent
          )}
        </motion.div>
      </section>

      {/* Values */}
      <section className="py-16 md:py-24 bg-white">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="mx-auto max-w-[1440px] px-6 md:px-16"
        >
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl font-bold mb-2">What We Stand For</h2>
            <p className="text-sm text-[#6B6B6B]">Our core values guide every decision we make.</p>
          </div>
          <motion.div variants={stagger} className="grid md:grid-cols-4 gap-8">
            {values.map((v) => (
              <motion.div key={v.title} variants={fadeUp} className="text-center p-6">
                <div className="w-14 h-14 rounded-2xl bg-[#2563EB]/5 flex items-center justify-center mx-auto mb-4">
                  <v.icon className="w-6 h-6 text-[#2563EB]" />
                </div>
                <h3 className="font-medium mb-2">{v.title}</h3>
                <p className="text-sm text-[#6B6B6B]">{v.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Team */}
      <section className="py-16 md:py-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="mx-auto max-w-[1440px] px-6 md:px-16"
        >
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl font-bold mb-2">Meet the Team</h2>
            <p className="text-sm text-[#6B6B6B]">The people behind STORE.</p>
          </div>
          <motion.div variants={stagger} className="grid md:grid-cols-4 gap-8">
            {team.map((member) => (
              <motion.div key={member.name} variants={fadeUp} className="text-center group">
                <div className="relative aspect-square rounded-2xl overflow-hidden mb-4 bg-[#F5F5F0]">
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </div>
                <h3 className="font-medium">{member.name}</h3>
                <p className="text-sm text-[#6B6B6B]">{member.role}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="py-16 md:py-24 bg-[#F5F5F0]">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="mx-auto max-w-[1440px] px-6 md:px-16"
        >
          <motion.div variants={stagger} className="grid md:grid-cols-4 gap-8">
            {stats.map((s) => (
              <motion.div key={s.label} variants={fadeUp} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-[#2563EB]/5 flex items-center justify-center mx-auto mb-4">
                  <s.icon className="w-6 h-6 text-[#2563EB]" />
                </div>
                <div className="font-serif text-3xl font-bold text-[#2563EB] mb-1">{s.value}</div>
                <p className="text-sm text-[#6B6B6B]">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-24 bg-[#2563EB]">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          className="mx-auto max-w-[1440px] px-6 md:px-16 text-center"
        >
          <h2 className="font-serif text-3xl font-bold text-white mb-4">Ready to Explore?</h2>
          <p className="text-white/70 mb-8 max-w-md mx-auto">Discover our curated collection of premium products.</p>
          <Link href="/products">
            <Button variant="secondary" size="lg" shimmer>Shop Now</Button>
          </Link>
        </motion.div>
      </section>
    </div>
  )
}
