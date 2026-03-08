import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  FileText,
  Clock,
  Download,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { useState, useRef } from 'react';
import {
  runBrowserTask,
  getBrowserStatus,
  pauseBrowserTask,
  resumeBrowserTask,
  stopBrowserTask,
  answerBrowserQuestion
} from '../api';
import { BrowserTaskPanel, type BrowserPanel } from '../components/BrowserTaskPanel';
import { AdvancedImage, placeholder, lazyload } from '@cloudinary/react';
import { fill } from '@cloudinary/url-gen/actions/resize';
import { format, quality } from '@cloudinary/url-gen/actions/delivery';
import { auto } from '@cloudinary/url-gen/qualifiers/format';
import { auto as autoQuality } from '@cloudinary/url-gen/qualifiers/quality';
import { autoGravity } from '@cloudinary/url-gen/qualifiers/gravity';
import { cld } from '../cloudinary/config';
import { UploadWidget } from '../cloudinary/UploadWidget';
import type { CloudinaryUploadResult } from '../cloudinary/UploadWidget';

const docs = [
  {
    id: 'apply_for_sin',
    name: 'Social Insurance Number (SIN)',
    desc: 'Required for working in Canada and accessing government programs.',
    status: 'done',
    who: 'All workers & residents',
    how: 'Apply online or at Service Canada',
    requirements: ['Primary ID (PR Card/Work Permit)', 'Secondary ID', 'Proof of Address']
  },
  {
    id: 'register_health_card',
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
  const navigate = useNavigate();
  const [panel, setPanel] = useState<BrowserPanel | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [uploadedImageId, setUploadedImageId] = useState<string | null>(null);

  const handleUploadSuccess = (result: CloudinaryUploadResult) => {
    console.log('Upload successful:', result);
    setUploadedImageId(result.public_id);
  };

  const handleUploadError = (error: Error) => {
    console.error('Upload error:', error);
    alert(`Upload failed: ${error.message}`);
  };

  const displayImage = cld
    .image(uploadedImageId || 'samples/people/bicycle')
    .resize(fill().width(400).height(300).gravity(autoGravity()))
    .delivery(format(auto()))
    .delivery(quality(autoQuality()));

  const handleExecute = (doc: typeof docs[0]) => {
    if (doc.status === 'locked' || doc.status === 'done') return;
    window.dispatchEvent(new CustomEvent('open-ai-chat', {
      detail: { message: `I need to apply for my ${doc.name}. Can you automate this for me and fill out the form?` }
    }));
  };

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
          <h1 className="text-6xl md:text-8xl font-serif font-bold text-forest leading-[0.85] tracking-tighter mb-8 flex items-baseline gap-4 md:gap-6">
            The
            <span className="italic text-terracotta text-5xl md:text-7xl">Archive.</span>
          </h1>
          <p className="text-xl text-charcoal/60 leading-relaxed font-light">
            Your essential Canadian government documentation.
            A curated architecture of identity and legal status.
          </p>
        </div>

        <button className="flex items-center gap-3 px-6 py-4 bg-white border border-taupe rounded-sm text-[10px] font-bold uppercase tracking-widest hover:bg-cream transition-all shadow-sm group">
          <Download size={16} className="text-forest group-hover:scale-110 transition-transform" /> Download All Guides
        </button>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Main Document List */}
        <div className="lg:col-span-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {docs.map((doc, i) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className={`bg-white rounded-sm border shadow-sm overflow-hidden flex flex-col group transition-all duration-300 ${doc.status === 'done' ? 'border-mint' :
                  doc.status === 'ready' ? 'border-forest/20' :
                    'border-taupe opacity-60'
                  }`}
              >
                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex items-start justify-between mb-8">
                    <div className={`w-12 h-12 rounded-sm flex items-center justify-center transition-all duration-300 ${doc.status === 'done' ? 'bg-mint text-forest group-hover:bg-forest group-hover:text-white' : 'bg-cream text-charcoal/40 group-hover:bg-taupe/20'
                      }`}>
                      <FileText size={20} />
                    </div>
                    <div className={`px-3 py-1 rounded-sm text-[9px] font-bold uppercase tracking-widest border ${doc.status === 'done' ? 'bg-mint/10 border-mint/30 text-forest' :
                      doc.status === 'ready' ? 'bg-terracotta/5 border-terracotta/20 text-terracotta' :
                        'bg-taupe/10 border-taupe/20 text-charcoal/40'
                      }`}>
                      {doc.status === 'done' ? 'Completed' : doc.status === 'ready' ? 'Action Required' : 'Locked'}
                    </div>
                  </div>

                  <h3 className="text-2xl font-serif font-bold text-charcoal mb-3 leading-tight">{doc.name}</h3>
                  <p className="text-charcoal/60 text-base leading-relaxed mb-8 font-light flex-1">{doc.desc}</p>

                  <div className="space-y-6 flex-shrink-0">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-charcoal/40 mb-1">Who needs it</p>
                        <p className="text-sm font-medium text-charcoal/80 tracking-tight">{doc.who}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-widest text-charcoal/40 mb-1">How to apply</p>
                        <p className="text-sm font-medium text-charcoal/80 tracking-tight">{doc.how}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-widest text-charcoal/40 mb-3">Required Documents</p>
                      <div className="flex flex-wrap gap-2">
                        {doc.requirements.map(req => (
                          <span key={req} className="px-3 py-1.5 bg-cream border border-taupe/30 rounded-sm text-[9px] font-bold text-charcoal/60 uppercase tracking-widest">
                            {req}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-cream/30 border-t border-taupe/30 flex items-center justify-between gap-4">
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('open-ai-chat', {
                      detail: { message: `Can you show me a detailed guide for ${doc.name}? I want to understand the process before I start.` }
                    }))}
                    className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-forest hover:underline"
                  >
                    Detailed guide <ChevronRight size={14} />
                  </button>
                  <button
                    onClick={() => handleExecute(doc)}
                    disabled={doc.status === 'locked' || doc.status === 'done'}
                    className={`px-6 py-3 rounded-sm font-bold text-[9px] uppercase tracking-widest transition-all duration-300 ${doc.status === 'locked' || doc.status === 'done' ? 'hidden' : 'bg-forest text-white hover:bg-forest/90 shadow-sm shadow-forest/10'
                      }`}>
                    Apply Now
                  </button>
                  {doc.status === 'done' && (
                    <button
                      onClick={() => window.dispatchEvent(new CustomEvent('open-ai-chat', {
                        detail: { message: `I've finished my ${doc.name}. Can I see the completed form or check if any further steps are needed?` }
                      }))}
                      className="px-6 py-3 rounded-sm font-bold text-[9px] uppercase tracking-widest transition-all duration-300 bg-white text-forest border border-mint shadow-sm shadow-mint/10 hover:bg-mint/10"
                    >
                      View Form
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Sidebar Help Card */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-forest text-white p-10 rounded-sm shadow-md relative overflow-hidden group border border-forest">
            <div className="w-12 h-12 bg-white/10 rounded-sm flex items-center justify-center mb-8 border border-white/10">
              <AlertCircle size={24} className="text-mint" />
            </div>
            <h3 className="text-2xl font-serif font-bold mb-4 leading-tight">Need <br />Support?</h3>
            <p className="text-base opacity-80 leading-relaxed mb-8 font-light italic">
              "Our AI assistant can help you fill out forms, translate requirements, and find the nearest Service Canada office."
            </p>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-ai-chat', {
                detail: { message: "I want to upload a document to help fill out my settlement forms. Can you help me?" }
              }))}
              className="w-full py-4 bg-white text-forest rounded-sm text-[10px] font-bold uppercase tracking-widest hover:bg-mint transition-all shadow-sm"
            >
              Ask Assistant
            </button>
          </div>

          <div className="bg-white p-8 rounded-sm border border-ink shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <span className="w-6 h-[1px] bg-charcoal/20"></span>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-charcoal/40">Upcoming Deadlines</h3>
            </div>
            <div className="space-y-6">
              {[
                { label: 'PR Card Renewal', date: 'Oct 12, 2024', type: 'Renewal' },
                { label: 'Health Card Update', date: 'Nov 05, 2024', type: 'Action' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 group cursor-pointer border-b border-ink/40 pb-4 last:border-0 last:pb-0">
                  <div className="w-10 h-10 bg-cream border border-ink/30 rounded-sm flex items-center justify-center text-charcoal/40 group-hover:bg-forest group-hover:text-white transition-all duration-300">
                    <Clock size={16} />
                  </div>
                  <div>
                    <p className="font-bold text-sm text-charcoal tracking-tight group-hover:text-forest transition-colors">{item.label}</p>
                    <p className="text-[9px] text-charcoal/40 uppercase tracking-widest mt-1">{item.date} • {item.type}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cloudinary Upload Card */}
          <div className="bg-white p-10 rounded-[3rem] border border-taupe card-shadow">
            <div className="flex items-center gap-3 mb-8">
              <span className="w-8 h-[1px] bg-charcoal/20"></span>
              <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-charcoal/40">ID Verification</h3>
            </div>
            <p className="text-sm text-charcoal/60 mb-6 font-light">Securely upload a photo of your identification documents.</p>
            <div className="mb-6 flex justify-center">
              <UploadWidget
                onUploadSuccess={handleUploadSuccess}
                onUploadError={handleUploadError}
                buttonText="Upload ID Image"
                className="w-full py-4 bg-terracotta text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-terracotta/90 transition-all shadow-xl"
              />
            </div>
            {uploadedImageId && (
              <div className="rounded-2xl overflow-hidden border border-taupe/30">
                <AdvancedImage
                  cldImg={displayImage}
                  plugins={[placeholder({ mode: 'blur' }), lazyload()]}
                  alt="Uploaded ID"
                  className="w-full h-auto object-cover"
                />
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};
