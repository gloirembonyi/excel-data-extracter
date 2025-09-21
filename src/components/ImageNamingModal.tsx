'use client';

import React, { useState, useEffect } from 'react';
import { X, Image, FileText } from 'lucide-react';

interface ImageNamingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (names: { [key: string]: string }) => void;
    files: File[];
    className?: string;
}

const ImageNamingModal: React.FC<ImageNamingModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    files,
    className = ''
}) => {
    const [imageNames, setImageNames] = useState<{ [key: string]: string }>({});

    useEffect(() => {
        if (isOpen && files.length > 0) {
            // Initialize names with default values
            const initialNames: { [key: string]: string } = {};
            files.forEach((file, index) => {
                const fileKey = `${file.name}-${file.size}`;
                initialNames[fileKey] = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
            });
            setImageNames(initialNames);
        }
    }, [isOpen, files]);

    const handleNameChange = (fileKey: string, name: string) => {
        setImageNames(prev => ({
            ...prev,
            [fileKey]: name
        }));
    };

    const handleConfirm = () => {
        onConfirm(imageNames);
        onClose();
    };

    const handleCancel = () => {
        onClose();
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleConfirm();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden ${className}`}>
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800">Name Your Images</h2>
                    <button
                        onClick={handleCancel}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-96">
                    <p className="text-gray-600 mb-4">
                        Give each image a meaningful name before processing. This will help you identify the tables later.
                    </p>

                    <div className="space-y-4">
                        {files.map((file, index) => {
                            const fileKey = `${file.name}-${file.size}`;
                            const currentName = imageNames[fileKey] || '';

                            return (
                                <div key={fileKey} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                                    {/* Image Preview */}
                                    <div className="flex-shrink-0">
                                        {file.type.startsWith('image/') ? (
                                            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                                                <Image size={24} className="text-gray-400" />
                                            </div>
                                        ) : (
                                            <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                                                <FileText size={24} className="text-gray-400" />
                                            </div>
                                        )}
                                    </div>

                                    {/* File Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-800 truncate">
                                            {file.name}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>

                                    {/* Name Input */}
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Display Name
                                        </label>
                                        <input
                                            type="text"
                                            value={currentName}
                                            onChange={(e) => handleNameChange(fileKey, e.target.value)}
                                            onKeyDown={handleKeyPress}
                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder={`Image ${index + 1}`}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={handleCancel}
                        className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                        Process Images
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImageNamingModal;
