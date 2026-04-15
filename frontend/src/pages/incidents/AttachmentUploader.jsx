import React, { useRef } from 'react';

const AttachmentUploader = ({ attachments, onUpload, onDelete }) => {
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      onUpload(file);
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (attachments.length === 0 && !onUpload) return null;

  return (
    <div className="card bg-base-100 shadow-lg mt-6">
      <div className="card-body">
        <h3 className="card-title text-lg">
          Attachments
          <div className="badge badge-neutral badge-sm">{attachments.length}</div>
        </h3>

        {/* Upload Button */}
        {onUpload && (
          <div className="mb-4">
            <button
              className="btn btn-outline btn-sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={attachments.length >= 3}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload Image
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
              disabled={attachments.length >= 3}
            />
            {attachments.length >= 3 && (
              <p className="text-xs text-warning mt-1">Maximum 3 attachments reached</p>
            )}
          </div>
        )}

        {/* Attachments Grid */}
        {attachments.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {attachments.map((attachment) => (
              <div key={attachment.id} className="relative group">
                <img
                  src={attachment.base64Content || `/api/attachments/content/${attachment.id}`}
                  alt={attachment.originalFileName}
                  className="w-full h-24 object-cover rounded-lg cursor-pointer"
                  onClick={() => window.open(attachment.base64Content || `/api/attachments/content/${attachment.id}`, '_blank')}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                  {onDelete && (
                    <button
                      className="btn btn-circle btn-xs btn-error"
                      onClick={() => onDelete(attachment.id)}
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                <p className="text-xs text-base-content/60 truncate mt-1">{attachment.originalFileName}</p>
                <p className="text-xs text-base-content/40">{formatFileSize(attachment.fileSize)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AttachmentUploader;