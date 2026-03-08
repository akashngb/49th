import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
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
  const { loginWithRedirect, isAuthenticated, user } = useAuth0();

  const handleEnterDashboard = () => {
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      loginWithRedirect({
        authorizationParams: {
          redirect_uri: window.location.origin + '/phone-link'
        }
      });
    }
  };

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

        // Task 10 — sync profile to Auth0 user_metadata
        if (user?.sub) {
          const { syncProfileToAuth0 } = await import('../api');
          syncProfileToAuth0(user.sub, {
            city: formData.city,
            status: formData.status,
            profession: formData.profession,
            country: formData.country,
            arrivalDate: formData.arrivalDate,
            family: formData.maritalStatus === 'Single' ? 'alone' : 'family',
            concern: 'settling in',
            language: formData.language || 'English',
          }).catch(console.error);
        }
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
      <div className="h-screen w-full flex flex-col lg:flex-row overflow-hidden bg-cream">

        {/* Left Side: Welcome Message & CTA */}
        <div className="flex-1 lg:max-w-xl bg-forest p-8 lg:p-16 flex flex-col justify-center lg:justify-between text-white relative">
          <div className="relative z-10 hidden lg:block">
            <div className="w-12 h-12 bg-white/10 flex items-center justify-center mb-12 rounded-sm">
              <CheckCircle2 size={24} className="text-mint" />
            </div>
          </div>

          <div className="relative z-10 flex-1 flex flex-col justify-center lg:justify-start">
            <h1 className="text-4xl lg:text-6xl font-serif font-bold mb-6 tracking-tight leading-[1.1]">
              Welcome home, <br />
              <span className="italic text-terracotta">{formData.name || 'Newcomer'}.</span>
            </h1>

            <p className="text-base lg:text-lg text-white/70 leading-relaxed font-medium max-w-md mb-12">
              The architecture of your new life is ready. We've synthesized your context into a <span className="font-bold text-white border-b border-white/30 pb-0.5">30-day masterplan</span>.
            </p>

            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex py-4 px-8 bg-white text-forest rounded-sm text-[10px] uppercase tracking-widest font-bold transition-all hover:bg-cream hover:text-forest items-center justify-between group w-full lg:w-auto self-start mt-auto lg:mt-0 shadow-xl shadow-black/10"
            >
              Enter dashboard <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform ml-8" />
            </button>
          </div>

          {/* Subtle background grain/gradient for depth */}
          <div className="absolute inset-0 bg-charcoal/5 pointer-events-none" />
        </div>

        {/* Right Side: The Itinerary */}
        <div className="flex-[1.5] bg-cream p-8 lg:p-16 flex items-center justify-center relative shadow-[-20px_0_40px_rgba(0,0,0,0.02)] z-10">
          <div className="w-full max-w-2xl mx-auto space-y-6 lg:space-y-10">
            {aiTasks.length > 0 ? (
              <>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-12 items-start sm:items-baseline">
                  <div className="w-32 flex-shrink-0 text-[9px] font-bold text-forest uppercase tracking-[0.2em]">
                    Critical (Week 1)
                  </div>
                  <ul className="flex-1 space-y-2 lg:space-y-4 font-serif text-lg lg:text-2xl text-charcoal/90">
                    {aiTasks.filter(t => t.urgency === 'critical').slice(0, 3).map((t, i) => (
                      <li key={i}>{t.title}</li>
                    ))}
                  </ul>
                </div>

                <div className="w-full h-px bg-ink/30" />

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-12 items-start sm:items-baseline">
                  <div className="w-32 flex-shrink-0 text-[9px] font-bold text-terracotta uppercase tracking-[0.2em]">
                    High Priority
                  </div>
                  <ul className="flex-1 space-y-2 lg:space-y-4 font-serif text-lg lg:text-2xl text-charcoal/90">
                    {aiTasks.filter(t => t.urgency === 'high').slice(0, 3).map((t, i) => (
                      <li key={i}>{t.title}</li>
                    ))}
                  </ul>
                </div>

                <div className="w-full h-px bg-ink/30" />

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-12 items-start sm:items-baseline">
                  <div className="w-32 flex-shrink-0 text-[9px] font-bold text-charcoal uppercase tracking-[0.2em]">
                    Coming Up
                  </div>
                  <ul className="flex-1 space-y-2 lg:space-y-4 font-serif text-lg lg:text-2xl text-charcoal/70 italic">
                    {aiTasks.filter(t => t.urgency === 'medium' || t.urgency === 'low').slice(0, 3).map((t, i) => (
                      <li key={i}>{t.title}</li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-12 items-start sm:items-baseline text-left">
                  <div className="w-32 flex-shrink-0 text-[9px] font-bold text-forest uppercase tracking-[0.2em]">
                    First Steps
                  </div>
                  <ul className="flex-1 space-y-2 lg:space-y-4 font-serif text-lg lg:text-2xl text-charcoal/90">
                    <li>Apply for Social Insurance Number (SIN)</li>
                    <li>Open a Canadian Bank Account</li>
                    <li>Obtain a local SIM Card</li>
                  </ul>
                </div>

                <div className="w-full h-px bg-ink/30" />

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-12 items-start sm:items-baseline text-left">
                  <div className="w-32 flex-shrink-0 text-[9px] font-bold text-terracotta uppercase tracking-[0.2em]">
                    30-Day Goal
                  </div>
                  <ul className="flex-1 space-y-2 lg:space-y-4 font-serif text-lg lg:text-2xl text-charcoal/90">
                    <li>Apply for Provincial Health Card</li>
                    <li>Initiate School Enrollment</li>
                    <li>Begin Long-term Housing Search</li>
                  </ul>
                </div>

                <div className="w-full h-px bg-ink/30" />

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-12 items-start sm:items-baseline text-left">
                  <div className="w-32 flex-shrink-0 text-[9px] font-bold text-charcoal uppercase tracking-[0.2em]">
                    Career Path
                  </div>
                  <ul className="flex-1 space-y-2 lg:space-y-4 font-serif text-lg lg:text-2xl text-charcoal/70 italic">
                    <li>Submit Credential Review</li>
                    <li>Attend Resume Workshop</li>
                    <li>Join Local Networking Events</li>
                  </ul>
                </div>
              </>
            )}
          </div>
          <button
            onClick={handleEnterDashboard}
            className="w-full py-8 bg-forest text-white rounded text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-forest/90 transition-all shadow-2xl shadow-forest/30 flex items-center justify-center gap-6 group"
          >
            Enter your dashboard <ArrowRight size={24} className="group-hover:translate-x-4 transition-transform" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-8 overflow-hidden">
      <div className="max-w-6xl w-full flex flex-col lg:flex-row gap-16 lg:gap-24 items-center">
        {/* Left Side - Info */}
        <div className="flex-1 space-y-10">
          <div className="space-y-6">
            <h2 className="text-4xl md:text-6xl font-serif font-bold text-forest leading-[1.1] tracking-tight">
              The Personal Roadmap.
            </h2>
            <p className="text-lg text-charcoal/60 leading-relaxed max-w-lg">
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
        <div className="flex-1 w-full max-w-xl mx-auto">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 md:p-12 border border-ink"
          >
            <div className="flex flex-col gap-4 mb-10">
              <div className="flex items-center gap-3">
                <step.icon size={24} className="text-forest" />
                <h3 className="text-2xl font-serif font-bold text-charcoal leading-tight">{step.title}</h3>
              </div>
              <p className="text-xs text-charcoal/50 font-medium">{step.subtitle}</p>
            </div>

            <div className="space-y-8 mb-12">
              {step.fields.map((field) => (
                <div key={field.name} className="flex flex-col gap-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-charcoal/70">{field.label}</label>
                  {field.type === 'select' ? (
                    <div className="relative">
                      <select
                        className="w-full px-4 py-3 bg-white border border-ink rounded focus:outline-none focus:border-forest text-sm text-charcoal font-medium appearance-none cursor-pointer"
                        onChange={(e) => handleChange(field.name, e.target.value)}
                        value={formData[field.name] || ''}
                      >
                        <option value="">Select an option</option>
                        {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-charcoal/30">
                        <ArrowRight size={16} className="rotate-90" />
                      </div>
                    </div>
                  ) : (
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      className="w-full px-4 py-3 bg-white border border-ink rounded focus:outline-none focus:border-forest text-sm text-charcoal font-medium"
                      onChange={(e) => handleChange(field.name, e.target.value)}
                      value={formData[field.name] || ''}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-6">
              <button
                onClick={handleBack}
                disabled={currentStep === 0 || isLoading}
                className={`text-xs font-bold uppercase tracking-widest transition-colors ${currentStep === 0 || isLoading ? 'text-charcoal/20 cursor-not-allowed' : 'text-charcoal/60 hover:text-forest'}`}
              >
                Back
              </button>
              <button
                onClick={handleNext}
                disabled={isLoading}
                className={`flex items-center gap-3 px-8 py-4 rounded text-xs font-bold uppercase tracking-widest transition-all group ${isLoading ? 'bg-forest/50 cursor-not-allowed text-white' : 'bg-forest text-white hover:bg-forest/90'}`}
              >
                {isLoading ? (
                  <>Generating <span className="animate-pulse">...</span></>
                ) : (
                  <>{currentStep === steps.length - 1 ? 'Generate' : 'Continue'} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
