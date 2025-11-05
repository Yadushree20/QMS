import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

// Set worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

export default function BallooningCanvas({ pdfBlob }) {
  const [numPages, setNumPages] = useState(null);

  if (!pdfBlob) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 border-2 border-dashed rounded">
        <p className="text-gray-500">Ballooned PDF preview will appear here</p>
      </div>
    );
  }

  const url = URL.createObjectURL(pdfBlob);

  return (
    <div className="border rounded overflow-auto max-h-96 bg-white">
      <Document file={url} onLoadSuccess={({ numPages }) => setNumPages(numPages)}>
        {Array.from(new Array(numPages), (_, i) => (
          <Page key={i} pageNumber={i + 1} width={600} renderTextLayer={false} />
        ))}
      </Document>
    </div>
  );
}