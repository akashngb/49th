import React from 'react';
import { motion } from 'motion/react';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Download, 
  AlertCircle,
  ChevronRight,
  Info
} from 'lucide-react';

const docs = [
  {
    id: 'sin',
    name: 'Social Insurance Number (SIN)',
    desc: 'Required for working in Canada and accessing government programs.',
    status: 'done',
    who: 'All workers & residents',
    how: 'Apply online or at Service Canada',
    requirements: ['Primary ID (PR Card/Work Permit)', 'Secondary ID', 'Proof of Address']
  },
  {
    id: 'health',
    name: 'Provincial Health Card',
    desc: 'Covers essential medical services and hospital visits.',
    status: 'ready',
    who: 'All residents',
    how: 'Apply at your provincial health office',
    requirements: ['Proof of Status', 'Proof of Residency', 'Identity Document']
  },
  {
    id: 'dl',
    name: 'Driver\'s License Exchange',
    desc: 'Exchange your foreign license for a Canadian one.',
    status: 'ready',
    who: 'Drivers',
    how: 'Visit a DriveTest centre',
    requirements: ['Original License', 'Translation (if needed)', 'Proof of Experience']
  },
  {
    id: 'pr',
    name: 'PR Card Renewal',
    desc: 'Keep your permanent residency status card up to date.',
    status: 'locked',
    who: 'Permanent Residents',
    how: 'Apply via IRCC Portal',
    requirements: ['Current PR Card', 'Travel History', 'Photos']
  }
];

export const Documents = () => {
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
            <span className="italic text-terracotta text-5xl md:text-7xl">Archive.</span>
          </h1>
          <p className="text-xl text-charcoal/60 leading-relaxed font-light">
            Your essential Canadian government documentation. 
            A curated architecture of identity and legal status.
          </p>
        </div>

        <button className="flex items-center gap-3 px-8 py-4 bg-white border border-taupe rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-cream transition-all shadow-sm group">
          <Download size={16} className="text-forest group-hover:scale-110 transition-transform" /> Download All Guides
        </button>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Main Document List */}
        <div className="lg:col-span-8 space-y-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {docs.map((doc, i) => (
              <motion.div 
                key={doc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className={`bg-white rounded-[3rem] border card-shadow overflow-hidden flex flex-col group transition-all duration-700 ${
                  doc.status === 'done' ? 'border-mint' : 
                  doc.status === 'ready' ? 'border-forest/20' : 
                  'border-taupe opacity-60'
                }`}
              >
                <div className="p-10 flex-1">
                  <div className="flex items-start justify-between mb-10">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                      doc.status === 'done' ? 'bg-mint text-forest group-hover:bg-forest group-hover:text-white' : 'bg-cream text-charcoal/40 group-hover:bg-taupe/20'
                    }`}>
                      <FileText size={32} />
                    </div>
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                      doc.status === 'done' ? 'bg-mint text-forest' : 
                      doc.status === 'ready' ? 'bg-terracotta/10 text-terracotta' : 
                      'bg-taupe/20 text-charcoal/40'
                    }`}>
                      {doc.status === 'done' ? 'Completed' : doc.status === 'ready' ? 'Action Required' : 'Locked'}
                    </div>
                  </div>

                  <h3 className="text-3xl font-serif font-bold text-charcoal mb-4">{doc.name}</h3>
                  <p className="text-charcoal/60 text-lg leading-relaxed mb-10 font-light italic">{doc.desc}</p>

                  <div className="space-y-8">
                    <div className="grid grid-cols-2 gap-8">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-charcoal/30 mb-2">Who needs it</p>
                        <p className="text-sm font-bold text-charcoal tracking-tight">{doc.who}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-charcoal/30 mb-2">How to apply</p>
                        <p className="text-sm font-bold text-charcoal tracking-tight">{doc.how}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-charcoal/30 mb-4">Required Documents</p>
                      <div className="flex flex-wrap gap-3">
                        {doc.requirements.map(req => (
                          <span key={req} className="px-4 py-2 bg-cream border border-taupe/30 rounded-xl text-[10px] font-bold text-charcoal/60 uppercase tracking-widest">
                            {req}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-cream/30 border-t border-taupe/30 flex items-center justify-between gap-6">
                  <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-forest hover:underline">
                    Detailed guide <ChevronRight size={14} />
                  </button>
                  <button className={`px-8 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all duration-500 shadow-lg ${
                    doc.status === 'done' ? 'bg-white text-forest border border-mint shadow-mint/10' : 
                    doc.status === 'ready' ? 'bg-forest text-white hover:bg-forest/90 shadow-forest/20' : 
                    'bg-taupe/20 text-charcoal/40 cursor-not-allowed shadow-none'
                  }`}>
                    {doc.status === 'done' ? 'View Document' : 'Apply Now'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Sidebar Help Card */}
        <div className="lg:col-span-4 space-y-12">
          <div className="bg-forest text-white p-12 rounded-[3rem] shadow-2xl shadow-forest/30 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-mint/10 rounded-full -mr-24 -mt-24 blur-3xl group-hover:bg-mint/20 transition-colors duration-700" />
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-10">
              <AlertCircle size={32} className="text-mint" />
            </div>
            <h3 className="text-3xl font-serif font-bold mb-6 leading-tight">Need <br />Support?</h3>
            <p className="text-lg opacity-80 leading-relaxed mb-12 font-light italic">
              "Our AI assistant can help you fill out forms, translate requirements, and find the nearest Service Canada office."
            </p>
            <button className="w-full py-5 bg-white text-forest rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-mint transition-all shadow-xl">
              Ask Assistant
            </button>
          </div>

          <div className="bg-white p-10 rounded-[3rem] border border-taupe card-shadow">
            <div className="flex items-center gap-3 mb-10">
              <span className="w-8 h-[1px] bg-charcoal/20"></span>
              <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-charcoal/40">Upcoming Deadlines</h3>
            </div>
            <div className="space-y-8">
              {[
                { label: 'PR Card Renewal', date: 'Oct 12, 2024', type: 'Renewal' },
                { label: 'Health Card Update', date: 'Nov 05, 2024', type: 'Action' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-6 group cursor-pointer">
                  <div className="w-12 h-12 bg-cream rounded-xl flex items-center justify-center text-charcoal/40 group-hover:bg-forest group-hover:text-white transition-all duration-500">
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-charcoal tracking-tight">{item.label}</p>
                    <p className="text-[10px] text-charcoal/40 uppercase tracking-widest mt-1">{item.date} • {item.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
