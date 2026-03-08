import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Users,
  MapPin,
  MessageCircle,
  Star,
  Globe,
  Heart,
  ArrowRight,
  Search,
  Calendar,
  Sparkles
} from 'lucide-react';
import { PROXIES } from '../constants';

export const Community = () => {
  const [apiProxies, setApiProxies] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const { getProxies } = await import('../api');
        const proxies = await getProxies({ city: 'Toronto', profession: 'Engineer' });
        setApiProxies(proxies);
      } catch {
        setApiProxies([]);
      }
    })();
  }, []);

  const displayProxies = apiProxies.length > 0
    ? apiProxies.map((p, i) => ({
      id: `api-${i}`,
      name: p.name,
      profession: p.profession,
      city: 'Toronto, ON',
      origin: p.origin,
      quote: p.wisdomEntries?.[0]?.insight || 'Connect to learn from my experience.',
      match: 90 - i * 3
    }))
    : PROXIES;
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-32">
      {/* Editorial Header */}
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-12">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 mb-6"
          >
            <span className="w-12 h-[1px] bg-forest"></span>
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-forest/60">Module 03</span>
          </motion.div>
          <h1 className="text-6xl md:text-8xl font-serif font-bold text-forest leading-[0.85] tracking-tighter mb-8">
            The <br />
            <span className="italic text-terracotta text-5xl md:text-7xl">Collective.</span>
          </h1>
          <p className="text-xl text-charcoal/60 leading-relaxed font-light">
            Find your tribe and connect with those who've walked the path.
            A curated ecosystem of support, wisdom, and shared experience.
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/30" size={18} />
          <input
            type="text"
            placeholder="Search groups..."
            className="w-full pl-12 pr-4 py-4 bg-white border border-taupe rounded-md focus:outline-none focus:border-forest text-sm shadow-sm"
          />
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Main Content - Groups & Events */}
        <div className="lg:col-span-8 space-y-24">
          {/* Featured Groups - Asymmetric Grid */}
          <section>
            <div className="flex items-center justify-between mb-12">
              <h3 className="text-3xl font-serif font-bold text-charcoal">Recommended Circles</h3>
              <button className="text-xs font-bold uppercase tracking-widest text-forest hover:underline">Explore All</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { name: 'Toronto Tech Newcomers', members: '1.2k', type: 'Professional', icon: Globe, color: 'forest' },
                { name: 'Latinos in GTA', members: '850', type: 'Cultural', icon: Heart, color: 'terracotta' },
                { name: 'Etobicoke Parents', members: '420', type: 'Local', icon: Users, color: 'charcoal' },
                { name: 'English Practice Circle', members: '2.1k', type: 'Language', icon: MessageCircle, color: 'forest' },
              ].map((group, i) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -8, scale: 1.02 }}
                  className="bg-white p-10 rounded-[3rem] border border-taupe card-shadow flex flex-col gap-8 cursor-pointer group relative overflow-hidden"
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-${group.color}/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-${group.color}/10 transition-colors duration-700`} />
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 ${group.color === 'forest' ? 'bg-mint text-forest group-hover:bg-forest group-hover:text-white' :
                    group.color === 'terracotta' ? 'bg-terracotta/10 text-terracotta group-hover:bg-terracotta group-hover:text-white' :
                      'bg-taupe/20 text-charcoal group-hover:bg-charcoal group-hover:text-white'
                    }`}>
                    <group.icon size={32} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-2xl font-serif font-bold text-charcoal group-hover:text-forest transition-colors">{group.name}</h4>
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-bold text-charcoal/30 uppercase tracking-[0.2em]">{group.type}</span>
                      <span className="w-1 h-1 rounded-full bg-taupe/30" />
                      <span className="text-[10px] font-bold text-forest uppercase tracking-[0.2em]">{group.members} members</span>
                    </div>
                  </div>
                  <div className="pt-6 border-t border-taupe/30 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest text-charcoal/40 group-hover:text-forest transition-colors">Join Circle</span>
                    <ArrowRight size={16} className="text-taupe group-hover:text-forest group-hover:translate-x-2 transition-all" />
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Local Events - Editorial List */}
          <section className="bg-white p-12 md:p-16 rounded-[4rem] border border-taupe card-shadow relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-mint/5 rounded-full -mr-32 -mt-32 blur-3xl" />
            <div className="flex items-center justify-between mb-16">
              <h3 className="text-3xl font-serif font-bold text-charcoal">Upcoming Gatherings</h3>
              <div className="flex items-center gap-4">
                <button className="w-10 h-10 rounded-full border border-taupe flex items-center justify-center hover:bg-forest hover:text-white transition-all"><ArrowRight size={16} className="rotate-180" /></button>
                <button className="w-10 h-10 rounded-full border border-taupe flex items-center justify-center hover:bg-forest hover:text-white transition-all"><ArrowRight size={16} /></button>
              </div>
            </div>
            <div className="space-y-12">
              {[
                { title: 'Newcomer Welcome Mixer', date: 'March 15', time: '6:00 PM', location: 'Liberty Village', type: 'Social' },
                { title: 'Resume Workshop for Engineers', date: 'March 18', time: '2:00 PM', location: 'Online', type: 'Career' },
                { title: 'Cultural Heritage Festival', date: 'March 22', time: '11:00 AM', location: 'Nathan Phillips Square', type: 'Festival' },
              ].map((event, i) => (
                <div key={i} className="flex flex-col md:flex-row md:items-center gap-12 group cursor-pointer">
                  <div className="flex items-center gap-8 shrink-0">
                    <div className="w-20 h-20 bg-forest/5 rounded-[2rem] flex flex-col items-center justify-center text-forest group-hover:bg-forest group-hover:text-white transition-all duration-700">
                      <span className="text-[10px] font-bold uppercase tracking-widest">{event.date.split(' ')[0]}</span>
                      <span className="text-3xl font-serif font-bold">{event.date.split(' ')[1]}</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-forest">{event.type}</span>
                    </div>
                    <h4 className="text-3xl font-serif font-bold text-charcoal group-hover:text-forest transition-colors">{event.title}</h4>
                    <div className="flex items-center gap-8 text-sm text-charcoal/40 font-light">
                      <span className="flex items-center gap-2"><Calendar size={14} /> {event.time}</span>
                      <span className="flex items-center gap-2"><MapPin size={14} /> {event.location}</span>
                    </div>
                  </div>
                  <button className="px-8 py-3 rounded border border-taupe text-[10px] font-bold uppercase tracking-widest hover:bg-forest hover:text-white hover:border-forest transition-all">RSVP</button>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar - Proxy Mentors */}
        <div className="lg:col-span-4 space-y-12">
          <div className="bg-forest text-white p-12 rounded-[3rem] shadow-2xl shadow-forest/30 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-mint/10 rounded-full -mr-24 -mt-24 blur-3xl group-hover:bg-mint/20 transition-colors duration-700" />
            <div className="flex items-center gap-3 mb-8">
              <Sparkles size={24} className="text-mint" />
              <h3 className="text-2xl font-serif font-bold tracking-tight">Proxy Mentors</h3>
            </div>
            <p className="text-lg opacity-80 leading-relaxed mb-12 font-light italic">
              "Connect with someone who made a similar move before you. Real wisdom from real people."
            </p>

            <div className="space-y-6">
              {displayProxies.map(proxy => (
                <div key={proxy.id} className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-md hover:bg-white/10 transition-colors duration-500">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-forest font-bold text-xl shadow-lg">
                      {proxy.name[0]}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-sm tracking-tight">{proxy.name}</p>
                        <span className="text-[10px] font-bold text-mint uppercase tracking-widest">{proxy.match}% match</span>
                      </div>
                      <p className="text-[10px] opacity-60 uppercase tracking-widest mt-1">{proxy.profession} • {proxy.origin}</p>
                    </div>
                  </div>
                  <p className="text-sm italic opacity-80 mb-8 leading-relaxed font-light">"{proxy.quote}"</p>
                  <button className="w-full py-4 bg-white text-forest rounded text-[10px] font-bold uppercase tracking-widest hover:bg-mint transition-colors shadow-xl">
                    Request 20-min Call
                  </button>
                </div>
              ))}
            </div>

            <button className="w-full mt-8 py-4 border border-white/20 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-colors">
              View All Mentors
            </button>
          </div>

          {/* Newcomer Support Centres */}
          <div className="bg-white p-12 rounded-[3rem] border border-taupe card-shadow">
            <div className="flex items-center gap-3 mb-10">
              <span className="w-8 h-[1px] bg-charcoal/20"></span>
              <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-charcoal/40">Support Centres</h3>
            </div>
            <div className="space-y-6">
              {[
                { name: 'YMCA Newcomer Centre', dist: '1.2 km' },
                { name: 'COSTI Immigrant Services', dist: '2.5 km' },
                { name: 'CultureLink Toronto', dist: '3.1 km' },
              ].map((centre, i) => (
                <div key={i} className="flex items-center justify-between group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-cream flex items-center justify-center text-terracotta group-hover:bg-terracotta group-hover:text-white transition-all">
                      <MapPin size={18} />
                    </div>
                    <p className="text-sm font-bold text-charcoal group-hover:translate-x-2 transition-transform">{centre.name}</p>
                  </div>
                  <span className="text-[10px] font-bold text-charcoal/20 uppercase tracking-widest">{centre.dist}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ChevronRight = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m9 18 6-6-6-6" />
  </svg>
);
