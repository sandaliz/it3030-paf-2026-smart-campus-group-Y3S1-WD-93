import React from 'react';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <dialog className={`modal modal-open`}>
      <div className={`modal-box ${sizeClasses[size]}`}>
        <h3 className="font-bold text-lg mb-4">{title}</h3>
        {children}
        <div className="modal-action">
          <button className="btn btn-sm" onClick={onClose}>Close</button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
};

export default Modal;