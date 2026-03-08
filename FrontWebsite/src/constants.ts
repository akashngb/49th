import {
  CheckCircle2,
  Clock,
  Lock,
  FileText,
  Stethoscope,
  GraduationCap,
  Briefcase,
  Users,
  TrendingUp,
  CreditCard,
  Home,
  Heart,
  ShieldCheck
} from 'lucide-react';

export type TaskStatus = 'locked' | 'ready' | 'done';

export interface SettlementTask {
  id: string;
  name: string;
  description: string;
  status: TaskStatus;
  timeEstimate: string;
  whyItMatters: string;
  unlocks: string;
  category: 'documents' | 'finance' | 'health' | 'education' | 'career' | 'housing';
  icon: any;
  requirementsUrl?: string;
}

export const SETTLEMENT_TASKS: SettlementTask[] = [
  {
    id: 'sin',
    name: 'Apply for SIN',
    description: 'Your Social Insurance Number is required to work and access government benefits.',
    status: 'done',
    timeEstimate: '1 hour',
    whyItMatters: 'Essential for employment and taxes.',
    unlocks: 'Employment, Bank Accounts',
    category: 'documents',
    icon: FileText
  },
  {
    id: 'bank',
    name: 'Open a Bank Account',
    description: 'Set up your Canadian financial foundation with a local chequing and savings account.',
    status: 'done',
    timeEstimate: '2 hours',
    whyItMatters: 'Safe storage for money and building credit.',
    unlocks: 'Credit Cards, Housing Payments',
    category: 'finance',
    icon: CreditCard
  },
  {
    id: 'sim',
    name: 'Get a SIM Card',
    description: 'A local phone number is vital for job applications and service registrations.',
    status: 'done',
    timeEstimate: '30 mins',
    whyItMatters: 'Stay connected and reachable.',
    unlocks: 'Two-factor auth, Job calls',
    category: 'documents',
    icon: ShieldCheck
  },
  {
    id: 'health',
    name: 'Provincial Healthcare',
    description: 'Register for your provincial health insurance card (e.g., OHIP, MSP).',
    status: 'ready',
    timeEstimate: '1 hour',
    whyItMatters: 'Covers essential medical services.',
    unlocks: 'Family Doctor, Specialists',
    category: 'health',
    icon: Stethoscope
  },
  {
    id: 'doctor',
    name: 'Find a Family Doctor',
    description: 'Connect with a primary care physician for long-term health management.',
    status: 'locked',
    timeEstimate: 'Ongoing',
    whyItMatters: 'Consistent healthcare and referrals.',
    unlocks: 'Preventative care',
    category: 'health',
    icon: Heart
  },
  {
    id: 'school',
    name: 'Register Children for School',
    description: 'Enroll your children in the local public or private school system.',
    status: 'ready',
    timeEstimate: '3 hours',
    whyItMatters: 'Ensures educational continuity.',
    unlocks: 'Community, Childcare',
    category: 'education',
    icon: GraduationCap
  },
  {
    id: 'career',
    name: 'Credential Recognition',
    description: 'Start the process of having your international degrees verified for Canada.',
    status: 'ready',
    timeEstimate: '2-4 weeks',
    whyItMatters: 'Required for licensed professions.',
    unlocks: 'Professional Jobs',
    category: 'career',
    icon: Briefcase
  },
  {
    id: 'housing',
    name: 'Secure Long-term Housing',
    description: 'Move from temporary accommodation to a permanent rental or home.',
    status: 'ready',
    timeEstimate: '2-4 weeks',
    whyItMatters: 'Stability and community roots.',
    unlocks: 'School catchment, Credit history',
    category: 'housing',
    icon: Home
  }
];

export const POLICY_ALERTS = [
  {
    id: '1',
    title: 'New Rental Rebate in Ontario',
    summary: 'The Ontario government has introduced a new rebate for first-time renters arriving in 2026.',
    tags: ['Affects your province', 'Financial'],
    date: '2 days ago'
  },
  {
    id: '2',
    title: 'Healthcare Wait-time Reduction',
    summary: 'New funding for family doctors in your area aims to reduce registration wait times by 30%.',
    tags: ['Health', 'Time-sensitive'],
    date: '1 week ago'
  },
  {
    id: '3',
    title: 'Credential Fast-track for Nurses',
    summary: 'International nursing credentials from selected countries now have a 50% faster verification path.',
    tags: ['Career-related', 'Important'],
    date: '3 days ago'
  }
];

export const PROXIES = [
  {
    id: 'p1',
    name: 'Elena Rodriguez',
    profession: 'Software Engineer',
    city: 'Toronto, ON',
    origin: 'Brazil',
    quote: "The first winter was hard, but finding a community made all the difference. You've got this.",
    match: 95
  },
  {
    id: 'p2',
    name: 'Amir Khan',
    profession: 'Accountant',
    city: 'Vancouver, BC',
    origin: 'Pakistan',
    quote: "Focus on your credit score early. It opens doors you didn't even know were closed.",
    match: 88
  },
  {
    id: 'p3',
    name: 'Sarah Chen',
    profession: 'Nurse',
    city: 'Calgary, AB',
    origin: 'Philippines',
    quote: "Registering my kids for school was my first real 'Canadian' moment. The schools here are wonderful.",
    match: 92
  }
];
