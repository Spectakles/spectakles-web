export const questions = [
  { id: 'practice', category: 'The experience', question: 'What is a Spectakles group discussion?', answer: 'You discuss a topic out loud with AI participants who bring different viewpoints. There is time to prepare, a timed discussion, and the option to start a fresh round. The AI participants are practice partners, not real students.' },
  { id: 'speaking', category: 'The experience', question: 'Do I press a button every time I want to speak?', answer: 'No. During a discussion, your microphone stays active. Speak naturally to contribute or interrupt; speech detection handles the turn. Headphones are recommended to prevent the panel’s audio feeding back into your microphone.' },
  { id: 'devices', category: 'The experience', question: 'What do students need?', answer: 'A supported desktop browser, a working microphone, headphones and a stable internet connection. The room runs in the browser. Preparation can be skipped when the session template permits it.' },
  { id: 'access', category: 'Access & pilots', question: 'Can I try it as an individual student?', answer: 'You can explore the guided preview here without an account or microphone. Live discussions currently use pilot accounts. Public self-service trials are planned; unlimited free practice is not currently offered. Ask your institution about access, or contact us.' },
  { id: 'institutions', category: 'Access & pilots', question: 'How can our institution get started?', answer: 'Contact us with your programme, approximate cohort size and what you want students to practise. We will discuss a small pilot and agree its scope, access and commercial terms before starting.' },
  { id: 'pricing', category: 'Access & pilots', question: 'How much does it cost?', answer: 'Pilot pricing is not published yet. Panel size, session volume and video affect delivery cost. We will agree the scope and price with your institution rather than advertise an unverified per-student rate.' },
  { id: 'roadmap', category: 'Product & data', question: 'Are video avatars, scores and trainer dashboards available?', answer: 'Live video avatars, automated post-GD reports, cohort assignments and the full institutional dashboard are in development. The working local product includes voice discussion, preparation, optional captions, private notes, configurable templates and saved session evidence. We confirm availability when agreeing a pilot.' },
  { id: 'privacy', category: 'Product & data', question: 'What is recorded, and who can review it?', answer: 'Student speech during a GD is saved as audio contributions with discussion evidence. Signed-in students can access their own sessions; authorized institution staff can review their institution’s sessions, recordings and transcripts. Preparation audio is excluded from the GD recording. Production retention, deletion and institutional data terms must be agreed before an external pilot.' },
  { id: 'notes', category: 'Product & data', question: 'Are my preparation notes shared?', answer: 'Notes stay in the current browser page. They are not sent to the AI panel, the evaluator or your institution. Leaving the page or starting a fresh round clears them. The guided preview follows the same page-only approach.' },
];

export const topics = [
  { id: 'ai', title: 'AI: boon or bane', prompt: 'Consider access to education, the changing nature of work and the responsibility of people building AI.', points: [
    { id: 'arjun', name: 'Arjun', text: 'If AI helps more students learn, what support do teachers need to use it well?' },
    { id: 'sahil', name: 'Sahil', text: 'We should compare a useful application with its risks, rather than treating all AI as one thing.' },
    { id: 'meera', name: 'Meera', text: 'Access matters too. A useful tool still leaves people behind if they cannot afford it.' },
  ] },
  { id: 'internships', title: 'Should internships be mandatory?', prompt: 'Consider practical experience, unequal access to opportunities and how colleges could support students.', points: [
    { id: 'arjun', name: 'Arjun', text: 'Would a mandatory internship be fair if students have very different access to employers?' },
    { id: 'sahil', name: 'Sahil', text: 'A college could offer project-based alternatives when a suitable internship is unavailable.' },
    { id: 'meera', name: 'Meera', text: 'Let us separate the value of work experience from the question of making it compulsory.' },
  ] },
] as const;
