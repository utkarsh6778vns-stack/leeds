import React from 'react';
import { BusinessLead } from '../types';
import { Mail, Phone, MapPin, Globe, Star, FileSpreadsheet, ShieldCheck, ShieldAlert, Shield, Instagram } from 'lucide-react';

interface ResultsTableProps {
  leads: BusinessLead[];
  isLoading: boolean;
}

const ResultsTable: React.FC<ResultsTableProps> = ({ leads, isLoading }) => {
  // Helper to extract domain for display
  const getDomain = (url: string) => {
    try {
      const hostname = new URL(url).hostname;
      return hostname.replace('www.', '');
    } catch {
      return 'Visit Website';
    }
  };

  const getQualityBadge = (quality?: string) => {
    switch (quality) {
      case 'Good':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
            <ShieldCheck className="w-3 h-3" /> Good
          </span>
        );
      case 'Decent':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-yellow-500/10 text-yellow-400 text-xs font-medium border border-yellow-500/20">
             <Shield className="w-3 h-3" /> Decent
          </span>
        );
      case 'Bad':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-red-500/10 text-red-400 text-xs font-medium border border-red-500/20">
             <ShieldAlert className="w-3 h-3" /> Bad
          </span>
        );
      default:
        return <span className="text-slate-600">-</span>;
    }
  };

  const downloadExcel = () => {
    // We create a HTML-based Excel file. Excel handles simple HTML tables with the correct MIME type perfectly.
    // This allows us to keep formatting and links working better than CSV.
    const tableContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="UTF-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Leads</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: sans-serif; }
          table { border-collapse: collapse; width: 100%; }
          th { background-color: #4f5b66; color: #ffffff; border: 1px solid #000; padding: 10px; }
          td { border: 1px solid #ccc; padding: 8px; vertical-align: top; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>
              <th>Business Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Website</th>
              <th>Instagram</th>
              <th>Web Quality</th>
              <th>Rating</th>
              <th>Address</th>
              <th>Maps Link</th>
            </tr>
          </thead>
          <tbody>
            ${leads.map(l => `
              <tr>
                <td>${l.name}</td>
                <td>${l.email || ''}</td>
                <td>${l.phone || ''}</td>
                <td><a href="${l.website || ''}">${l.website || ''}</a></td>
                <td><a href="${l.instagram || ''}">${l.instagram || ''}</a></td>
                <td>${l.websiteQuality || ''}</td>
                <td>${l.rating || ''}</td>
                <td>${l.address}</td>
                <td><a href="${l.googleMapsUri || ''}">View on Maps</a></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([tableContent], { type: 'application/vnd.ms-excel' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads_export_${new Date().toISOString().slice(0,10)}.xls`;
    a.click();
  };

  return (
    <div className="w-full h-full overflow-hidden flex flex-col bg-n8n-node rounded-xl border border-slate-700 shadow-xl">
      <div className="bg-n8n-panel p-3 border-b border-slate-700 flex justify-between items-center">
        <div className="flex items-center gap-2">
           <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
           <span className="text-sm font-mono text-emerald-400">Sheet1 - {leads.length} Records</span>
        </div>
        <button 
          onClick={downloadExcel}
          className="text-xs bg-green-700 hover:bg-green-600 text-white px-3 py-2 rounded transition-colors flex items-center gap-2 font-medium"
          disabled={leads.length === 0}
        >
          <FileSpreadsheet className="w-3 h-3" />
          Download Excel
        </button>
      </div>
      
      {leads.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center h-full text-slate-500 p-12 text-center">
            <div className="text-4xl mb-4 opacity-50">📊</div>
            <p className="text-lg font-medium text-slate-400">No data collected yet</p>
            <p className="text-sm">Run the workflow to populate the spreadsheet</p>
        </div>
      ) : (
      <div className="overflow-auto flex-grow">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-n8n-dark text-slate-400 sticky top-0 z-10">
            <tr>
              <th className="p-3 font-medium border-b border-slate-700 w-12">#</th>
              <th className="p-3 font-medium border-b border-slate-700">Business Name</th>
              <th className="p-3 font-medium border-b border-slate-700">Email</th>
              <th className="p-3 font-medium border-b border-slate-700">Phone</th>
              <th className="p-3 font-medium border-b border-slate-700">Website</th>
              <th className="p-3 font-medium border-b border-slate-700">Instagram</th>
              <th className="p-3 font-medium border-b border-slate-700">Web Quality</th>
              <th className="p-3 font-medium border-b border-slate-700">Rating</th>
              <th className="p-3 font-medium border-b border-slate-700">Address</th>
              <th className="p-3 font-medium border-b border-slate-700">Maps</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {leads.map((lead, idx) => (
              <tr key={lead.id} className="hover:bg-slate-700/30 transition-colors group">
                <td className="p-3 text-slate-500 font-mono">{idx + 1}</td>
                <td className="p-3 font-medium text-white max-w-[200px] truncate" title={lead.name}>
                  {lead.name}
                </td>
                <td className="p-3 text-slate-300">
                    {lead.email ? (
                        <div className="flex items-center gap-2 text-indigo-400 max-w-[180px] truncate" title={lead.email}>
                             <Mail className="w-3 h-3 flex-shrink-0" />
                             {lead.email}
                        </div>
                    ) : <span className="text-slate-600">-</span>}
                </td>
                <td className="p-3 text-slate-300">
                    {lead.phone ? (
                        <div className="flex items-center gap-2">
                             <Phone className="w-3 h-3 text-slate-500" />
                             {lead.phone}
                        </div>
                    ) : <span className="text-slate-600">-</span>}
                </td>
                <td className="p-3 text-blue-400">
                  {lead.website ? (
                    <a href={lead.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline max-w-[150px] truncate" title={lead.website}>
                      <Globe className="w-3 h-3 flex-shrink-0" /> {getDomain(lead.website)}
                    </a>
                  ) : <span className="text-slate-600">-</span>}
                </td>
                <td className="p-3">
                   {lead.instagram ? (
                    <a href={lead.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-pink-400 hover:text-pink-300 transition-colors" title={lead.instagram}>
                        <Instagram className="w-4 h-4" /> <span className="text-xs">Profile</span>
                    </a>
                   ) : <span className="text-slate-600">-</span>}
                </td>
                <td className="p-3">
                    {getQualityBadge(lead.websiteQuality)}
                </td>
                <td className="p-3 text-slate-300">
                    {lead.rating ? (
                        <span className="flex items-center gap-1 text-yellow-400">
                            <Star className="w-3 h-3 fill-current" /> {lead.rating}
                        </span>
                    ) : <span className="text-slate-600">-</span>}
                </td>
                <td className="p-3 text-slate-400 max-w-xs truncate" title={lead.address}>
                    {lead.address}
                </td>
                <td className="p-3">
                    {lead.googleMapsUri && (
                        <a href={lead.googleMapsUri} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-emerald-400 transition-colors">
                            <MapPin className="w-4 h-4" />
                        </a>
                    )}
                </td>
              </tr>
            ))}
            {isLoading && (
               /* Skeleton rows */
               Array.from({ length: 5 }).map((_, i) => (
                <tr key={`skel-${i}`} className="animate-pulse">
                    <td className="p-3"><div className="h-4 w-4 bg-slate-700 rounded"></div></td>
                    <td className="p-3"><div className="h-4 w-32 bg-slate-700 rounded"></div></td>
                    <td className="p-3"><div className="h-4 w-24 bg-slate-700 rounded"></div></td>
                    <td className="p-3"><div className="h-4 w-24 bg-slate-700 rounded"></div></td>
                    <td className="p-3"><div className="h-4 w-20 bg-slate-700 rounded"></div></td>
                    <td className="p-3"><div className="h-4 w-16 bg-slate-700 rounded"></div></td>
                    <td className="p-3"><div className="h-4 w-16 bg-slate-700 rounded"></div></td>
                    <td className="p-3"><div className="h-4 w-12 bg-slate-700 rounded"></div></td>
                    <td className="p-3"><div className="h-4 w-40 bg-slate-700 rounded"></div></td>
                    <td className="p-3"><div className="h-4 w-4 bg-slate-700 rounded"></div></td>
                </tr>
               ))
            )}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
};

export default ResultsTable;