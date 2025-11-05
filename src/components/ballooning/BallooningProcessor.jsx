import { useState } from 'react';
import { addBalloonsToPdf } from '../../utils/pdfBalloon.js';

export default function BallooningProcessor({ originalPdf, onBalloonedPdf, onProcessing }) {
  const [balloonCount, setBalloonCount] = useState(30);

  const handleProcess = async () => {
    if (!originalPdf) return;
    onProcessing(true);
    try {
      const arrayBuffer = await originalPdf.arrayBuffer();
      const balloonedBytes = await addBalloonsToPdf(new Uint8Array(arrayBuffer), balloonCount);
      const blob = new Blob([balloonedBytes], { type: 'application/pdf' });
      onBalloonedPdf(blob);
    } catch (err) {
      console.error(err);
      alert('Failed to process PDF');
    } finally {
      onProcessing(false);
    }
  };

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded">
      <label className="block mb-2">
        Number of balloons:
        <input
          type="number"
          min={1}
          value={balloonCount}
          onChange={(e) => setBalloonCount(Number(e.target.value))}
          className="ml-2 w-20 border rounded px-2 py-1"
        />
      </label>
      <button
        onClick={handleProcess}
        disabled={!originalPdf}
        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        Add Balloons
      </button>
    </div>
  );
}