import React, { useState, useEffect } from 'react';
import { resourceService } from '../../services/resourceService';

const ShareModal = ({ isOpen, onClose, resource }) => {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [showQrCode, setShowQrCode] = useState(false);

  useEffect(() => {
    if (isOpen && resource) {
      const url = `${window.location.origin}/resources/${resource.id}`;
      setShareUrl(url);
      
      // Generate QR code using a free API
      setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`);
    }
  }, [isOpen, resource]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      // Track share analytics
      await resourceService.trackShare(resource.id);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShareViaEmail = () => {
    const subject = encodeURIComponent(`Check out this resource: ${resource.name}`);
    const body = encodeURIComponent(`I thought you might be interested in this resource:\n\n${resource.name}\nType: ${resource.type.replace('_', ' ')}\nLocation: ${resource.location}\nCapacity: ${resource.capacity} people\n\nView details: ${shareUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
    resourceService.trackShare(resource.id);
  };

  const getResourceIcon = (type) => {
    switch (type) {
      case 'LECTURE_HALL':
        return '🏛️';
      case 'LAB':
        return '🔬';
      case 'MEETING_ROOM':
        return '🤝';
      case 'EQUIPMENT':
        return '📱';
      case 'OFFICE':
        return '🏢';
      case 'AUDITORIUM':
        return '🎭';
      default:
        return '📦';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'badge-success';
      case 'OUT_OF_SERVICE':
        return 'badge-error';
      case 'UNDER_MAINTENANCE':
        return 'badge-warning';
      default:
        return 'badge-neutral';
    }
  };

  if (!isOpen || !resource) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <h3 className="font-bold text-lg mb-4">Share Resource</h3>
        
        {/* Resource Preview Card */}
        <div className="card bg-base-200 mb-6">
          <div className="card-body p-4">
            <div className="flex items-start gap-3">
              <span className="text-3xl">{getResourceIcon(resource.type)}</span>
              <div className="flex-1">
                <h4 className="font-semibold text-lg">{resource.name}</h4>
                <p className="text-sm text-base-content/70 capitalize">
                  {resource.type.replace('_', ' ').toLowerCase()}
                </p>
                <div className="flex items-center gap-3 mt-2 text-sm">
                  <div className={`badge ${getStatusBadgeColor(resource.status)} badge-sm`}>
                    {resource.status.replace('_', ' ')}
                  </div>
                  <span className="flex items-center gap-1">
                    📍 {resource.location}
                  </span>
                  <span className="flex items-center gap-1">
                    👥 {resource.capacity} people
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Share URL Section */}
        <div className="form-control mb-4">
          <label className="label">
            <span className="label-text font-semibold">Share Link</span>
          </label>
          <div className="join w-full">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="input input-bordered join-item flex-1"
            />
            <button
              onClick={handleCopy}
              className={`btn join-item ${copied ? 'btn-success' : 'btn-primary'}`}
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        {/* QR Code Section */}
        <div className="form-control mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="label">
              <span className="label-text font-semibold">QR Code</span>
            </label>
            <button
              onClick={() => setShowQrCode(!showQrCode)}
              className="btn btn-xs btn-ghost"
            >
              {showQrCode ? 'Hide' : 'Show'}
            </button>
          </div>
          {showQrCode && (
            <div className="flex justify-center p-4 bg-base-200 rounded-lg">
              <img
                src={qrCodeUrl}
                alt="QR Code"
                className="w-48 h-48"
              />
            </div>
          )}
        </div>

        {/* Share Options */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={handleShareViaEmail}
            className="btn btn-outline flex-1"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Share via Email
          </button>
        </div>

        {/* Close Button */}
        <div className="modal-action">
          <button onClick={onClose} className="btn">
            Close
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
};

export default ShareModal;
