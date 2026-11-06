export type Enquiry = { name: string; email: string; organization: string; role: string; cohort: string; goal: string };
export const supportEmail = 'contact@spectakles.in';
export function enquiryText(value: Enquiry) {
  return `Hello Spectakles,\n\nI’d like to discuss an institutional GD practice pilot.\n\nName: ${value.name.trim()}\nEmail: ${value.email.trim()}\nInstitution / organization: ${value.organization.trim()}\nRole: ${value.role || 'Not specified'}\nApproximate cohort: ${value.cohort || 'To be discussed'}\n\nWhat we’re planning:\n${value.goal.trim() || 'I’d like to explore a suitable pilot scope.'}\n\nPlease get in touch to discuss the next steps.`;
}
export function enquiryMailto(text: string) {
  return `mailto:${supportEmail}?subject=${encodeURIComponent('Institutional pilot enquiry — Spectakles')}&body=${encodeURIComponent(text)}`;
}
