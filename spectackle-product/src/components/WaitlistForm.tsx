import { useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import { trackEvent } from '../lib/firebase';

interface WaitlistFormProps {
  placeholder?: string;
  buttonText?: string;
  successMessage?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function WaitlistForm({
  placeholder = 'Enter your email...',
  buttonText = 'Join the Waitlist →',
  successMessage = "You're on the list! We'll keep you posted.",
  size = 'md'
}: WaitlistFormProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');

    if (supabase) {
      try {
        const { error } = await supabase.from('waitlist').insert([{ email }]);
        if (error) throw error;
        setStatus('success');
        trackEvent("waitlist_submitted", { source: "inline_form" });
      } catch (err: any) {
        console.error('Waitlist submission error:', err);
        setStatus('error');
        trackEvent("waitlist_submission_failed", {
          source: "inline_form",
          error: err?.message || "unknown_error"
        });
      }
    } else {
      // Graceful fallback for local development without DB keys
      setTimeout(() => {
        setStatus('success');
        trackEvent("waitlist_submitted", { source: "inline_form", offline_demo: true });
      }, 600);
    }
  };

  const isSmall = size === 'sm';

  if (status === 'success') {
    return (
      <div className={`bg-[#F4F9F6] border border-[#A7D7BC] text-brand-dark px-6 ${isSmall ? 'py-2.5' : 'py-3.5'} rounded-full text-sm font-bold flex items-center justify-center gap-2 transition-all w-full max-w-md`}>
        <span className="text-brand-green">✓</span>
        <span>{successMessage}</span>
      </div>
    );
  }

  return (
    <form 
      onSubmit={handleSubmit}
      className={`group flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 p-1.5 bg-white border border-gray-200/80 rounded-2xl sm:rounded-full shadow-sm w-full max-w-md transition-all hover:border-gray-300 focus-within:border-brand-green/40 focus-within:ring-4 focus-within:ring-brand-green/10`}
    >
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={placeholder}
        disabled={status === 'loading'}
        className={`px-4 ${isSmall ? 'py-1.5' : 'py-2.5'} text-sm text-gray-800 bg-transparent border-0 focus:outline-none focus:ring-0 flex-1 font-medium placeholder-gray-400 disabled:opacity-50`}
      />
      <button
        type="submit"
        disabled={status === 'loading'}
        className={`inline-flex items-center justify-center gap-1.5 bg-brand-green hover:bg-[#257341] text-white px-5 sm:px-6 ${isSmall ? 'py-2.5' : 'py-3'} rounded-xl sm:rounded-full text-xs sm:text-sm font-bold shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-95 shrink-0 disabled:opacity-70 disabled:hover:translate-y-0`}
      >
        <span>{status === 'loading' ? 'Joining...' : buttonText}</span>
      </button>
    </form>
  );
}
