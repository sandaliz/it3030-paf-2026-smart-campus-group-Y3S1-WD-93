import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketService } from '../../services/ticketService';
import { resourceService } from '../../services/resourceService';
import { useAuth } from '../../context/AuthContext';

// ── Inline icon helper ────────────────────────────────────────────────────────
const Icon = ({ d, size = 16, className = '' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size}
    viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d={d} />
  </svg>
);

const icons = {
  arrowLeft:  'M19 12H5M12 5l-7 7 7 7',
  arrowRight: 'M5 12h14M12 19l7-7-7-7',
  check:      'M20 6L9 17l-5-5',
  info:       'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zM12 16v-4M12 8h.01',
  upload:     'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
  x:          'M18 6L6 18M6 6l12 12',
  ticket:     'M2 9a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9zm9 3h.01',
  location:   'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0zM12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  tag:        'M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82zM7 7h.01',
  alert:      'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01',
  phone:      'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.15 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.05 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z',
  mail:       'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6',
  image:      'M21 15a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2z',
  send:       'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
  cpu:        'M18 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM9 9h6M9 12h6M9 15h4',
};

// ── Step indicator ────────────────────────────────────────────────────────────
const steps = [
  { id: 1, label: 'Details',  icon: icons.ticket },
  { id: 2, label: 'Context',  icon: icons.location },
  { id: 3, label: 'Contact',  icon: icons.mail },
  { id: 4, label: 'Attachments', icon: icons.image },
];

const StepIndicator = ({ current }) => (
  <div className="flex items-center justify-center gap-0 mb-10">
    {steps.map((step, i) => {
      const done    = current > step.id;
      const active  = current === step.id;
      return (
        <React.Fragment key={step.id}>
          <div className="flex flex-col items-center gap-1.5">
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
              ${done   ? 'bg-primary border-primary text-primary-content'
              : active ? 'bg-base-100 border-primary text-primary shadow-md shadow-primary/20'
              :          'bg-base-100 border-base-300 text-base-content/30'}
            `}>
              {done
                ? <Icon d={icons.check} size={15} />
                : <Icon d={step.icon} size={15} />
              }
            </div>
            <span className={`text-xs font-semibold tracking-wide transition-colors ${active ? 'text-primary' : done ? 'text-base-content/60' : 'text-base-content/30'}`}>
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-0.5 w-12 sm:w-20 mb-5 mx-1 transition-all duration-500 ${done ? 'bg-primary' : 'bg-base-300'}`} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);

// ── Field wrapper with label ──────────────────────────────────────────────────
const Field = ({ label, required, hint, error, children }) => (
  <div className="form-control gap-1">
    <label className="label py-0">
      <span className="label-text text-sm font-semibold text-base-content/70">
        {label}{required && <span className="text-error ml-0.5">*</span>}
      </span>
    </label>
    {children}
    {hint && !error && <p className="text-xs text-base-content/40 mt-0.5 pl-1">{hint}</p>}
    {error  && <p className="text-xs text-error mt-0.5 pl-1">{error}</p>}
  </div>
);

// ── Priority option card ──────────────────────────────────────────────────────
const PRIORITY_META = {
  LOW:    { cls: 'border-success  text-success',  bg: 'bg-success/5',  label: 'Low',    desc: 'Non-urgent, can wait' },
  MEDIUM: { cls: 'border-warning  text-warning',  bg: 'bg-warning/5',  label: 'Medium', desc: 'Standard timeline' },
  HIGH:   { cls: 'border-error    text-error',    bg: 'bg-error/5',    label: 'High',   desc: 'Needs prompt attention' },
  URGENT: { cls: 'border-error    text-error',    bg: 'bg-error/10',   label: 'Urgent', desc: 'Immediate action needed', pulse: true },
};

const PriorityPicker = ({ value, onChange }) => (
  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
    {Object.entries(PRIORITY_META).map(([key, meta]) => (
      <button
        key={key} type="button"
        onClick={() => onChange(key)}
        className={`
          relative rounded-xl border-2 px-3 py-3 text-left transition-all duration-200
          ${value === key ? `${meta.cls} ${meta.bg} shadow-sm` : 'border-base-300 hover:border-base-content/30'}
        `}
      >
        {meta.pulse && value === key && (
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-error animate-ping" />
        )}
        <p className={`text-sm font-bold ${value === key ? '' : 'text-base-content'}`}>{meta.label}</p>
        <p className="text-xs text-base-content/50 mt-0.5">{meta.desc}</p>
      </button>
    ))}
  </div>
);

// ── Category pill grid ────────────────────────────────────────────────────────
const CATEGORY_ICONS = {
  IT: '💻', ELECTRICAL: '⚡', PLUMBING: '🔧', HVAC: '❄️',
  FURNITURE: '🪑', CLEANING: '🧹', SECURITY: '🔒', OTHER: '📋',
};

const CategoryPicker = ({ value, onChange }) => (
  <div className="flex flex-wrap gap-2">
    {Object.entries(CATEGORY_ICONS).map(([cat, emoji]) => (
      <button
        key={cat} type="button"
        onClick={() => onChange(cat)}
        className={`
          flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-semibold transition-all duration-200
          ${value === cat
            ? 'border-primary bg-primary/10 text-primary shadow-sm'
            : 'border-base-300 text-base-content/60 hover:border-base-content/40 hover:text-base-content'}
        `}
      >
        <span>{emoji}</span> {cat}
      </button>
    ))}
  </div>
);

// ── Char counter input ────────────────────────────────────────────────────────
const CharInput = ({ max, value, ...props }) => (
  <div className="relative">
    {props.textarea
      ? <textarea {...props} maxLength={max} className={`textarea textarea-bordered w-full resize-none ${props.className||''}`} />
      : <input {...props} maxLength={max} className={`input input-bordered w-full ${props.className||''}`} />
    }
    <span className={`absolute bottom-2.5 right-3 text-xs tabular-nums transition-colors ${value.length > max * 0.85 ? 'text-warning' : 'text-base-content/30'}`}>
      {value.length}/{max}
    </span>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// Main component
// ═══════════════════════════════════════════════════════════════════════════════
const CreateTicketPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [step, setStep]           = useState(1);
  const [loading, setLoading]     = useState(false);
  const [resources, setResources] = useState([]);
  const [loadingRes, setLoadingRes] = useState(false);
  const [resourcesError, setResourcesError] = useState('');
  const [files, setFiles]         = useState([]);
  const [previews, setPreviews]   = useState([]);
  const [errors, setErrors]       = useState({});

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'IT',
    priority: 'MEDIUM',
    preferredContactMethod: 'EMAIL',
    contactDetails: user?.email || '',
    location: '',
    resourceId: '',
  });

  // ── Resource fetch ──────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoadingRes(true);
      try {
        const res = await resourceService.getAllResources();
        const list = Array.isArray(res) ? res : (Array.isArray(res?.content) ? res.content : []);
        const sorted = [...list].sort((a, b) => {
          if (a.status === 'ACTIVE' && b.status !== 'ACTIVE') return -1;
          if (a.status !== 'ACTIVE' && b.status === 'ACTIVE') return 1;
          return (a.name || '').localeCompare(b.name || '');
        });
        setResources(sorted);
        setResourcesError(sorted.length === 0 ? 'No resources found in the system.' : '');
      } catch {
        setResourcesError('Failed to load resources.');
      } finally {
        setLoadingRes(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    setForm(prev => ({ ...prev, contactDetails: prev.contactDetails || user?.email || '' }));
  }, [user]);

  // ── Field change ────────────────────────────────────────────────────────────
  const set = (name, value) => {
    setErrors(e => ({ ...e, [name]: '' }));
    if (name === 'resourceId') {
      const res = resources.find(r => r.id === value);
      setForm(prev => ({ ...prev, resourceId: value, ...(res?.location ? { location: res.location } : {}) }));
    } else if (name === 'location') {
      setForm(prev => ({ ...prev, location: value, resourceId: '' }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  // ── File handling ───────────────────────────────────────────────────────────
  const handleFiles = (e) => {
    const selected = Array.from(e.target.files);
    if (selected.length + files.length > 3) { alert('Maximum 3 attachments allowed'); return; }
    const big   = selected.find(f => f.size > 5 * 1024 * 1024);
    if (big)   { alert(`"${big.name}" exceeds 5MB`); return; }
    const bad   = selected.find(f => !f.type.startsWith('image/'));
    if (bad)   { alert('Only image files are allowed'); return; }
    setFiles(prev => [...prev, ...selected]);
    selected.forEach(f => {
      const r = new FileReader();
      r.onloadend = () => setPreviews(prev => [...prev, r.result]);
      r.readAsDataURL(f);
    });
  };

  const removeFile = (i) => {
    setFiles(f => f.filter((_, idx) => idx !== i));
    setPreviews(p => p.filter((_, idx) => idx !== i));
  };

  // ── Step validation ─────────────────────────────────────────────────────────
  const validate = (s) => {
    const errs = {};
    if (s === 1) {
      if (!form.title.trim())       errs.title = 'Title is required';
      if (!form.description.trim()) errs.description = 'Description is required';
    }
    if (s === 2) {
      if (!form.location.trim()) errs.location = 'Location is required';
    }
    if (s === 3) {
      if (!form.contactDetails.trim()) errs.contactDetails = 'Contact details are required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => { if (validate(step)) setStep(s => Math.min(s + 1, 4)); };
  const back = () => setStep(s => Math.max(s - 1, 1));

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    // Validate all steps before submission
    const allValid = [1, 2, 3].every(s => validate(s));
    if (!allValid) return;
    
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      files.forEach(f => fd.append('attachments', f));
      const ticket = await ticketService.createTicket(fd);
      navigate(`/tickets/${ticket.id}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  const selectedResource = resources.find(r => r.id === form.resourceId);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-base-200 flex flex-col items-center py-10 px-4">

      {/* ── Page header ────────────────────────────────────────────────── */}
      <div className="w-full max-w-2xl mb-8">
        <button
          className="btn btn-ghost btn-sm gap-2 text-base-content/50 hover:text-base-content mb-4 -ml-2"
          onClick={() => navigate(-1)}
        >
          <Icon d={icons.arrowLeft} size={14} /> Back
        </button>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
            <Icon d={icons.ticket} size={22} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-base-content">New Support Ticket</h1>
            <p className="text-sm text-base-content/50 mt-0.5">Report an issue or request assistance — we'll get right on it.</p>
          </div>
        </div>
      </div>

      {/* ── Form card ──────────────────────────────────────────────────── */}
      <div className="w-full max-w-2xl">
        <div className="card bg-base-100 border border-base-300 shadow-sm rounded-2xl overflow-hidden">
          <div className="card-body p-8">

            <StepIndicator current={step} />

            {/* ── STEP 1: Issue details ─────────────────────────────── */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="border-b border-base-200 pb-2 mb-2">
                  <h2 className="font-bold text-base text-base-content">Describe the Issue</h2>
                  <p className="text-xs text-base-content/40 mt-0.5">Be specific so we can route this quickly</p>
                </div>

                <Field label="Title" required error={errors.title} hint="Keep it short — 10 to 100 characters">
                  <CharInput
                    max={100}
                    value={form.title}
                    name="title"
                    placeholder="e.g. Air conditioning not working in Room 302"
                    onChange={e => set('title', e.target.value)}
                  />
                </Field>

                <Field label="Description" required error={errors.description} hint="Include what happened, when, and any steps already taken">
                  <CharInput
                    textarea
                    max={1000}
                    value={form.description}
                    name="description"
                    placeholder="Describe the issue in detail…"
                    rows={5}
                    onChange={e => set('description', e.target.value)}
                  />
                </Field>

                <Field label="Category" required>
                  <CategoryPicker value={form.category} onChange={v => set('category', v)} />
                </Field>

                <Field label="Priority" required>
                  <PriorityPicker value={form.priority} onChange={v => set('priority', v)} />
                </Field>
              </div>
            )}

            {/* ── STEP 2: Location & resource ───────────────────────── */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="border-b border-base-200 pb-2 mb-2">
                  <h2 className="font-bold text-base text-base-content">Location & Resource</h2>
                  <p className="text-xs text-base-content/40 mt-0.5">Help us find the affected area or equipment</p>
                </div>

                <Field label="Location" required error={errors.location} hint="Building name, floor, room number, or area">
                  <label className="input input-bordered flex items-center gap-2">
                    <Icon d={icons.location} size={15} className="text-base-content/40 shrink-0" />
                    <input
                      type="text"
                      className="grow bg-transparent outline-none text-sm"
                      placeholder="e.g. Block A, 3rd Floor, Room 302"
                      value={form.location}
                      onChange={e => set('location', e.target.value)}
                    />
                  </label>
                  {form.resourceId && (
                    <p className="text-xs text-info pl-1 mt-1 flex items-center gap-1">
                      <Icon d={icons.info} size={11} /> Auto-filled from selected resource
                    </p>
                  )}
                </Field>

                <Field label="Related Resource" hint="Select the equipment or facility this issue is about (optional)">
                  {loadingRes ? (
                    <div className="flex items-center gap-2 text-sm text-base-content/50 py-2">
                      <span className="loading loading-spinner loading-xs" /> Loading resources…
                    </div>
                  ) : (
                    <select
                      className="select select-bordered w-full"
                      value={form.resourceId}
                      onChange={e => set('resourceId', e.target.value)}
                      disabled={resources.length === 0}
                    >
                      <option value="">— No specific resource —</option>
                      {resources.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.type} · {r.location}) [{r.status || 'UNKNOWN'}]
                        </option>
                      ))}
                    </select>
                  )}
                  {resourcesError && (
                    <p className="text-xs text-warning pl-1 mt-1 flex items-center gap-1">
                      <Icon d={icons.alert} size={11} /> {resourcesError}
                    </p>
                  )}
                </Field>

                {/* Selected resource preview card */}
                {selectedResource && (
                  <div className="rounded-xl border border-info/30 bg-info/5 p-4 flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-lg bg-info/20 flex items-center justify-center shrink-0">
                      <Icon d={icons.cpu} size={15} className="text-info" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-base-content">{selectedResource.name}</p>
                      <p className="text-xs text-base-content/50 mt-0.5">
                        {selectedResource.type} · {selectedResource.location}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`badge badge-xs font-semibold ${selectedResource.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}>
                          {selectedResource.status}
                        </span>
                        <span className="text-xs text-base-content/30 font-mono">ID: {selectedResource.id}</span>
                      </div>
                    </div>
                    <button type="button" className="btn btn-ghost btn-xs btn-circle shrink-0" onClick={() => set('resourceId', '')}>
                      <Icon d={icons.x} size={13} />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 3: Contact info ──────────────────────────────── */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="border-b border-base-200 pb-2 mb-2">
                  <h2 className="font-bold text-base text-base-content">Contact Preference</h2>
                  <p className="text-xs text-base-content/40 mt-0.5">How should we reach you with updates?</p>
                </div>

                {/* Contact method toggle */}
                <Field label="Preferred Contact Method" required>
                  <div className="flex gap-3">
                    {[
                      { val: 'EMAIL', icon: icons.mail,  label: 'Email' },
                      { val: 'PHONE', icon: icons.phone, label: 'Phone' },
                    ].map(opt => (
                      <button
                        key={opt.val} type="button"
                        onClick={() => set('preferredContactMethod', opt.val)}
                        className={`
                          flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-semibold transition-all
                          ${form.preferredContactMethod === opt.val
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-base-300 text-base-content/50 hover:border-base-content/30'}
                        `}
                      >
                        <Icon d={opt.icon} size={15} /> {opt.label}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field
                  label={form.preferredContactMethod === 'PHONE' ? 'Phone Number' : 'Email Address'}
                  required
                  error={errors.contactDetails}
                  hint={form.preferredContactMethod === 'PHONE' ? 'Include country code if international' : 'We\'ll send ticket updates to this address'}
                >
                  <label className="input input-bordered flex items-center gap-2">
                    <Icon
                      d={form.preferredContactMethod === 'PHONE' ? icons.phone : icons.mail}
                      size={15}
                      className="text-base-content/40 shrink-0"
                    />
                    <input
                      type={form.preferredContactMethod === 'PHONE' ? 'tel' : 'email'}
                      className="grow bg-transparent outline-none text-sm"
                      placeholder={form.preferredContactMethod === 'PHONE' ? '+1 (555) 000-0000' : 'you@example.com'}
                      value={form.contactDetails}
                      onChange={e => set('contactDetails', e.target.value)}
                    />
                  </label>
                </Field>

                {/* Summary so far */}
                <div className="rounded-xl bg-base-200/60 border border-base-300 p-4 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-base-content/40 mb-3">Ticket Summary</p>
                  {[
                    ['Title',    form.title     || '—'],
                    ['Category', form.category],
                    ['Priority', form.priority],
                    ['Location', form.location  || '—'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex gap-3 text-sm">
                      <span className="text-base-content/40 w-20 shrink-0">{k}</span>
                      <span className="font-semibold text-base-content truncate">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── STEP 4: Attachments ───────────────────────────────── */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="border-b border-base-200 pb-2 mb-2">
                  <h2 className="font-bold text-base text-base-content">Attachments</h2>
                  <p className="text-xs text-base-content/40 mt-0.5">Add photos to help illustrate the issue (optional)</p>
                </div>

                {/* Drop zone */}
                <div
                  className={`
                    relative border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer
                    ${files.length >= 3 ? 'border-base-300 opacity-50 cursor-not-allowed' : 'border-base-300 hover:border-primary hover:bg-primary/5'}
                  `}
                  onClick={() => files.length < 3 && fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file" accept="image/*" multiple
                    className="hidden"
                    onChange={handleFiles}
                    disabled={files.length >= 3}
                  />
                  <div className="w-12 h-12 rounded-2xl bg-base-200 flex items-center justify-center mx-auto mb-3">
                    <Icon d={icons.upload} size={22} className="text-base-content/40" />
                  </div>
                  <p className="text-sm font-semibold text-base-content/70">
                    {files.length >= 3 ? 'Maximum 3 files reached' : 'Click to upload images'}
                  </p>
                  <p className="text-xs text-base-content/40 mt-1">JPG, PNG, GIF · max 5 MB each · up to 3 files</p>
                  {files.length > 0 && (
                    <p className="text-xs text-primary mt-2 font-semibold">{files.length}/3 added</p>
                  )}
                </div>

                {/* Preview grid */}
                {previews.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    {previews.map((src, i) => (
                      <div key={i} className="relative group rounded-xl overflow-hidden aspect-square bg-base-200">
                        <img src={src} alt={`Preview ${i+1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button
                            type="button"
                            className="btn btn-circle btn-sm btn-error"
                            onClick={() => removeFile(i)}
                          >
                            <Icon d={icons.x} size={14} />
                          </button>
                        </div>
                        <div className="absolute bottom-1.5 left-1.5 bg-black/50 text-white text-xs px-1.5 py-0.5 rounded font-mono">
                          {(files[i]?.size / 1024).toFixed(0)} KB
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Final summary */}
                <div className="rounded-xl bg-base-200/60 border border-base-300 p-5 space-y-2.5">
                  <p className="text-xs font-bold uppercase tracking-widest text-base-content/40 mb-3">Ready to submit</p>
                  {[
                    ['Title',    form.title || '—'],
                    ['Category', form.category],
                    ['Priority', form.priority],
                    ['Location', form.location || '—'],
                    ['Contact',  `${form.preferredContactMethod} · ${form.contactDetails || '—'}`],
                    ['Resource', selectedResource?.name || 'None'],
                    ['Files',    files.length ? `${files.length} image${files.length > 1 ? 's' : ''}` : 'None'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex gap-3 text-sm">
                      <span className="text-base-content/40 w-20 shrink-0">{k}</span>
                      <span className="font-semibold text-base-content">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Navigation ─────────────────────────────────────────── */}
            <div className="flex gap-3 mt-8 pt-6 border-t border-base-200">
              {step > 1 ? (
                <button type="button" className="btn btn-ghost flex-1 gap-2" onClick={back}>
                  <Icon d={icons.arrowLeft} size={14} /> Back
                </button>
              ) : (
                <button type="button" className="btn btn-ghost flex-1" onClick={() => navigate(-1)}>
                  Cancel
                </button>
              )}

              {step < 4 ? (
                <button type="button" className="btn btn-primary flex-1 gap-2" onClick={next}>
                  Continue <Icon d={icons.arrowRight} size={14} />
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary flex-1 gap-2"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading
                    ? <span className="loading loading-spinner loading-sm" />
                    : <><Icon d={icons.send} size={14} /> Submit Ticket</>
                  }
                </button>
              )}
            </div>

          </div>
        </div>

        {/* Step count hint */}
        <p className="text-center text-xs text-base-content/30 mt-4">
          Step {step} of {steps.length}
        </p>
      </div>
    </div>
  );
};

export default CreateTicketPage;