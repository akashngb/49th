import React from 'react';
import { motion } from 'motion/react';
import { 
  Users2, 
  GraduationCap, 
  Heart, 
  Baby, 
  CheckCircle2, 
  ArrowRight, 
  ShieldCheck,
  Info,
  Calendar
} from 'lucide-react';

export const Family = () => {
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
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-forest/60">Module 04</span>
          </motion.div>
          <h1 className="text-6xl md:text-8xl font-serif font-bold text-forest leading-[0.85] tracking-tighter mb-8">
            The <br />
            <span className="italic text-terracotta text-5xl md:text-7xl">Foundation.</span>
          </h1>
          <p className="text-xl text-charcoal/60 leading-relaxed font-light">
            Support for your spouse, children, and parents. 
            Building a secure architecture for your family's future in Canada.
          </p>
        </div>

        <div className="flex items-center gap-4 self-start md:self-auto">
          <div className="px-6 py-4 bg-white border border-taupe rounded-2xl flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 bg-mint rounded-xl flex items-center justify-center text-forest">
              <Users2 size={20} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-charcoal/40">Active Profile</p>
              <p className="text-sm font-bold text-charcoal">4 Family Members</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Main Modules */}
        <div className="lg:col-span-8 space-y-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <motion.div 
              whileHover={{ y: -8, scale: 1.02 }}
              className="bg-white p-12 rounded-[3rem] border border-taupe card-shadow group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-forest/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-forest/10 transition-colors duration-700" />
              <div className="w-16 h-16 bg-forest/10 rounded-2xl flex items-center justify-center text-forest mb-10 group-hover:bg-forest group-hover:text-white transition-all duration-500">
                <GraduationCap size={32} />
              </div>
              <h3 className="text-3xl font-serif font-bold text-charcoal mb-4">School Registration</h3>
              <p className="text-lg text-charcoal/60 leading-relaxed mb-10 font-light">
                Enroll your children in the Toronto District School Board (TDSB). We've mapped your local catchment architecture.
              </p>
              <button className="w-full py-4 bg-forest text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-forest/90 transition-all flex items-center justify-center gap-3 shadow-xl shadow-forest/20">
                Start Enrollment <ArrowRight size={16} />
              </button>
            </motion.div>

            <motion.div 
              whileHover={{ y: -8, scale: 1.02 }}
              className="bg-white p-12 rounded-[3rem] border border-taupe card-shadow group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-terracotta/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-terracotta/10 transition-colors duration-700" />
              <div className="w-16 h-16 bg-terracotta/10 rounded-2xl flex items-center justify-center text-terracotta mb-10 group-hover:bg-terracotta group-hover:text-white transition-all duration-500">
                <Baby size={32} />
              </div>
              <h3 className="text-3xl font-serif font-bold text-charcoal mb-4">Childcare & Daycare</h3>
              <p className="text-lg text-charcoal/60 leading-relaxed mb-10 font-light">
                Explore licensed daycare options and apply for the Canada-Wide Early Learning and Child Care (CWELCC) subsidy.
              </p>
              <button className="w-full py-4 bg-white text-terracotta border border-terracotta/20 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-terracotta/5 transition-all flex items-center justify-center gap-3">
                Find Daycare <ArrowRight size={16} />
              </button>
            </motion.div>
          </div>

          {/* Family Health Card - Editorial Style */}
          <div className="bg-white p-12 md:p-16 rounded-[4rem] border border-taupe card-shadow relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-terracotta/5 rounded-full -mr-32 -mt-32 blur-3xl" />
            <div className="flex items-center justify-between mb-16">
              <h3 className="text-3xl font-serif font-bold text-charcoal">Family Healthcare</h3>
              <div className="w-12 h-12 bg-terracotta/10 rounded-full flex items-center justify-center text-terracotta">
                <Heart size={24} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { name: 'Mateo (You)', status: 'Active', color: 'forest' },
                { name: 'Elena (Spouse)', status: 'Pending', color: 'terracotta' },
                { name: 'Lucas (Child)', status: 'Active', color: 'forest' },
              ].map((member, i) => (
                <div key={i} className="p-8 bg-cream rounded-[2.5rem] border border-taupe/30 flex flex-col gap-6 group hover:border-forest transition-all duration-500">
                  <div className="flex items-center justify-between">
                    <div className={`w-3 h-3 rounded-full ${member.color === 'forest' ? 'bg-forest shadow-lg shadow-forest/40' : 'bg-terracotta animate-pulse shadow-lg shadow-terracotta/40'}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${member.color === 'forest' ? 'text-forest' : 'text-terracotta'}`}>{member.status}</span>
                  </div>
                  <div>
                    <p className="text-2xl font-serif font-bold text-charcoal">{member.name}</p>
                    <p className="text-[10px] text-charcoal/30 uppercase tracking-[0.3em] mt-2">OHIP Status</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-12 p-8 bg-mint/20 rounded-[2.5rem] border border-mint/30 flex flex-col md:flex-row items-center gap-8 group">
              <div className="w-16 h-16 bg-forest text-white rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-xl shadow-forest/20 group-hover:scale-110 transition-transform duration-500">
                <ShieldCheck size={32} />
              </div>
              <div className="flex-1 text-center md:text-left">
                <p className="text-lg text-forest/80 font-light leading-relaxed">
                  We've identified <span className="font-bold">2 family physicians</span> in your neighborhood currently accepting new patients with children.
                </p>
              </div>
              <button className="px-8 py-3 bg-forest text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-forest/90 transition-all shrink-0">View List</button>
            </div>
          </div>
        </div>

        {/* Sidebar Content */}
        <div className="lg:col-span-4 space-y-12">
          {/* Family Bridge Card */}
          <div className="bg-forest text-white p-12 rounded-[3rem] shadow-2xl shadow-forest/30 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-mint/10 rounded-full -mr-24 -mt-24 blur-3xl group-hover:bg-mint/20 transition-colors duration-700" />
            <h3 className="text-3xl font-serif font-bold mb-6 leading-tight">Family <br />Bridge.</h3>
            <p className="text-lg opacity-80 leading-relaxed mb-12 font-light italic">
              "Immigration is a shared journey. We help families navigate cultural adjustment together."
            </p>
            <div className="space-y-4">
              <button className="w-full py-4 bg-white text-forest rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-mint transition-all shadow-xl">
                Explore Workshops
              </button>
              <button className="w-full py-4 bg-white/10 border border-white/20 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-white/20 transition-all">
                Talk to a Counselor
              </button>
            </div>
          </div>

          {/* Benefits Module */}
          <div className="bg-white p-12 rounded-[3rem] border border-taupe card-shadow">
            <div className="flex items-center gap-3 mb-10">
              <span className="w-8 h-[1px] bg-charcoal/20"></span>
              <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-charcoal/40">Family Benefits</h3>
            </div>
            <div className="space-y-6">
              {[
                { label: 'Canada Child Benefit', amount: '$540 / mo', status: 'Eligible' },
                { label: 'Ontario Child Benefit', amount: '$125 / mo', status: 'Eligible' },
                { label: 'GST/HST Credit', amount: '$110 / qtr', status: 'Pending' },
              ].map((benefit, i) => (
                <div key={i} className="flex items-center justify-between p-6 bg-cream rounded-3xl border border-taupe/30 group hover:border-forest transition-all duration-500">
                  <div className="space-y-1">
                    <p className="font-bold text-sm text-charcoal tracking-tight">{benefit.label}</p>
                    <p className="text-lg text-forest font-serif font-bold">{benefit.amount}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest ${benefit.status === 'Eligible' ? 'bg-mint text-forest' : 'bg-taupe/20 text-charcoal/40'}`}>
                    {benefit.status}
                  </span>
                </div>
              ))}
            </div>
            <button className="w-full mt-10 py-4 bg-charcoal text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-charcoal/90 transition-all shadow-xl">
              Apply for Benefits
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
