"use client";

import { useState } from "react";

interface WhatsAppNotificationModalProps {
  isOpen: boolean;
  employeeName: string;
  taskTitle: string;
  clientName: string;
  dueDate: string;
  assignerName: string;
  onClose: () => void;
}

export default function WhatsAppNotificationModal({
  isOpen,
  employeeName,
  taskTitle,
  clientName,
  dueDate,
  assignerName,
  onClose,
}: WhatsAppNotificationModalProps) {
  const [copied, setCopied] = useState(false);

  // Format date as DD MMM YYYY
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "Not set";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Build the message
  const message = `Hi ${employeeName},

You have been assigned a new task:

📋 ${taskTitle}
🏢 Client: ${clientName}
📅 Due: ${formatDate(dueDate)}

Please log in to FirmFlow to see the full checklist and start working.

Regards,
${assignerName}`;

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy message:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-700 rounded-lg shadow-lg p-6 max-w-md w-full">
        {/* Header */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          💬 WhatsApp Notification
        </h2>

        {/* Message Preview */}
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
            {message}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleCopyMessage}
            className={`flex-1 px-4 py-2 rounded-md font-semibold transition min-h-[44px] flex items-center justify-center ${
              copied
                ? "bg-success-500 dark:bg-green-700 text-white"
                : "bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-800"
            }`}
          >
            {copied ? "✓ Copied!" : "📋 Copy message"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 font-semibold transition min-h-[44px] flex items-center justify-center"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
