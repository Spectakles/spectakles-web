import { useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Copy, Mail } from 'lucide-react';
import { enquiryMailto, enquiryText, supportEmail, type Enquiry } from '../marketing/enquiry';
import { usePageMeta } from '../marketing/usePageMeta';
const empty: Enquiry = { name: '', email: '', organization: '', role: '', cohort: '', goal: '' };
export default function Contact() {
  usePageMeta('Discuss an institutional pilot — Spectakles', 'Tell Spectakles about your college placement programme, learners and GD practice goals. Prepare an institutional pilot enquiry.');
  const [value, setValue] = useState<Enquiry>(empty);
  const [draft, setDraft] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  const update = (key: keyof Enquiry, text: string) => setValue(previous => ({ ...previous, [key]: text }));
  const submit = (event: FormEvent) => { event.preventDefault(); setDraft(enquiryText(value)); setCopyStatus(''); };
  const copy = async () => {
    try { await navigator.clipboard.writeText(draft); setCopyStatus('Enquiry copied. Paste it into an email to contact@spectakles.in.'); }
    catch { setCopyStatus('Copy is unavailable here. Select the enquiry text below and copy it manually.'); }
  };
  return <section className="mkt-wrap mkt-contact"><div className="mkt-contact-copy"><p className="mkt-kicker">LET’S START WITH YOUR PROGRAMME</p><h1>A small pilot.<br /><em>A useful start.</em></h1><p className="mkt-lead">Tell us who you’re preparing and what you want students to practise. We’ll discuss a scope that makes sense for your team.</p><div className="mkt-contact-expect"><h2>What we’ll talk through</h2><ul>{['Your learners and practice goals', 'The session setup and available features', 'Pilot access, scope and commercial terms'].map(item => <li key={item}><Check size={17} aria-hidden="true" />{item}</li>)}</ul></div><a href={`mailto:${supportEmail}`} className="mkt-text-link"><Mail size={17} aria-hidden="true" />{supportEmail}</a><p className="mkt-caption">An individual student? Ask about access, or explore the guided preview from the navigation.</p></div>
    <div className="mkt-enquiry-card">{!draft ? <><p className="mkt-kicker">TELL US A LITTLE ABOUT YOUR TEAM</p><h2>Discuss a pilot</h2><form onSubmit={submit}>
      <label htmlFor="enquiry-name">Your name <span>(required)</span><input id="enquiry-name" name="name" autoComplete="name" required maxLength={100} value={value.name} onChange={event => update('name', event.target.value)} /></label>
      <label htmlFor="enquiry-email">Email <span>(required)</span><input id="enquiry-email" name="email" type="email" autoComplete="email" required maxLength={254} value={value.email} onChange={event => update('email', event.target.value)} /></label>
      <label htmlFor="enquiry-organization">Institution or organization <span>(required)</span><input id="enquiry-organization" name="organization" autoComplete="organization" required maxLength={160} value={value.organization} onChange={event => update('organization', event.target.value)} /></label>
      <div className="mkt-form-pair"><label htmlFor="enquiry-role">Your role <span>(optional)</span><select id="enquiry-role" value={value.role} onChange={event => update('role', event.target.value)}><option value="">Select a role</option>{['Placement / career services', 'Faculty / trainer', 'Institution leadership', 'Training provider', 'Other'].map(role => <option key={role}>{role}</option>)}</select></label><label htmlFor="enquiry-cohort">Approximate cohort <span>(optional)</span><select id="enquiry-cohort" value={value.cohort} onChange={event => update('cohort', event.target.value)}><option value="">Select a size</option>{['Up to 25 learners', '26–100 learners', '101–500 learners', 'More than 500 learners', 'Not sure yet'].map(cohort => <option key={cohort}>{cohort}</option>)}</select></label></div>
      <label htmlFor="enquiry-goal">What are you planning? <span>(optional)</span><textarea id="enquiry-goal" name="goal" rows={4} maxLength={1000} placeholder="Your programme, timelines or a practice goal…" value={value.goal} onChange={event => update('goal', event.target.value)} /></label>
      <button className="mkt-button mkt-button--green" type="submit">Prepare enquiry<ArrowRight size={17} aria-hidden="true" /></button><p className="mkt-form-note">Review your enquiry first, then open an email draft or copy the text. Nothing is sent by this form.</p>
    </form></> : <><span className="mkt-pill mkt-pill--green">READY TO REVIEW</span><h2>Your pilot enquiry</h2><p>Open this in your email app, or copy it into an email to <strong>{supportEmail}</strong>. Send it when you’re ready.</p><pre className="mkt-draft" tabIndex={0}>{draft}</pre><div className="mkt-actions"><a className="mkt-button mkt-button--green" href={enquiryMailto(draft)}>Open email draft<ArrowUpRight size={17} aria-hidden="true" /></a><button type="button" className="mkt-button mkt-button--outline" onClick={() => void copy()}><Copy size={16} aria-hidden="true" />Copy enquiry</button></div><p className="mkt-form-note" role="status">{copyStatus || 'No email has been sent. Delivery happens through your email app.'}</p><button type="button" className="mkt-text-link" onClick={() => setDraft('')}><ArrowLeft size={15} aria-hidden="true" />Edit details</button></> }</div>
  </section>;
}
