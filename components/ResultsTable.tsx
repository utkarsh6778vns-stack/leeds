import React, { useRef, useEffect, useState } from 'react';
import { BusinessLead } from '../types';
import { Mail, Phone, MapPin, Globe, Star, FileSpreadsheet, Instagram, ExternalLink, Check, ArrowRight, MessageCircle } from 'lucide-react';

interface ResultsTableProps {
  leads: BusinessLead[];
  isLoading: boolean;
}

const ResultsTable: React.FC<ResultsTableProps> = ({ leads, isLoading }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Auto-scroll to bottom when new leads are added
  useEffect(() => {
    if (leads.length > 0 && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [leads.length]);

  // Helper to extract domain for display
  const getDomain = (url: string) => {
    try {
      const hostname = new URL(url).hostname;
      return hostname.replace('www.', '');
    } catch {
      return 'Website';
    }
  };

  const getQualityBadge = (quality?: string) => {
    switch (quality) {
      case 'Good':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 uppercase tracking-wide">
            Good
          </span>
        );
      case 'Decent':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 text-[10px] font-bold border border-yellow-500/20 uppercase tracking-wide">
            Decent
          </span>
        );
      case 'Bad':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-[10px] font-bold border border-red-500/20 uppercase tracking-wide">
            Bad
          </span>
        );
      default:
        return <span className="text-slate-600">-</span>;
    }
  };

  const handleSendToSheets = () => {
    // 1. Format headers and rows using Tab separators (standard for pasting into Sheets)
    const headers = [
      'Business Name',
      'Email',
      'Phone',
      'WhatsApp',
      'Website',
      'Instagram',
      'Web Quality',
      'Rating',
      'Address',
      'Maps Link'
    ].join('\t');

    const rows = leads.map(l => {
      // Clean data to ensure it doesn't break the TSV format 
      // Replace tabs, newlines, and multiple spaces with a single space
      const clean = (str?: string | number) => 
        str ? String(str).replace(/[\t\n\r]+/g, ' ').replace(/\s+/g, ' ').trim() : '';
      
      return [
        clean(l.name),
        clean(l.email),
        clean(l.phone),
        clean(l.whatsapp),
        clean(l.website),
        clean(l.instagram),
        clean(l.websiteQuality),
        clean(l.rating),
        clean(l.address),
        clean(l.googleMapsUri)
      ].join('\t');
    }).join('\n');

    const tsvData = `${headers}\n${rows}`;

    // 2. Copy to clipboard
    navigator.clipboard.writeText(tsvData).then(() => {
      setIsCopied(true);
      
      // Delay opening the window slightly to ensure the user registers the "Copied" message
      setTimeout(() => {
         // 3. Open new Google Sheet
         window.open('https://docs.google.com/spreadsheets/create', '_blank');
         
         // Reset button state
         setTimeout(() => setIsCopied(false), 4000);
      }, 500);

    }).catch(err => {
      console.error('Failed to copy text: ', err);
      alert('Could not copy to clipboard. Please allow clipboard access to use this feature.');
    });
  };

  return (
    <div className="w-full h-full overflow-hidden flex flex-col bg-n8n-node">
      <div className="bg-n8n-panel p-3 border-b border-slate-700 flex justify-between items-center shadow-md z-10">
        <div className="flex items-center gap-2">
           <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
           <span className="text-sm font-mono text-emerald-400">Live Data</span>
        </div>
        
        <div className="flex flex-col items-end">
          <button 
            onClick={handleSendToSheets}
            disabled={leads.length === 0}
            className={`
              text-xs px-4 py-2 rounded transition-all flex items-center gap-2 font-medium shadow-lg
              ${isCopied 
                ? 'bg-emerald-600 text-white shadow-emerald-500/20 ring-1 ring-emerald-400' 
                : 'bg-green-700 hover:bg-green-600 text-white hover:shadow-green-500/20'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied! Now Paste (Ctrl+V)</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Open in Google Sheets</span>
                <ArrowRight className="w-3 h-3 opacity-60" />
              </>
            )}
          </button>
          {leads.length > 0 && !isCopied && (
            <span className="text-[10px] text-slate-500 mt-1 mr-1">
              Data auto-copies. You must Paste it.
            </span>
          )}
        </div>
      </div>
      
      {leads.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center h-full text-slate-500 p-12 text-center">
            <div className="text-5xl mb-6 opacity-30 grayscale">📊</div>
            <p className="text-lg font-medium text-slate-400">Ready to scrape</p>
            <p className="text-sm max-w-xs mt-2">Enter a business type and location to start building your lead list.</p>
        </div>
      ) : (
      <div className="overflow-auto flex-grow" ref={scrollRef}>
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-n8n-dark text-slate-400 sticky top-0 z-20 shadow-sm">
            <tr>
              <th className="p-3 font-semibold border-b border-slate-700 w-12 text-center">#</th>
              <th className="p-3 font-semibold border-b border-slate-700">Business Name</th>
              <th className="p-3 font-semibold border-b border-slate-700">Email</th>
              <th className="p-3 font-semibold border-b border-slate-700">Phone</th>
              <th className="p-3 font-semibold border-b border-slate-700">WhatsApp</th>
              <th className="p-3 font-semibold border-b border-slate-700">Website</th>
              <th className="p-3 font-semibold border-b border-slate-700">Instagram</th>
              <th className="p-3 font-semibold border-b border-slate-700">Quality</th>
              <th className="p-3 font-semibold border-b border-slate-700">Rating</th>
              <th className="p-3 font-semibold border-b border-slate-700">Address</th>
              <th className="p-3 font-semibold border-b border-slate-700 text-center">Map</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {leads.map((lead, idx) => (
              <tr key={lead.id} className="hover:bg-slate-700/40 transition-colors group">
                <td className="p-3 text-slate-500 font-mono text-center text-xs">{idx + 1}</td>
                <td className="p-3 font-medium text-white max-w-[200px] truncate" title={lead.name}>
                  {lead.name}
                </td>
                <td className="p-3 text-slate-300">
                    {lead.email ? (
                        <div className="flex items-center gap-2 text-indigo-400 max-w-[180px] truncate select-all cursor-pointer hover:text-indigo-300" title={lead.email}>
                             <Mail className="w-3 h-3 flex-shrink-0" />
                             {lead.email}
                        </div>
                    ) : <span className="text-slate-600">-</span>}
                </td>
                <td className="p-3 text-slate-300">
                    {lead.phone ? (
                        <div className="flex items-center gap-2 select-all">
                             <Phone className="w-3 h-3 text-slate-500" />
                             {lead.phone}
                        </div>
                    ) : <span className="text-slate-600">-</span>}
                </td>
                <td className="p-3 text-slate-300">
                    {lead.whatsapp ? (
                        <div className="flex items-center gap-2 select-all text-green-400">
                             <MessageCircle className="w-3 h-3 flex-shrink-0" />
                             {lead.whatsapp}
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
                        <Instagram className="w-4 h-4" /> <span className="text-xs">View</span>
                    </a>
                   ) : <span className="text-slate-600">-</span>}
                </td>
                <td className="p-3">
                    {getQualityBadge(lead.websiteQuality)}
                </td>
                <td className="p-3 text-slate-300">
                    {lead.rating ? (
                        <span className="flex items-center gap-1 text-yellow-400 font-mono text-xs">
                            <Star className="w-3 h-3 fill-current" /> {lead.rating}
                        </span>
                    ) : <span className="text-slate-600">-</span>}
                </td>
                <td className="p-3 text-slate-400 max-w-xs truncate text-xs" title={lead.address}>
                    {lead.address}
                </td>
                <td className="p-3 text-center">
                    {lead.googleMapsUri ? (
                        <a href={lead.googleMapsUri} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-emerald-400 transition-colors inline-block p-1 hover:bg-slate-700 rounded">
                            <MapPin className="w-4 h-4" />
                        </a>
                    ) : <span className="text-slate-600">-</span>}
                </td>
              </tr>
            ))}
            {isLoading && (
               /* Better Skeleton Loader */
               Array.from({ length: 3 }).map((_, i) => (
                <tr key={`skel-${i}`} className="animate-pulse bg-slate-800/20">
                    <td className="p-3"><div className="h-3 w-4 bg-slate-700/50 rounded mx-auto"></div></td>
                    <td className="p-3"><div className="h-3 w-32 bg-slate-700/50 rounded"></div></td>
                    <td className="p-3"><div className="h-3 w-24 bg-slate-700/50 rounded"></div></td>
                    <td className="p-3"><div className="h-3 w-20 bg-slate-700/50 rounded"></div></td>
                    <td className="p-3"><div className="h-3 w-20 bg-slate-700/50 rounded"></div></td>
                    <td className="p-3"><div className="h-3 w-20 bg-slate-700/50 rounded"></div></td>
                    <td className="p-3"><div className="h-3 w-16 bg-slate-700/50 rounded"></div></td>
                    <td className="p-3"><div className="h-3 w-16 bg-slate-700/50 rounded"></div></td>
                    <td className="p-3"><div className="h-3 w-8 bg-slate-700/50 rounded"></div></td>
                    <td className="p-3"><div className="h-3 w-40 bg-slate-700/50 rounded"></div></td>
                    <td className="p-3"><div className="h-3 w-4 bg-slate-700/50 rounded mx-auto"></div></td>
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