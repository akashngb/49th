import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowLeft,
  Globe,
  MapPin,
  UserCircle,
  Users,
  GraduationCap,
  Briefcase,
  Calendar,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

const steps = [
  {
    id: 'origin',
    title: 'Where are you coming from?',
    subtitle: 'This helps us understand your cultural context and language needs.',
    icon: Globe,
    fields: [
      { name: 'country', label: 'Country of Origin', type: 'select', options: ['Brazil', 'India', 'Pakistan', 'Philippines', 'Ukraine', 'Nigeria', 'Other'] },
      { name: 'language', label: 'Preferred Language', type: 'select', options: ['English', 'French', 'Spanish', 'Portuguese', 'Hindi', 'Urdu', 'Tagalog', 'Ukrainian'] }
    ]
  },
  {
    id: 'destination',
    title: 'Where are you settling?',
    subtitle: 'Immigration rules and services vary by province.',
    icon: MapPin,
    fields: [
      { name: 'province', label: 'Current Province', type: 'select', options: ['Ontario', 'British Columbia', 'Alberta', 'Quebec', 'Manitoba', 'Nova Scotia'] },
      { name: 'city', label: 'City', type: 'text', placeholder: 'e.g. Toronto' },
      { name: 'arrivalDate', label: 'Arrival Date', type: 'date' }
    ]
  },
  {
    id: 'status',
    title: 'What is your status?',
    subtitle: 'Your legal status determines the benefits you can access.',
    icon: UserCircle,
    fields: [
      { name: 'status', label: 'Immigration Status', type: 'select', options: ['Permanent Resident', 'Work Permit', 'Study Permit', 'Refugee Claimant', 'Citizen'] },
      { name: 'profession', label: 'Profession', type: 'text', placeholder: 'e.g. Software Engineer' },
      { name: 'education', label: 'Highest Education', type: 'select', options: ['High School', 'Bachelor\'s', 'Master\'s', 'PhD', 'Trade Certificate'] }
    ]
  },
  {
    id: 'family',
    title: 'Tell us about your family.',
    subtitle: 'We provide specialized support for spouses and children.',
    icon: Users,
    fields: [
      { name: 'maritalStatus', label: 'Marital Status', type: 'select', options: ['Single', 'Married', 'Common-law', 'Divorced'] },
      { name: 'children', label: 'Number of Children', type: 'number', placeholder: '0' }
    ]
  }
];

export const OnboardingPage = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<any>({});
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [aiTasks, setAiTasks] = useState<any[]>([]);
  const navigate = useNavigate();

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsLoading(true);
      try {
        const { submitOnboarding } = await import('../api');
        const profile = {
          answers: [
            formData.country || 'Unknown',
            formData.status || 'PR',
            formData.profession || 'Professional',
            formData.maritalStatus === 'Single' ? 'alone' : 'family',
            'settling in'
          ],
          questions: steps.map(s => s.title),
          city: formData.city || 'Toronto',
          province: formData.province || 'Ontario',
        };
        const result = await submitOnboarding(profile);
        setAiTasks(result.tasks || []);
      } catch {
        setAiTasks([]);
      }
      setIsLoading(false);
      setIsComplete(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleChange = (name: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const step = steps[currentStep];

  if (isComplete) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-5xl w-full bg-white rounded-[4rem] p-16 md:p-24 shadow-2xl border border-ink text-center relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-forest/5 rounded-full -mr-80 -mt-80 blur-[100px]" />
          <div className="absolute bottom-0 left-0 w-[40rem] h-[40rem] bg-terracotta/5 rounded-full -ml-80 -mb-80 blur-[100px]" />

          <div className="w-32 h-32 bg-forest text-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-16 shadow-2xl shadow-forest/30">
            <CheckCircle2 size={64} />
          </div>
          <h1 className="text-6xl md:text-[100px] font-serif font-bold text-forest mb-10 tracking-[-0.04em] leading-[0.85]">
            Welcome home, <br />
            <span className="italic text-terracotta skew-x-[-10deg] inline-block">{formData.name || 'Newcomer'}.</span>
          </h1>
          <p className="text-2xl text-charcoal/50 mb-20 font-light max-w-3xl mx-auto leading-relaxed">
            The architecture of your new life is ready. We've synthesized your context into a <span className="text-charcoal font-bold italic underline decoration-mint underline-offset-8">30-day masterplan</span>.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-20 text-left">
            {aiTasks.length > 0 ? (
              <>
                <div className="p-12 bg-mint/10 rounded-[3rem] border border-ink group hover:bg-mint/20 transition-all duration-700">
                  <h3 className="text-[10px] font-bold text-forest mb-8 flex items-center gap-4 uppercase tracking-[0.4em]">
                    <Sparkles size={20} /> Critical (Week 1)
                  </h3>
                  <ul className="space-y-6 text-forest/80 font-serif italic text-2xl">
                    {aiTasks.filter(t => t.urgency === 'critical').slice(0, 3).map((t, i) => (
                      <li key={i}>{t.title}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-12 bg-terracotta/5 rounded-[3rem] border border-ink group hover:bg-terracotta/10 transition-all duration-700">
                  <h3 className="text-[10px] font-bold text-terracotta mb-8 flex items-center gap-4 uppercase tracking-[0.4em]">
                    <Calendar size={20} /> High Priority
                  </h3>
                  <ul className="space-y-6 text-terracotta/80 font-serif italic text-2xl">
                    {aiTasks.filter(t => t.urgency === 'high').slice(0, 3).map((t, i) => (
                      <li key={i}>{t.title}</li>
                    ))}
                  </ul>
                </div>
                <div className="p-12 bg-charcoal/5 rounded-[3rem] border border-ink group hover:bg-charcoal/10 transition-all duration-700">
                  <h3 className="text-[10px] font-bold text-charcoal mb-8 flex items-center gap-4 uppercase tracking-[0.4em]">
                    <Briefcase size={20} /> Coming Up
                  </h3>
                  <ul className="space-y-6 text-charcoal/70 font-serif italic text-2xl">
                    {aiTasks.filter(t => t.urgency === 'medium' || t.urgency === 'low').slice(0, 3).map((t, i) => (
                      <li key={i}>{t.title}</li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <>
                <div className="p-12 bg-mint/10 rounded-[3rem] border border-ink group hover:bg-mint/20 transition-all duration-700">
                  <h3 className="text-[10px] font-bold text-forest mb-8 flex items-center gap-4 uppercase tracking-[0.4em]">
                    <Sparkles size={20} /> First Steps
                  </h3>
                  <ul className="space-y-6 text-forest/80 font-serif italic text-2xl">
                    <li>Apply for SIN</li>
                    <li>Open Bank Account</li>
                    <li>Get SIM Card</li>
                  </ul>
                </div>
                <div className="p-12 bg-terracotta/5 rounded-[3rem] border border-ink group hover:bg-terracotta/10 transition-all duration-700">
                  <h3 className="text-[10px] font-bold text-terracotta mb-8 flex items-center gap-4 uppercase tracking-[0.4em]">
                    <Calendar size={20} /> 30-Day Goal
                  </h3>
                  <ul className="space-y-6 text-terracotta/80 font-serif italic text-2xl">
                    <li>Health Card</li>
                    <li>School Enrollment</li>
                    <li>Housing Search</li>
                  </ul>
                </div>
                <div className="p-12 bg-charcoal/5 rounded-[3rem] border border-ink group hover:bg-charcoal/10 transition-all duration-700">
                  <h3 className="text-[10px] font-bold text-charcoal mb-8 flex items-center gap-4 uppercase tracking-[0.4em]">
                    <Briefcase size={20} /> Career Path
                  </h3>
                  <ul className="space-y-6 text-charcoal/70 font-serif italic text-2xl">
                    <li>Credential Review</li>
                    <li>Resume Workshop</li>
                    <li>Local Networking</li>
                  </ul>
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-8 bg-forest text-white rounded text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-forest/90 transition-all shadow-2xl shadow-forest/30 flex items-center justify-center gap-6 group"
          >
            Enter your dashboard <ArrowRight size={24} className="group-hover:translate-x-4 transition-transform" />
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8 overflow-hidden">
      <div className="max-w-7xl w-full flex flex-col lg:flex-row gap-32 items-center">
        {/* Left Side - Info */}
        <div className="flex-1 space-y-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-20 h-20 bg-forest rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-forest/30"
          >
            <Sparkles size={40} />
          </motion.div>
          <div className="space-y-10">
            <h2 className="text-7xl md:text-[120px] font-serif font-bold text-forest leading-[0.82] tracking-[-0.04em]">
              The <br />
              <span className="text-terracotta italic skew-x-[-10deg] inline-block">Personal</span> <br />
              Roadmap.
            </h2>
            <p className="text-2xl text-charcoal/50 leading-relaxed font-light max-w-lg">
              Every journey to Canada is unique. By sharing your context, we architect the exact guidance you need for your specific situation.
            </p>
          </div>

          <div className="flex gap-6 pt-12">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-1000 ${idx === currentStep ? 'w-24 bg-forest' : 'w-6 bg-ink/10'}`}
              />
            ))}
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="flex-1 w-full relative">
          <div className="absolute -inset-10 bg-forest/5 rounded-[5rem] blur-[80px]" />
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative bg-white rounded-[4rem] p-16 md:p-20 shadow-2xl border border-ink"
          >
            <div className="flex items-center gap-10 mb-16">
              <div className="w-20 h-20 bg-cream rounded-[2rem] flex items-center justify-center text-forest shadow-inner border border-ink/5">
                <step.icon size={40} />
              </div>
              <div>
                <h3 className="text-4xl font-serif font-bold text-charcoal leading-tight">{step.title}</h3>
                <p className="text-[10px] text-charcoal/30 uppercase tracking-[0.4em] mt-3 font-bold">{step.subtitle}</p>
              </div>
            </div>

            <div className="space-y-12 mb-20">
              {step.fields.map((field) => (
                <div key={field.name} className="group">
                  <label className="block text-[10px] font-bold uppercase tracking-[0.3em] text-charcoal/40 mb-6 group-focus-within:text-forest transition-colors">{field.label}</label>
                  {field.type === 'select' ? (
                    <div className="relative">
                      <select
                        className="w-full px-10 py-6 bg-cream/30 border border-ink rounded-md focus:outline-none focus:ring-4 focus:ring-mint/20 text-charcoal font-medium tracking-wide appearance-none cursor-pointer"
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        value={formData[field.name] || ''}
                      >
                        <option value="">Select an option</option>
                        {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                      <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-charcoal/30">
                        <ArrowRight size={20} className="rotate-90" />
                      </div>
                    </div>
                  ) : (
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      className="w-full px-10 py-6 bg-cream/30 border border-ink rounded-md focus:outline-none focus:ring-4 focus:ring-mint/20 text-charcoal font-medium tracking-wide"
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      value={formData[field.name] || ''}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-10">
              <button
                onClick={handleBack}
                disabled={currentStep === 0}
                className={`flex items-center gap-4 px-10 py-6 rounded text-[10px] font-bold uppercase tracking-[0.4em] transition-all ${currentStep === 0 ? 'text-charcoal/20 cursor-not-allowed' : 'text-charcoal hover:bg-cream hover:text-forest'}`}
              >
                <ArrowLeft size={20} /> Back
              </button>
              <button
                onClick={handleNext}
                className="flex-1 flex items-center justify-center gap-6 px-12 py-8 bg-forest text-white rounded text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-forest/90 transition-all shadow-2xl shadow-forest/30 group"
              >
                {currentStep === steps.length - 1 ? 'Generate Roadmap' : 'Continue'} <ArrowRight size={24} className="group-hover:translate-x-4 transition-transform" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
