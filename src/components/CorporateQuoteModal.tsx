import { FormEvent, useEffect, useState } from 'react';
import { Building2, Check, Copy, PhoneCall, X } from 'lucide-react';
import { BakerySettings } from '../types/bakery';

interface CorporateQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: BakerySettings;
}

const EVENT_TYPES = [
  'Corporate Office Catering',
  'Festive Gift Hampers',
  'Wedding / Engagement Reception',
  'Birthday / Milestone Celebration',
  'College / Institutional Event',
] as const;

export function CorporateQuoteModal({
  isOpen,
  onClose,
  settings,
}: CorporateQuoteModalProps) {
  const [organization, setOrganization] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [eventType, setEventType] = useState<string>(EVENT_TYPES[0]);
  const [guestCount, setGuestCount] = useState('50');
  const [eventDate, setEventDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submittedSummary, setSubmittedSummary] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSubmittedSummary('');
      setCopied(false);
      return;
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const summaryLines = [
      `Corporate / Bulk Inquiry — ${settings.bakeryName}`,
      `Event Type: ${eventType}`,
      `Organization / Host: ${organization.trim() || contactName.trim()}`,
      `Contact: ${contactName.trim()} (${phone.trim()})`,
      `Estimated Guests / Boxes: ${guestCount}`,
      eventDate ? `Preferred Date: ${eventDate}` : '',
      notes.trim() ? `Requirements: ${notes.trim()}` : '',
    ].filter(Boolean);
    setSubmittedSummary(summaryLines.join('\n'));
  };

  const handleCopyBrief = async () => {
    if (!submittedSummary) return;
    try {
      await navigator.clipboard.writeText(submittedSummary);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Ignore clipboard failure
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C1917]/55 p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="corp-quote-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[#FAFAF7] border border-[#E4DFD5] rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 bg-white border-b border-[#E4DFD5] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1B4332]/10 text-[#1B4332] flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="corp-quote-title"
                className="font-display text-xl font-semibold text-[#1C1917]"
              >
                Corporate &amp; Event Bulk Orders
              </h2>
              <p className="text-xs text-[#57534E]">
                Custom hampers, tiered celebration cakes &amp; tea-time catering
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close bulk quote dialog"
            className="w-10 h-10 flex items-center justify-center rounded-lg text-[#57534E] hover:text-[#1C1917] hover:bg-[#F2EFE9] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {submittedSummary ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-xs text-[#065F46] space-y-1">
                <p className="font-semibold text-sm flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  <span>Catering &amp; Bulk Brief Prepared</span>
                </p>
                <p>
                  Share this structured brief directly with our Widdi Centre hospitality desk for priority quotation and tasting confirmation.
                </p>
              </div>

              <pre className="p-4 rounded-xl bg-white border border-[#E4DFD5] text-xs font-mono-tabular text-[#1C1917] whitespace-pre-wrap leading-relaxed">
                {submittedSummary}
              </pre>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => void handleCopyBrief()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium bg-white border border-[#D6D0C4] hover:border-[#1C1917] text-[#1C1917] rounded-xl cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#15803D]" />
                      <span>Brief Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Inquiry Brief</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2.5">
                  <a
                    href={`tel:${settings.phone}`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium bg-[#9A3412] hover:bg-[#7C2D12] text-white rounded-xl"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Call Desk ({settings.phone})</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setSubmittedSummary('')}
                    className="px-3.5 py-2.5 text-xs font-medium text-[#57534E] hover:text-[#1C1917] cursor-pointer"
                  >
                    Edit Brief
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label htmlFor="corp-org" className="block text-xs font-medium text-[#57534E] mb-1">
                    Company / Host Name
                  </label>
                  <input
                    id="corp-org"
                    type="text"
                    required
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="e.g., Amaravati Tech Park"
                    className="w-full px-3 py-2 text-sm bg-white border border-[#D6D0C4] rounded-xl text-[#1C1917] focus:outline-none focus:border-[#9A3412]"
                  />
                </div>
                <div>
                  <label htmlFor="corp-event" className="block text-xs font-medium text-[#57534E] mb-1">
                    Order Category
                  </label>
                  <select
                    id="corp-event"
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-[#D6D0C4] rounded-xl text-[#1C1917] focus:outline-none focus:border-[#9A3412]"
                  >
                    {EVENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label htmlFor="corp-name" className="block text-xs font-medium text-[#57534E] mb-1">
                    Contact Person
                  </label>
                  <input
                    id="corp-name"
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full px-3 py-2 text-sm bg-white border border-[#D6D0C4] rounded-xl text-[#1C1917] focus:outline-none focus:border-[#9A3412]"
                  />
                </div>
                <div>
                  <label htmlFor="corp-phone" className="block text-xs font-medium text-[#57534E] mb-1">
                    Phone Number
                  </label>
                  <input
                    id="corp-phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="10-digit mobile"
                    className="w-full px-3 py-2 text-sm font-mono-tabular bg-white border border-[#D6D0C4] rounded-xl text-[#1C1917] focus:outline-none focus:border-[#9A3412]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label htmlFor="corp-qty" className="block text-xs font-medium text-[#57534E] mb-1">
                    Estimated Boxes / Guests
                  </label>
                  <input
                    id="corp-qty"
                    type="number"
                    min="10"
                    required
                    value={guestCount}
                    onChange={(e) => setGuestCount(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono-tabular bg-white border border-[#D6D0C4] rounded-xl text-[#1C1917] focus:outline-none focus:border-[#9A3412]"
                  />
                </div>
                <div>
                  <label htmlFor="corp-date" className="block text-xs font-medium text-[#57534E] mb-1">
                    Target Delivery Date
                  </label>
                  <input
                    id="corp-date"
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono-tabular bg-white border border-[#D6D0C4] rounded-xl text-[#1C1917] focus:outline-none focus:border-[#9A3412]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="corp-notes" className="block text-xs font-medium text-[#57534E] mb-1">
                  Menu Preferences &amp; Branding Notes
                </label>
                <textarea
                  id="corp-notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g., 60 assorted snack boxes with Osmania biscuits, paneer puffs, and custom ribbon sleeve..."
                  className="w-full px-3 py-2 text-sm bg-white border border-[#D6D0C4] rounded-xl text-[#1C1917] focus:outline-none focus:border-[#9A3412]"
                />
              </div>

              <div className="pt-2 flex items-center justify-between gap-3">
                <p className="text-[11px] text-[#57534E]">
                  GST billing &amp; scheduled fleet dispatch available for 25+ boxes.
                </p>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-semibold bg-[#9A3412] hover:bg-[#7C2D12] text-white rounded-xl transition-colors cursor-pointer shrink-0"
                >
                  Prepare Bulk Quote
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
