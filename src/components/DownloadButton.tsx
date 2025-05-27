import React from 'react';
import html2canvas from 'html2canvas';

interface DownloadButtonProps {
  targetRef: React.RefObject<HTMLDivElement>;
  filename?: string;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({ targetRef, filename = 'portfolio-snapshot' }) => {
  const handleDownload = async () => {
    if (!targetRef.current) return;
    
    const element = targetRef.current;

    setTimeout(async () => {
      try {
        const canvas = await html2canvas(element, {
          scale: 2, 
          useCORS: true, 
          backgroundColor: '#ffffff', 
          logging: false, 
          windowWidth: element.scrollWidth,
          windowHeight: element.scrollHeight,
          scrollX: element.scrollLeft,
          scrollY: element.scrollTop,
          onclone: (clonedDoc) => {
            // Disable all transitions and animations in the cloned document
            clonedDoc.querySelectorAll('*').forEach((node) => {
              if (node instanceof HTMLElement && node.style) {
                node.style.transition = 'none !important';
                node.style.animation = 'none !important';
              }
            });
          },
        });
        
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `${filename}-${new Date().toISOString().split('T')[0]}.png`;
        link.href = dataUrl;
        link.click();
      } catch (error) {
        console.error('Error generating image:', error);
      }
    }, 250); // 250ms delay
  };

  return (
    <button 
      onClick={handleDownload}
      className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm flex items-center gap-1 hover:bg-blue-700 transition-colors"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
      Download as Image
    </button>
  );
};

export default DownloadButton;
