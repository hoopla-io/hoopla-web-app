'use client';

import { Share2 } from 'lucide-react';
import { Fragment, useState } from 'react';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/button';

export default function ShareButton() {
  const [showOptions, setShowOptions] = useState(false);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check this out!',
          text: 'Take a look at this awesome coffee shop.',
          url: window.location.href,
        });
      } catch (error) {
        toast.error('Error sharing: ' + error);
        console.error('Error sharing:', error);
      }
    } else {
      setShowOptions(true);
    }
  };

  return (
    <Fragment>
      <Button
        onClick={handleShare}
        className="w-12 h-12 rounded-full shadow-lg bg-white text-black hover:bg-gray-100 transition-all"
      >
        <Share2 className="w-10 h-10" />
      </Button>

      {showOptions && (
        <div className="absolute top-14 right-0 bg-white shadow-lg rounded-lg p-2 flex flex-col">
          <a
            href={`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:bg-gray-100 rounded"
          >
            Share on Telegram
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
              window.location.href,
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:bg-gray-100 rounded"
          >
            Share on Facebook
          </a>
        </div>
      )}
    </Fragment>
  );
}
