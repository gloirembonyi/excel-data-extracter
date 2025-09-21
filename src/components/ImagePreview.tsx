'use client';

import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut } from 'lucide-react';

interface ImagePreviewProps {
    imageUrl: string;
    fileName: string;
    onClose: () => void;
    size?: 'small' | 'medium' | 'large';
}

export default function ImagePreview({
    imageUrl,
    fileName,
    onClose,
    size = 'small'
}: ImagePreviewProps) {
    const [zoom, setZoom] = useState(1);

    const getSizeClasses = () => {
        switch (size) {
            case 'small':
                return 'max-w-xs max-h-48';
            case 'medium':
                return 'max-w-sm max-h-64';
            case 'large':
                return 'max-w-md max-h-80';
            default:
                return 'max-w-xs max-h-48';
        }
    };

    const handleZoomIn = () => {
        setZoom(prev => Math.min(prev + 0.2, 3));
    };

    const handleZoomOut = () => {
        setZoom(prev => Math.max(prev - 0.2, 0.5));
    };

    return (
        <div className="relative inline-block">
            <div className="relative group">
                <img
                    src={imageUrl}
                    alt={`Preview of ${fileName}`}
                    className={`${getSizeClasses()} rounded-lg shadow-md border border-gray-200 object-contain transition-transform duration-200`}
                    style={{ transform: `scale(${zoom})` }}
                />

                {/* Overlay controls */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="flex gap-1">
                        <button
                            onClick={handleZoomIn}
                            className="p-1 bg-white bg-opacity-80 rounded hover:bg-opacity-100"
                            title="Zoom In"
                        >
                            <ZoomIn className="w-4 h-4 text-gray-700" />
                        </button>
                        <button
                            onClick={handleZoomOut}
                            className="p-1 bg-white bg-opacity-80 rounded hover:bg-opacity-100"
                            title="Zoom Out"
                        >
                            <ZoomOut className="w-4 h-4 text-gray-700" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1 bg-white bg-opacity-80 rounded hover:bg-opacity-100"
                            title="Close"
                        >
                            <X className="w-4 h-4 text-gray-700" />
                        </button>
                    </div>
                </div>
            </div>

            {/* File name */}
            <p className="text-xs text-gray-600 mt-1 text-center truncate max-w-full">
                {fileName}
            </p>
        </div>
    );
}
