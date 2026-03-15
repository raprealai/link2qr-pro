
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCodeData } from '../types';
import { Trash2, ExternalLink, Download } from 'lucide-react';

interface HistoryItemProps {
  item: QrCodeData;
  onDelete: (id: string) => void;
}

export const HistoryItem: React.FC<HistoryItemProps> = ({ item, onDelete }) => {
  const downloadQR = () => {
    const svg = document.getElementById(`qr-${item.id}`);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = 1000;
      canvas.height = 1000;
      ctx?.drawImage(img, 0, 0, 1000, 1000);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `qr-${item.title.replace(/\s+/g, '-').toLowerCase()}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4 transition-all hover:shadow-md group">
      <div className="flex-shrink-0 bg-slate-50 p-2 rounded-lg">
        <QRCodeSVG 
          id={`qr-${item.id}`}
          value={item.url} 
          size={64} 
          fgColor={item.fgColor} 
          bgColor={item.bgColor}
        />
      </div>
      <div className="flex-grow min-w-0">
        <h3 className="font-semibold text-slate-800 truncate">{item.title}</h3>
        <p className="text-xs text-slate-400 mb-1">{item.category} • {new Date(item.timestamp).toLocaleDateString()}</p>
        <p className="text-sm text-slate-500 truncate">{item.url}</p>
      </div>
      <div className="flex gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => window.open(item.url, '_blank')}
          className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg"
          title="Open Link"
        >
          <ExternalLink size={18} />
        </button>
        <button 
          onClick={downloadQR}
          className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg"
          title="Download"
        >
          <Download size={18} />
        </button>
        <button 
          onClick={() => onDelete(item.id)}
          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
          title="Delete"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};
