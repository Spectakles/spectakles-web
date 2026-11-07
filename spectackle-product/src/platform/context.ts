import { createContext, useContext } from 'react';
import type { Auth, User } from 'firebase/auth';

export type Panelist = { id: string; name: string; role: string; voice: string; color: string; persona?: string; style?: string };
export type TemplateSettings = { schema_version: number; name: string; topic: string; preparation_seconds: number; discussion_seconds: number; closing_seconds: number; final_seconds: number; allow_preparation_skip: boolean; panel: Panelist[] };
export type Template = { assignment_id?: string; id: string; organization_id: string; version: number; settings: TemplateSettings; name: string; sha256: string };
export type Organization = { id: string; name: string; role: 'owner' | 'admin' | 'trainer' | 'student' };
export type Profile = { user: { uid: string; name: string; email: string }; organizations: Organization[]; permissions: { can_create_organization: boolean }; personal_template: TemplateSettings };
export type Status = { enabled: boolean; project_id: string; emulator: boolean; coaching_enabled?: boolean };
type Platform = {
  ready: boolean; error: string; status: Status | null; auth: Auth | null; user: User | null;
  profile: Profile | null; selected: Template | null; select: (value: Template | null) => void;
  token: () => Promise<string | undefined>; request: (path: string, init?: RequestInit) => Promise<Response>;
  reload: () => Promise<void>;
};
const plainRequest = (path: string, init?: RequestInit) => fetch(path, init);
export const Context = createContext<Platform>({ ready: true, error: '', status: null, auth: null, user: null, profile: null, selected: null, select: () => {}, token: async () => undefined, request: plainRequest, reload: async () => {} });
export const usePlatform = () => useContext(Context);

export async function responseError(response: Response): Promise<Error> {
  const body = await response.json().catch(() => null);
  const detail = Array.isArray(body?.detail) ? body.detail.slice(0, 3).map((issue: { loc?: string[]; msg?: string }) => `${issue.loc?.join('.') || 'settings'}: ${issue.msg || 'Invalid value'}`).join('; ') : body?.detail;
  return new Error(typeof detail === 'string' ? detail : `Request failed (${response.status}). Check the settings and try again.`);
}

