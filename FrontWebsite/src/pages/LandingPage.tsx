import React from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Sparkles,
  CheckCircle2,
  MessageCircle,
  Globe,
  ShieldCheck,
  Users,
  Briefcase,
  ChevronRight,
  Star
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../components/Logo';

export const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-cream relative overflow-hidden">
      {/* Marquee Header */}
      <div className="bg-forest text-cream py-3 border-b border-ink relative z-20 overflow-hidden">
        <div className="marquee-track whitespace-nowrap">
          {[1, 2, 3, 4].map((i) => (
            <span key={i} className="text-[10px] font-bold uppercase tracking-[0.5em] px-12">
              Settlement Intelligence • Toronto • Vancouver • Montreal • Calgary • Ottawa • Halifax • Edmonton •
            </span>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 max-w-[1400px] mx-auto px-8 py-8 flex items-center justify-between border-b border-ink">
        <div className="flex items-center gap-4">
          <Logo className="w-10 h-10" />
          <div className="flex flex-col">
            <span className="font-serif font-bold text-2xl text-forest leading-none">49th</span>
            <span className="text-[9px] uppercase tracking-[0.2em] text-charcoal/40 font-bold">Immigration Companion</span>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-12 text-[10px] uppercase tracking-widest font-bold text-charcoal/60">
          <a href="#how-it-works" className="hover:text-forest transition-colors">Methodology</a>
          <a href="#features" className="hover:text-forest transition-colors">Modules</a>
          <a href="#stories" className="hover:text-forest transition-colors">Archive</a>
          <button
            onClick={() => navigate('/onboarding')}
            className="px-8 py-3 bg-forest text-cream rounded hover:bg-forest/90 transition-all active:scale-95 shadow-xl shadow-forest/20"
          >
            Begin Journey
          </button>
        </div>
      </nav>

      {/* Hero Section - Editorial Split */}
      <section className="relative z-10 border-b border-ink">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 min-h-[85vh]">
          {/* Left: Text Content */}
          <div className="p-8 lg:p-24 flex flex-col justify-center border-r border-ink bg-white/30 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="inline-block px-4 py-1 bg-mint text-forest text-[9px] font-bold uppercase tracking-[0.3em] rounded mb-10 border border-forest/10">
                Protocol v2.4 • Active
              </div>
              <h1 className="text-7xl md:text-[140px] font-serif font-bold text-forest mb-12 leading-[0.82] tracking-[-0.05em]">
                A clearer <br />
                <span className="italic text-terracotta skew-x-[-10deg] inline-block">pathway</span> <br />
                to Canada.
              </h1>
              <p className="text-2xl text-charcoal/70 max-w-lg mb-16 leading-relaxed font-light">
                49th is a curated intelligence companion designed to navigate the complexities of Canadian life — from document filing to community integration.
              </p>
              <div className="flex flex-wrap gap-8">
                <button
                  onClick={() => navigate('/onboarding')}
                  className="px-12 py-6 bg-forest text-cream rounded font-bold text-xl hover:bg-forest/90 transition-all flex items-center gap-4 group shadow-2xl shadow-forest/20"
                >
                  Start your journey
                  <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
                </button>
                <div className="flex items-center gap-4 px-8 py-6 border border-ink rounded font-bold text-charcoal/60 hover:bg-white transition-colors cursor-pointer text-sm uppercase tracking-widest">
                  Explore Engine
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right: Visual Content */}
          <div className="relative bg-taupe/10 overflow-hidden flex items-center justify-center p-8 lg:p-0">
            <div className="absolute inset-0 opacity-40 pointer-events-none">
              <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-mint rounded-full blur-[150px]" />
              <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-terracotta/20 rounded-full blur-[150px]" />
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="relative z-10 w-full max-w-md aspect-[3/4] bg-white rounded-[3rem] shadow-[0_60px_120px_rgba(0,0,0,0.12)] border border-ink overflow-hidden flex flex-col"
            >
              <div className="p-10 border-b border-ink flex items-center justify-between bg-cream/30">
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase tracking-[0.4em] text-charcoal/30 font-bold mb-2">Current Protocol</span>
                  <span className="font-serif text-2xl font-bold text-forest">Arrival Engine</span>
                </div>
                <div className="w-14 h-14 rounded-2xl border border-ink flex items-center justify-center bg-white shadow-inner">
                  <Sparkles size={24} className="text-terracotta" />
                </div>
              </div>
              <div className="flex-1 p-10 space-y-8">
                {[
                  { label: "Identity Verification", status: "Verified", color: "text-forest" },
                  { label: "Settlement Roadmap", status: "In Progress", color: "text-terracotta" },
                  { label: "Community Access", status: "Pending", color: "text-charcoal/20" },
                  { label: "Career Alignment", status: "Pending", color: "text-charcoal/20" }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-ink/5 pb-6">
                    <span className="text-sm font-bold text-charcoal/50 uppercase tracking-widest">{item.label}</span>
                    <span className={`text-[10px] uppercase tracking-[0.2em] font-bold ${item.color}`}>{item.status}</span>
                  </div>
                ))}
              </div>
              <div className="p-10 bg-forest text-cream">
                <p className="text-[10px] opacity-50 uppercase tracking-[0.4em] font-bold mb-3">Next Directive</p>
                <p className="font-serif text-xl leading-snug">Register for Provincial Health Insurance (OHIP)</p>
              </div>
            </motion.div>

            {/* Vertical Rail Text */}
            <div className="absolute right-12 top-1/2 -translate-y-1/2 vertical-text text-[10px] uppercase tracking-[0.8em] text-charcoal/10 font-bold">
              ESTABLISHED 2026 • TORONTO • VANCOUVER • MONTREAL • CALGARY
            </div>
          </div>
        </div>
      </section>

      {/* Stats / Micro-Labels */}
      <section className="border-b border-ink">
        <div className="max-w-[1400px] mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-ink">
          {[
            { label: "Active Newcomers", value: "12,400+" },
            { label: "Success Rate", value: "98.2%" },
            { label: "Average Savings", value: "$2.4k" },
            { label: "Time Saved", value: "450h" }
          ].map((stat, i) => (
            <div key={i} className="p-10 text-center">
              <p className="text-[10px] uppercase tracking-widest text-charcoal/40 font-bold mb-2">{stat.label}</p>
              <p className="text-3xl font-serif font-bold text-forest">{stat.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why this matters - Asymmetrical Editorial */}
      <section className="bg-white py-32 relative overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <div className="relative">
              <div className="absolute -top-12 -left-12 text-[180px] font-serif font-bold text-taupe/10 leading-none select-none">
                01
              </div>
              <h2 className="text-5xl md:text-7xl font-serif font-bold text-forest mb-10 leading-[0.9] relative z-10">
                Starting over <br />
                <span className="italic text-terracotta">should not</span> <br />
                mean starting alone.
              </h2>
              <p className="text-xl text-charcoal/60 mb-12 leading-relaxed max-w-lg">
                Newcomer information is fragmented across hundreds of government portals and community groups. 49th brings it all together into one warm, intelligent journey.
              </p>
              <div className="space-y-6">
                {[
                  "Personalized roadmaps for your specific province",
                  "Real-time policy alerts translated into plain language",
                  "Direct connection to mentors who've walked your path",
                  "Financial onboarding designed for 'credit from zero'"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 group">
                    <div className="w-8 h-8 rounded-full border border-ink flex items-center justify-center text-forest group-hover:bg-forest group-hover:text-cream transition-all">
                      <CheckCircle2 size={14} />
                    </div>
                    <span className="font-serif italic text-lg text-charcoal/80">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
              <div className="space-y-8">
                <div className="bg-cream p-10 rounded-[2.5rem] border border-ink hover:shadow-2xl transition-all hover:-translate-y-2">
                  <Globe className="text-terracotta mb-6" size={40} />
                  <h4 className="font-serif text-2xl font-bold mb-4">Global Context</h4>
                  <p className="text-sm text-charcoal/50 leading-relaxed">Support in your native language from day one, respecting your cultural origin.</p>
                </div>
                <div className="bg-mint/30 p-10 rounded-[2.5rem] border border-mint hover:shadow-2xl transition-all hover:-translate-y-2">
                  <ShieldCheck className="text-forest mb-6" size={40} />
                  <h4 className="font-serif text-2xl font-bold mb-4">Trust First</h4>
                  <p className="text-sm text-charcoal/50 leading-relaxed">Verified guidance from official Canadian sources, updated in real-time.</p>
                </div>
              </div>
              <div className="space-y-8 pt-16">
                <div className="bg-forest text-cream p-10 rounded-[2.5rem] shadow-2xl shadow-forest/20 hover:-translate-y-2 transition-all">
                  <Users className="text-mint mb-6" size={40} />
                  <h4 className="font-serif text-2xl font-bold mb-4">Community</h4>
                  <p className="text-sm opacity-70 leading-relaxed">Connect with others in your arrival cohort to share resources and support.</p>
                </div>
                <div className="bg-terracotta/5 p-10 rounded-[2.5rem] border border-terracotta/20 hover:shadow-2xl transition-all hover:-translate-y-2">
                  <Briefcase className="text-terracotta mb-6" size={40} />
                  <h4 className="font-serif text-2xl font-bold mb-4">Career</h4>
                  <p className="text-sm text-charcoal/50 leading-relaxed">Credential recognition and job readiness tailored for the Canadian market.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works - Vertical Timeline */}
      <section id="how-it-works" className="py-32 bg-cream border-y border-ink relative overflow-hidden">
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="flex flex-col md:flex-row items-baseline justify-between mb-24 gap-8">
            <h2 className="text-6xl md:text-8xl font-serif font-bold text-forest leading-none">The Methodology</h2>
            <p className="text-xl text-charcoal/40 max-w-sm font-medium italic">A three-phase protocol designed for seamless integration.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-ink rounded-[3rem] overflow-hidden bg-white">
            {[
              { step: '01', title: 'Tell us about yourself', desc: 'Share your origin, status, and goals. We build a profile that understands your unique needs.' },
              { step: '02', title: 'Get your roadmap', desc: 'Receive a step-by-step settlement plan for your first 90 days, tailored to your city and family.' },
              { step: '03', title: 'Move forward with support', desc: 'Get reminders, chat with our AI assistant, and connect with mentors as you build your life.' },
            ].map((item, i) => (
              <div key={i} className={`p-16 flex flex-col justify-between hover:bg-cream/50 transition-colors ${i < 2 ? 'border-r border-ink' : ''}`}>
                <div className="text-7xl font-serif font-bold text-taupe/30 mb-12">
                  {item.step}
                </div>
                <div>
                  <h4 className="text-3xl font-serif font-bold text-forest mb-6 leading-tight">{item.title}</h4>
                  <p className="text-charcoal/60 leading-relaxed text-lg">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials - Editorial Grid */}
      <section id="stories" className="py-32 bg-white border-b border-ink">
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="flex items-center gap-8 mb-24">
            <h2 className="text-6xl font-serif font-bold text-forest">The Archive</h2>
            <div className="h-px flex-1 bg-ink" />
            <span className="text-[10px] uppercase tracking-[0.5em] text-charcoal/30 font-bold">Success Stories</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { name: 'Mateo', from: 'Colombia', quote: 'The Arrival Engine saved me weeks of confusion. I had my SIN and bank account in 48 hours.' },
              { name: 'Priya', from: 'India', quote: 'As a nurse, credential recognition was my biggest fear. 49th gave me a clear path to licensing.' },
              { name: 'Olena', from: 'Ukraine', quote: 'Finding a school for my daughter was so easy with the Family module. We felt welcomed from day one.' },
            ].map((story, i) => (
              <div key={i} className="flex flex-col group">
                <div className="mb-8 overflow-hidden rounded-[2rem] border border-ink aspect-square bg-taupe/20 relative">
                  <div className="absolute inset-0 flex items-center justify-center text-8xl font-serif font-bold text-charcoal/5 select-none">
                    {story.name[0]}
                  </div>
                  <div className="absolute bottom-6 left-6 flex gap-1">
                    {[1, 2, 3, 4, 5].map(s => <Star key={s} size={12} className="fill-terracotta text-terracotta" />)}
                  </div>
                </div>
                <p className="text-2xl font-serif italic text-charcoal mb-8 leading-relaxed">"{story.quote}"</p>
                <div className="flex items-center gap-4 border-t border-ink pt-6">
                  <div className="w-12 h-12 bg-forest rounded-full flex items-center justify-center text-cream font-bold font-serif">
                    {story.name[0]}
                  </div>
                  <div>
                    <p className="font-bold text-charcoal text-lg leading-none mb-1">{story.name}</p>
                    <p className="text-[10px] uppercase tracking-widest text-charcoal/40 font-bold">Newcomer from {story.from}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section - Minimal & Clean */}
      <section className="py-32 bg-cream">
        <div className="max-w-4xl mx-auto px-8">
          <h2 className="text-5xl font-serif font-bold text-forest text-center mb-24">Common Inquiries</h2>
          <div className="space-y-0 border-t border-ink">
            {[
              { q: "Is 49th a government agency?", a: "No, we are an independent AI-powered companion. We use official government data and policy updates to provide you with clear, simplified guidance." },
              { q: "Does this cost anything?", a: "We offer a free tier that includes your basic settlement roadmap. Our premium 'Anchor' plan provides deeper career support and one-on-one mentor calls." },
              { q: "Is my data secure?", a: "Absolutely. We use bank-level encryption and never share your personal immigration details with third parties without your explicit consent." },
              { q: "Can I use it before I arrive?", a: "Yes! In fact, we recommend starting 30 days before your flight so you can have your documents and first-week plan ready." }
            ].map((faq, i) => (
              <div key={i} className="py-10 border-b border-ink group cursor-pointer">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-2xl font-serif font-bold text-charcoal group-hover:text-forest transition-colors">{faq.q}</h4>
                  <div className="w-8 h-8 rounded-full border border-ink flex items-center justify-center group-hover:bg-forest group-hover:text-cream transition-all">
                    <ArrowRight size={14} className="rotate-90 group-hover:rotate-0 transition-transform" />
                  </div>
                </div>
                <p className="text-lg text-charcoal/50 leading-relaxed max-w-2xl">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA - Dramatic Full Bleed */}
      <section className="relative z-10">
        <div className="max-w-[1400px] mx-auto px-8 py-32">
          <div className="bg-forest rounded-[4rem] p-16 md:p-32 text-center text-cream relative overflow-hidden shadow-[0_50px_100px_rgba(26,58,42,0.3)]">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute top-10 left-10 w-96 h-96 bg-mint rounded-full blur-[120px]" />
              <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-terracotta rounded-full blur-[120px]" />
            </div>
            <div className="relative z-10">
              <h2 className="text-6xl md:text-9xl font-serif font-bold mb-12 leading-[0.85] tracking-tight">
                Starting over <br />
                <span className="italic text-mint">should not</span> <br />
                mean alone.
              </h2>
              <p className="text-2xl opacity-70 max-w-2xl mx-auto mb-16 font-medium leading-relaxed">
                Join thousands of newcomers who are building their lives in Canada with confidence and clarity.
              </p>
              <button
                onClick={() => navigate('/onboarding')}
                className="px-16 py-6 bg-mint text-forest rounded font-bold text-2xl hover:bg-white transition-all hover:scale-105 shadow-2xl shadow-black/20 active:scale-95"
              >
                Begin Your Journey
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Minimal Editorial */}
      <footer className="bg-cream border-t border-ink py-20 relative z-10">
        <div className="max-w-[1400px] mx-auto px-8">
          <div className="flex flex-col md:flex-row items-start justify-between gap-16 mb-20">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <Logo className="w-12 h-12" />
                <span className="font-serif font-bold text-3xl text-forest">49th</span>
              </div>
              <p className="text-charcoal/40 max-w-xs text-sm font-medium leading-relaxed">
                A curated intelligence companion for the modern newcomer. Built with care in Toronto.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-20">
              <div className="space-y-6">
                <p className="text-[10px] uppercase tracking-widest text-charcoal/30 font-bold">Platform</p>
                <div className="flex flex-col gap-4 text-sm font-bold text-charcoal/60">
                  <a href="#" className="hover:text-forest">Methodology</a>
                  <a href="#" className="hover:text-forest">Modules</a>
                  <a href="#" className="hover:text-forest">Archive</a>
                </div>
              </div>
              <div className="space-y-6">
                <p className="text-[10px] uppercase tracking-widest text-charcoal/30 font-bold">Company</p>
                <div className="flex flex-col gap-4 text-sm font-bold text-charcoal/60">
                  <a href="#" className="hover:text-forest">About</a>
                  <a href="#" className="hover:text-forest">Privacy</a>
                  <a href="#" className="hover:text-forest">Terms</a>
                </div>
              </div>
              <div className="space-y-6">
                <p className="text-[10px] uppercase tracking-widest text-charcoal/30 font-bold">Connect</p>
                <div className="flex flex-col gap-4 text-sm font-bold text-charcoal/60">
                  <a href="#" className="hover:text-forest">Twitter</a>
                  <a href="#" className="hover:text-forest">LinkedIn</a>
                  <a href="#" className="hover:text-forest">Email</a>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 pt-12 border-t border-ink">
            <p className="text-[10px] uppercase tracking-[0.5em] text-charcoal/20 font-bold">© 2026 49TH PROTOCOL • ALL RIGHTS RESERVED</p>
            <div className="flex gap-4">
              <div className="w-2 h-2 rounded-full bg-forest" />
              <div className="w-2 h-2 rounded-full bg-terracotta" />
              <div className="w-2 h-2 rounded-full bg-taupe" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
