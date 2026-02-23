"use client";

import { CreateListingForm } from "./CreateListingForm";

const CreateListingModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="w-full max-w-4xl bg-gray-900 border border-gray-700 rounded-lg shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Create New Listing</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>

        {/* Content */}
        <div className="p-4">
          <CreateListingForm />
        </div>
      </div>
    </div>
  );
};

export default CreateListingModal;