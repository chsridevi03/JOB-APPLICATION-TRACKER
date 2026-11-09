import React, { useState, useMemo } from 'react';
import {
  Building2,
  Search,
  Plus,
  Globe,
  Mail,
  Phone,
  MapPin,
  Edit,
  Trash2,
  ExternalLink,
  Briefcase,
} from 'lucide-react';
import { Company } from '../types';

interface CompaniesViewProps {
  companies: Company[];
  onOpenAddCompany: () => void;
  onEditCompany: (company: Company) => void;
  onDeleteCompany: (id: string) => void;
  onSelectCompanyApplications: (companyId: string) => void;
}

export const CompaniesView: React.FC<CompaniesViewProps> = ({
  companies,
  onOpenAddCompany,
  onEditCompany,
  onDeleteCompany,
  onSelectCompanyApplications,
}) => {
  const [search, setSearch] = useState<string>('');

  const filteredCompanies = useMemo(() => {
    if (!search.trim()) return companies;
    const s = search.toLowerCase();
    return companies.filter(
      (c) =>
        c.company_name.toLowerCase().includes(s) ||
        (c.location && c.location.toLowerCase().includes(s)) ||
        (c.description && c.description.toLowerCase().includes(s))
    );
  }, [companies, search]);

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Companies Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage employer contacts, HR recruiter details, and company profiles
          </p>
        </div>
        <button
          onClick={onOpenAddCompany}
          className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Company</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search companies by name, location, or description..."
            className="w-full text-xs pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
          />
        </div>
      </div>

      {/* Grid of Companies */}
      {filteredCompanies.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-2xs">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-900">No companies found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search ? 'No companies match your search query.' : 'Add your first company to associate with job applications.'}
          </p>
          <button
            onClick={onOpenAddCompany}
            className="mt-4 px-4 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            Add Company
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCompanies.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="p-2 bg-slate-100 text-slate-700 rounded-lg">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditCompany(c)}
                      className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit company"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteCompany(c.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete company"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-base">{c.company_name}</h3>

                {c.description && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {c.description}
                  </p>
                )}

                <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                  {c.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{c.location}</span>
                    </div>
                  )}
                  {c.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <a
                        href={c.website.startsWith('http') ? c.website : `https://${c.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline truncate"
                      >
                        {c.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                  {c.contact_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <a href={`mailto:${c.contact_email}`} className="text-slate-700 hover:text-blue-600 truncate">
                        {c.contact_email}
                      </a>
                    </div>
                  )}
                  {c.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-mono">{c.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-mono">
                  {c.applicationsCount || 0} applications
                </span>
                <button
                  onClick={() => onSelectCompanyApplications(c.id)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>View Jobs</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
