import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  ClipboardList,
  Users,
  SlidersHorizontal,
  ArrowUpRight,
} from "lucide-react";
import {
  usePlatform,
  type Template,
  type TemplateSettings,
} from "../platform/context";
import {
  dateLabel,
  useApi,
  type Assignment,
  type Cohort,
  type Member,
} from "../platform/useApi";
import InvitationManager from "../platform/InvitationManager";
import "./institution.css";

type Session = {
  session_id: string;
  status: string;
  created_at: string;
  attempt_status: string;
};
type Progress = {
  assignment: Assignment;
  students: {
    uid: string;
    name: string;
    email: string;
    used: number;
    reserved: number;
    sessions: Session[];
  }[];
};
const sections = [
  { id: "assignments", label: "Assignments", icon: ClipboardList },
  { id: "cohorts", label: "People & cohorts", icon: Users },
  { id: "templates", label: "Discussion templates", icon: SlidersHorizontal },
] as const;
type Section = (typeof sections)[number]["id"];
const localDate = (value: Date) =>
  new Date(value.getTime() - value.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

export default function InstitutionAdmin() {
  const platform = usePlatform();
  const organizations =
    platform.profile?.organizations.filter((org) =>
      ["owner", "admin", "trainer"].includes(org.role),
    ) || [];
  const [selected, select] = useState("");
  const organizationId = organizations.some((org) => org.id === selected)
    ? selected
    : organizations[0]?.id || "";
  const organization = organizations.find((org) => org.id === organizationId);
  if (!platform.ready)
    return (
      <main className="portal">
        <p role="status">Loading institution…</p>
      </main>
    );
  if (platform.error)
    return (
      <main className="portal">
        <p role="alert">{platform.error}</p>
        <Link to="/workspace">Return to sign in</Link>
      </main>
    );
  if (!platform.user)
    return (
      <main className="portal">
        <h1>Your institution, one workspace.</h1>
        <p>Sign in with your institution staff account to continue.</p>
        <Link className="portal-button" to="/workspace">
          Sign in →
        </Link>
      </main>
    );
  if (!platform.profile)
    return (
      <main className="portal">
        <p role="status">Loading your permissions…</p>
      </main>
    );
  if (!organization)
    return (
      <main className="portal">
        <h1>Staff access required</h1>
        <p>Your account has no institution management role.</p>
        <Link to="/workspace">Back to your workspace</Link>
      </main>
    );
  return (
    <main className="portal">
      <header className="portal-topbar">
        <Link className="portal-wordmark" to="/workspace">
          spectakles<span>FOR INSTITUTIONS</span>
        </Link>
        <div>
          <label className="sr-only" htmlFor="admin-organization">
            Institution
          </label>
          <select
            id="admin-organization"
            value={organizationId}
            onChange={(event) => select(event.target.value)}
          >
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
          <Link to="/workspace">
            Student workspace <ArrowUpRight size={15} />
          </Link>
        </div>
      </header>
      <AdminWorkspace
        key={organizationId}
        organizationId={organizationId}
        name={organization.name}
        role={organization.role}
      />
    </main>
  );
}

function AdminWorkspace({
  organizationId,
  name,
  role,
}: {
  organizationId: string;
  name: string;
  role: string;
}) {
  const api = useApi();
  const [tab, setTab] = useState<Section>("assignments");
  const [members, setMembers] = useState<Member[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [revision, refresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [cohortName, setCohortName] = useState("");
  const [studentUids, setStudentUids] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [cohortId, setCohortId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [opensAt, setOpensAt] = useState(localDate(new Date()));
  const [dueAt, setDueAt] = useState(
    localDate(new Date(Date.now() + 7 * 86400000)),
  );
  const [attempts, setAttempts] = useState(2);
  const [editor, setEditor] = useState<TemplateSettings | null>(null);
  const [editing, setEditing] = useState<Template | null>(null);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState("student");
  const prefix = `/api/platform/organizations/${organizationId}`;
  const platform = usePlatform();

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    void Promise.all([
      api<Member[]>(prefix + "/members"),
      api<Cohort[]>(prefix + "/cohorts"),
      api<Template[]>(prefix + "/templates"),
      api<Assignment[]>(prefix + "/assignments"),
    ])
      .then(([people, batches, presets, tasks]) => {
        if (active) {
          setMembers(people);
          setCohorts(batches);
          setTemplates(presets);
          setAssignments(tasks);
        }
      })
      .catch((failure) => {
        if (active) setError(failure.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [prefix, revision, api]);
  const perform = async (action: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "The change could not be saved.",
      );
    } finally {
      setBusy(false);
    }
  };
  const submit = (event: FormEvent, action: () => Promise<void>) => {
    event.preventDefault();
    void perform(action);
  };
  const students = members.filter((member) => member.role === "student");
  const selectedTemplate = templates.find(
    (template) => template.id === templateId,
  );
  return (
    <>
      <div className="portal-hero">
        <div>
          <p className="portal-eyebrow">
            <Building2 size={15} /> INSTITUTION WORKSPACE
          </p>
          <h1>{name}</h1>
          <p>
            Create the practice. Give every student a place in the conversation.
          </p>
        </div>
        <span className="portal-badge">{role}</span>
      </div>
      <nav className="portal-tabs" aria-label="Institution sections">
        {sections.map((section) => (
          <button
            key={section.id}
            aria-current={tab === section.id ? "page" : undefined}
            onClick={() => {
              setTab(section.id);
              setProgress(null);
            }}
          >
            <section.icon size={18} />
            {section.label}
          </button>
        ))}
      </nav>
      <div className="portal-feedback" aria-live="polite">
        {error && <p role="alert">{error}</p>}
        {notice && <p role="status">{notice}</p>}
        {loading && <p role="status">Loading institution data…</p>}
      </div>
      {tab === "assignments" && (
        <div className="portal-columns">
          <section className="portal-card">
            <div className="portal-section-heading">
              <div>
                <p className="portal-eyebrow">PLAN THE NEXT ROUND</p>
                <h2>Create an assignment</h2>
              </div>
              <ClipboardList size={23} />
            </div>
            <p>
              A published template, a cohort and a clear deadline. Each
              assignment keeps the selected template version.
            </p>
            <form
              onSubmit={(event) =>
                submit(event, async () => {
                  if (!selectedTemplate)
                    throw new Error("Choose a published template.");
                  await api(prefix + "/assignments", {
                    title,
                    cohort_id: cohortId,
                    template_id: templateId,
                    template_version: selectedTemplate.version,
                    opens_at: new Date(opensAt).toISOString(),
                    due_at: new Date(dueAt).toISOString(),
                    max_attempts: attempts,
                  });
                  setTitle("");
                  refresh((value) => value + 1);
                  setNotice("Assignment published to the selected students.");
                })
              }
            >
              <label>
                Assignment title
                <input
                  required
                  maxLength={100}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Placement practice · Round 1"
                />
              </label>
              <label>
                Cohort
                <select
                  required
                  value={cohortId}
                  onChange={(event) => setCohortId(event.target.value)}
                >
                  <option value="">Choose a cohort</option>
                  {cohorts.map((cohort) => (
                    <option key={cohort.id} value={cohort.id}>
                      {cohort.name} · {cohort.student_uids.length} students
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Discussion template
                <select
                  required
                  value={templateId}
                  onChange={(event) => setTemplateId(event.target.value)}
                >
                  <option value="">Choose a template</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} · v{template.version}
                    </option>
                  ))}
                </select>
              </label>
              <div className="portal-form-pair">
                <label>
                  Opens
                  <input
                    required
                    type="datetime-local"
                    value={opensAt}
                    onChange={(event) => setOpensAt(event.target.value)}
                  />
                </label>
                <label>
                  Deadline
                  <input
                    required
                    type="datetime-local"
                    value={dueAt}
                    onChange={(event) => setDueAt(event.target.value)}
                  />
                </label>
              </div>
              <label>
                Attempts per student
                <input
                  type="number"
                  min={1}
                  max={10}
                  required
                  value={attempts}
                  onChange={(event) => setAttempts(Number(event.target.value))}
                />
              </label>
              <p className="portal-help">
                Dates use your local timezone. Preparation cancellation releases
                an attempt. Ending after the discussion begins consumes it;
                service failure releases it.
              </p>
              <button
                className="portal-primary"
                disabled={
                  busy || loading || !cohorts.length || !templates.length
                }
              >
                Publish assignment →
              </button>
            </form>
          </section>
          <section className="portal-card">
            <div className="portal-section-heading">
              <h2>Published assignments</h2>
              <button
                className="portal-quiet"
                disabled={loading || busy}
                onClick={() => refresh((value) => value + 1)}
              >
                Refresh
              </button>
            </div>
            {!assignments.length && !loading && (
              <div className="portal-empty">
                <ClipboardList size={30} />
                <h3>Your first assignment starts here.</h3>
                <p>
                  Create a cohort, publish a discussion template and bring them
                  together.
                </p>
              </div>
            )}
            {assignments.map((assignment) => (
              <article className="portal-row" key={assignment.id}>
                <span className="portal-badge">
                  {assignment.closed
                    ? "Closed"
                    : Date.parse(assignment.due_at) < Date.now()
                      ? "Past deadline"
                      : "Published"}
                </span>
                <h3>{assignment.title}</h3>
                <p>
                  {assignment.cohort_name} · {assignment.max_attempts} attempts
                </p>
                <small>Due {dateLabel(assignment.due_at)}</small>
                <div className="portal-actions">
                  <button
                    disabled={busy}
                    onClick={() =>
                      void perform(async () =>
                        setProgress(
                          await api<Progress>(
                            prefix + `/assignments/${assignment.id}/progress`,
                          ),
                        ),
                      )
                    }
                  >
                    View progress
                  </button>
                  {!assignment.closed && (
                    <button
                      className="portal-quiet"
                      disabled={busy}
                      onClick={() =>
                        void perform(async () => {
                          await api(
                            prefix + `/assignments/${assignment.id}/close`,
                            {},
                          );
                          refresh((value) => value + 1);
                          setNotice("Assignment closed to new attempts.");
                        })
                      }
                    >
                      Close to new attempts
                    </button>
                  )}
                </div>
              </article>
            ))}
          </section>
        </div>
      )}
      {progress && (
        <section className="portal-card">
          <div className="portal-section-heading">
            <div>
              <p className="portal-eyebrow">COMPLETION & ATTEMPTS</p>
              <h2>{progress.assignment.title}</h2>
            </div>
            <button className="portal-quiet" onClick={() => setProgress(null)}>
              Close progress
            </button>
          </div>
          <div className="portal-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Attempts used</th>
                  <th>In progress</th>
                  <th>Sessions & reports</th>
                </tr>
              </thead>
              <tbody>
                {progress.students.map((student) => (
                  <tr key={student.uid}>
                    <td>
                      <strong>{student.name}</strong>
                      <small>{student.email}</small>
                    </td>
                    <td>
                      {student.used} / {progress.assignment.max_attempts}
                    </td>
                    <td>{student.reserved}</td>
                    <td>
                      {student.sessions.length
                        ? student.sessions.map((session) => (
                            <div key={session.session_id}>
                              {session.status} · {dateLabel(session.created_at)}{" "}
                              {session.status !== "active" && (
                                <Link to={`/reports/${session.session_id}`}>
                                  View report →
                                </Link>
                              )}
                            </div>
                          ))
                        : "Not started"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {tab === "cohorts" && (
        <div className="portal-columns">
          {["owner", "admin"].includes(role) && <InvitationManager organizationId={organizationId} />}
          <section className="portal-card">
            <p className="portal-eyebrow">BUILD A PRACTICE GROUP</p>
            <h2>Create a cohort</h2>
            <form
              onSubmit={(event) =>
                submit(event, async () => {
                  await api(prefix + "/cohorts", {
                    name: cohortName,
                    student_uids: studentUids,
                  });
                  setCohortName("");
                  setStudentUids([]);
                  refresh((value) => value + 1);
                  setNotice("Cohort created.");
                })
              }
            >
              <label>
                Cohort name
                <input
                  required
                  maxLength={100}
                  value={cohortName}
                  onChange={(event) => setCohortName(event.target.value)}
                  placeholder="Final year · Computer Science"
                />
              </label>
              <fieldset>
                <legend>Select students</legend>
                {!students.length && (
                  <p>Add student accounts to your institution first.</p>
                )}
                {students.map((student) => (
                  <label className="portal-check" key={student.uid}>
                    <input
                      type="checkbox"
                      checked={studentUids.includes(student.uid)}
                      onChange={(event) =>
                        setStudentUids((previous) =>
                          event.target.checked
                            ? [...previous, student.uid]
                            : previous.filter((uid) => uid !== student.uid),
                        )
                      }
                    />
                    <span>
                      {student.name}
                      <small>{student.email}</small>
                    </span>
                  </label>
                ))}
              </fieldset>
              <button
                className="portal-primary"
                disabled={busy || !studentUids.length}
              >
                Create cohort · {studentUids.length} selected
              </button>
            </form>
            <h3 className="portal-space">Existing cohorts</h3>
            {cohorts.map((cohort) => (
              <p key={cohort.id}>
                {cohort.name}{" "}
                <span className="portal-badge">
                  {cohort.student_uids.length} students
                </span>
              </p>
            ))}
          </section>
          <section className="portal-card">
            <h2>Institution members</h2>
            <p>
              {members.length} accounts · {students.length} students
            </p>
            <ul className="portal-member-list">
              {members.map((member) => (
                <li key={member.uid}>
                  <div>
                    <strong>{member.name}</strong>
                    <small>{member.email}</small>
                  </div>
                  <span className="portal-badge">{member.role}</span>
                </li>
              ))}
            </ul>
            {["owner", "admin"].includes(role) && (
              <form
                onSubmit={(event) =>
                  submit(event, async () => {
                    await api(prefix + "/members", {
                      email: memberEmail,
                      role: memberRole,
                    });
                    setMemberEmail("");
                    refresh((value) => value + 1);
                    setNotice("Existing account added to the institution.");
                  })
                }
              >
                <h3>Add an existing account</h3>
                <p className="portal-help">
                  Invitation emails are not enabled yet. The person must already
                  have an account.
                </p>
                <label>
                  Email
                  <input
                    required
                    type="email"
                    value={memberEmail}
                    onChange={(event) => setMemberEmail(event.target.value)}
                  />
                </label>
                <label>
                  Role
                  <select
                    value={memberRole}
                    onChange={(event) => setMemberRole(event.target.value)}
                  >
                    <option value="student">Student</option>
                    <option value="trainer">Trainer</option>
                    <option value="admin">Administrator</option>
                  </select>
                </label>
                <button disabled={busy}>Add member</button>
              </form>
            )}
          </section>
        </div>
      )}
      {tab === "templates" && (
        <div className="portal-columns">
          <section className="portal-card">
            <div className="portal-section-heading">
              <h2>Discussion templates</h2>
              <button
                disabled={!platform.profile || busy}
                onClick={() => {
                  setEditing(null);
                  setEditor(
                    structuredClone(platform.profile!.personal_template),
                  );
                }}
              >
                New template
              </button>
            </div>
            {templates.map((template) => (
              <article className="portal-row" key={template.id}>
                <span className="portal-badge">Version {template.version}</span>
                <h3>{template.name}</h3>
                <p>{template.settings.topic}</p>
                <small>
                  {template.settings.panel.length} AI participants ·{" "}
                  {template.settings.discussion_seconds / 60} min
                </small>
                <button
                  disabled={busy}
                  onClick={() => {
                    setEditing(template);
                    setEditor(structuredClone(template.settings));
                  }}
                >
                  Edit next version →
                </button>
              </article>
            ))}
          </section>
          <section className="portal-card">
            {editor ? (
              <form
                onSubmit={(event) =>
                  submit(event, async () => {
                    const saved = await api<Template>(
                      prefix + "/templates" + (editing ? "/" + editing.id : ""),
                      {
                        expected_version: editing?.version || 0,
                        settings: editor,
                      },
                      editing ? "PUT" : "POST",
                    );
                    setEditing(saved);
                    setEditor(saved.settings);
                    refresh((value) => value + 1);
                    setNotice(
                      `Published ${saved.name}, version ${saved.version}. Existing assignments retain their versions.`,
                    );
                  })
                }
              >
                <p className="portal-eyebrow">
                  {editing
                    ? `PUBLISH VERSION ${editing.version + 1}`
                    : "NEW DISCUSSION"}
                </p>
                <h2>Shape the conversation.</h2>
                <label>
                  Template name
                  <input
                    required
                    value={editor.name}
                    maxLength={100}
                    onChange={(event) =>
                      setEditor({ ...editor, name: event.target.value })
                    }
                  />
                </label>
                <label>
                  Topic
                  <textarea
                    required
                    rows={3}
                    maxLength={500}
                    value={editor.topic}
                    onChange={(event) =>
                      setEditor({ ...editor, topic: event.target.value })
                    }
                  />
                </label>
                <div className="portal-form-pair">
                  <label>
                    Preparation (seconds)
                    <input
                      type="number"
                      required
                      min={0}
                      max={300}
                      value={editor.preparation_seconds}
                      onChange={(event) =>
                        setEditor({
                          ...editor,
                          preparation_seconds: Number(event.target.value),
                        })
                      }
                    />
                  </label>
                  <label>
                    Discussion (minutes)
                    <input
                      type="number"
                      required
                      min={3}
                      max={30}
                      value={editor.discussion_seconds / 60}
                      onChange={(event) =>
                        setEditor({
                          ...editor,
                          discussion_seconds: Number(event.target.value) * 60,
                        })
                      }
                    />
                  </label>
                </div>
                <label className="portal-check">
                  <input
                    type="checkbox"
                    checked={editor.allow_preparation_skip}
                    onChange={(event) =>
                      setEditor({
                        ...editor,
                        allow_preparation_skip: event.target.checked,
                      })
                    }
                  />
                  Students may skip remaining preparation
                </label>
                <h3>AI participants</h3>
                {editor.panel.map((person, index) => (
                  <fieldset key={person.id} className="portal-person">
                    <legend>{person.name}</legend>
                    <label>
                      Name
                      <input
                        required
                        maxLength={100}
                        value={person.name}
                        onChange={(event) =>
                          setEditor({
                            ...editor,
                            panel: editor.panel.map((p, i) =>
                              i === index
                                ? { ...p, name: event.target.value }
                                : p,
                            ),
                          })
                        }
                      />
                    </label>
                    <label>
                      Voice
                      <select
                        value={person.voice}
                        onChange={(event) =>
                          setEditor({
                            ...editor,
                            panel: editor.panel.map((p, i) =>
                              i === index
                                ? { ...p, voice: event.target.value }
                                : p,
                            ),
                          })
                        }
                      >
                        {[
                          ["Charon", "Male · informative"],
                          ["Puck", "Male · upbeat"],
                          ["Orus", "Male · firm"],
                          ["Kore", "Female · firm"],
                          ["Leda", "Female · youthful"],
                        ].map(([value, label]) => (
                          <option key={value} value={value}>
                            {value} · {label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Persona instructions
                      <textarea
                        rows={3}
                        maxLength={4000}
                        value={person.persona || ""}
                        placeholder={person.role}
                        onChange={(event) =>
                          setEditor({
                            ...editor,
                            panel: editor.panel.map((p, i) =>
                              i === index
                                ? { ...p, persona: event.target.value }
                                : p,
                            ),
                          })
                        }
                      />
                    </label>
                    {editor.panel.length > 2 && (
                      <button
                        type="button"
                        className="portal-quiet"
                        onClick={() =>
                          setEditor({
                            ...editor,
                            panel: editor.panel.filter((_, i) => i !== index),
                          })
                        }
                      >
                        Remove {person.name}
                      </button>
                    )}
                  </fieldset>
                ))}
                {editor.panel.length < 5 && (
                  <button
                    type="button"
                    onClick={() => {
                      const extra = [
                        {
                          id: "nina",
                          name: "Nina",
                          role: "Evidence-focused researcher",
                          voice: "Leda",
                          style: "arjun",
                          color: "peach",
                        },
                        {
                          id: "rohan",
                          name: "Rohan",
                          role: "Practical educator",
                          voice: "Orus",
                          style: "meera",
                          color: "lavender",
                        },
                        ...(platform.profile?.personal_template.panel || []),
                      ].find(
                        (p) =>
                          !editor.panel.some(
                            (existing) => existing.id === p.id,
                          ),
                      );
                      if (extra)
                        setEditor({
                          ...editor,
                          panel: [...editor.panel, extra],
                        });
                    }}
                  >
                    Add participant
                  </button>
                )}
                <p className="portal-help">
                  Persona instructions are internal. Students see participant
                  names, not behavioral labels. Live video remains under
                  validation.
                </p>
                <button className="portal-primary" disabled={busy}>
                  Publish template →
                </button>
              </form>
            ) : (
              <div className="portal-empty">
                <SlidersHorizontal size={30} />
                <h3>Design a useful discussion.</h3>
                <p>
                  Select a template to edit or create one. Publishing creates a
                  new version.
                </p>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}
