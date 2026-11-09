import React, { useState, useEffect } from 'react';
import { X, Building2, AlertCircle } from 'lucide-react';
import { Company } from '../types';
import { api } from '../api';

interface AddCompanyModalProps {
  isOpen: boolean;
  editCompany?: Company | null;
  onClose: () => void;
  onSuccess: (company: Company) => void;
}

export const AddCompanyModal: React.FC<AddCompanyModalProps> = ({
  isOpen,
  editCompany,
  onClose,
  onSuccess,
}) => {
  const [companyName, setCompanyName] = useState<string>('');
  const [website, setWebsite] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (editCompany) {
      setCompanyName(editCompany.company_name);
      setWebsite(editCompany.website || '');
      setLocation(editCompany.location || '');
      setContactEmail(editCompany.contact_email || '');
      setPhone(editCompany.phone || '');
      setDescription(editCompany.description || '');
    } else {
      setCompanyName('');
      setWebsite('');
      setLocation('');
      setContactEmail('');
      setPhone('');
      setDescription('');
    }
    setError('');
  }, [editCompany, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setError('Company name cannot be empty.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      if (editCompany) {
        const updated = await api.updateCompany(editCompany.id, {
          company_name: companyName.trim(),
          website: website.trim(),
          location: location.trim(),
          contact_email: contactEmail.trim(),
          phone: phone.trim(),
          description: description.trim(),
        });
        onSuccess(updated);
      } else {
        const created = await api.createCompany({
          company_name: companyName.trim(),
          website: website.trim(),
          location: location.trim(),
          contact_email: contactEmail.trim(),
          phone: phone.trim(),
          description: description.trim(),
        });
        onSuccess(created);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save company details');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {editCompany ? 'Edit Company' : 'Add New Company'}
              </h2>
              <p className="text-xs text-slate-500">Record HR contacts, headquarters, and web presence</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Company Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Stripe, Linear, Netflix"
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Website URL</label>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://company.com"
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Location / Headquarters</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. San Francisco, CA"
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">HR Contact Email</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="talent@company.com"
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 019-2831"
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Company Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Brief overview of products, engineering culture, or benefits..."
              className="w-full text-xs rounded-lg border border-slate-300 p-2.5 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : editCompany ? 'Save Changes' : 'Create Company'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
