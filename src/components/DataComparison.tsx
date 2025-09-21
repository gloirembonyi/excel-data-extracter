'use client';

import React, { useState } from 'react';
import { FileSpreadsheet, ArrowRight, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface ComparisonResult {
    field: string;
    value1: any;
    value2: any;
    match: boolean;
    difference?: string;
}

interface DataComparisonProps {
    data1: Record<string, any>[];
    data2: Record<string, any>[];
    title1?: string;
    title2?: string;
}

export default function DataComparison({
    data1,
    data2,
    title1 = "Dataset 1",
    title2 = "Dataset 2"
}: DataComparisonProps) {
    const [comparisonResults, setComparisonResults] = useState<ComparisonResult[]>([]);
    const [isComparing, setIsComparing] = useState(false);

    const compareData = () => {
        if (data1.length === 0 || data2.length === 0) return;

        setIsComparing(true);
        const results: ComparisonResult[] = [];

        // Get all unique fields from both datasets
        const allFields = new Set([
            ...Object.keys(data1[0] || {}),
            ...Object.keys(data2[0] || {})
        ]);

        // Compare each field
        allFields.forEach(field => {
            const values1 = data1.map(row => row[field]).filter(val => val !== undefined && val !== '');
            const values2 = data2.map(row => row[field]).filter(val => val !== undefined && val !== '');

            const unique1 = new Set(values1);
            const unique2 = new Set(values2);

            const common = new Set([...unique1].filter(x => unique2.has(x)));
            const onlyIn1 = new Set([...unique1].filter(x => !unique2.has(x)));
            const onlyIn2 = new Set([...unique2].filter(x => !unique1.has(x)));

            const match = onlyIn1.size === 0 && onlyIn2.size === 0;

            let difference = '';
            if (onlyIn1.size > 0) {
                difference += `Only in ${title1}: ${Array.from(onlyIn1).slice(0, 3).join(', ')}${onlyIn1.size > 3 ? '...' : ''}`;
            }
            if (onlyIn2.size > 0) {
                if (difference) difference += ' | ';
                difference += `Only in ${title2}: ${Array.from(onlyIn2).slice(0, 3).join(', ')}${onlyIn2.size > 3 ? '...' : ''}`;
            }

            results.push({
                field,
                value1: `${unique1.size} unique values`,
                value2: `${unique2.size} unique values`,
                match,
                difference: difference || undefined
            });
        });

        setComparisonResults(results);
        setIsComparing(false);
    };

    const getMatchIcon = (match: boolean) => {
        return match ? (
            <CheckCircle className="w-4 h-4 text-green-500" />
        ) : (
            <XCircle className="w-4 h-4 text-red-500" />
        );
    };

    const getMatchColor = (match: boolean) => {
        return match ? 'text-green-700' : 'text-red-700';
    };

    return (
        <div className="bg-white border border-gray-300 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5" />
                    Data Comparison
                </h3>
                <button
                    onClick={compareData}
                    disabled={isComparing || data1.length === 0 || data2.length === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isComparing ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Comparing...
                        </>
                    ) : (
                        <>
                            <ArrowRight className="w-4 h-4" />
                            Compare Data
                        </>
                    )}
                </button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-700 mb-2">{title1}</h4>
                    <p className="text-sm text-gray-600">{data1.length} rows</p>
                    <p className="text-sm text-gray-600">
                        {data1.length > 0 ? Object.keys(data1[0]).length : 0} columns
                    </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-700 mb-2">{title2}</h4>
                    <p className="text-sm text-gray-600">{data2.length} rows</p>
                    <p className="text-sm text-gray-600">
                        {data2.length > 0 ? Object.keys(data2[0]).length : 0} columns
                    </p>
                </div>
            </div>

            {/* Comparison Results */}
            {comparisonResults.length > 0 && (
                <div className="space-y-2">
                    <h4 className="font-semibold text-gray-700 mb-3">Field Comparison Results</h4>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Field</th>
                                    <th className="px-3 py-2 text-left font-semibold text-gray-600">{title1}</th>
                                    <th className="px-3 py-2 text-left font-semibold text-gray-600">{title2}</th>
                                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Match</th>
                                    <th className="px-3 py-2 text-left font-semibold text-gray-600">Differences</th>
                                </tr>
                            </thead>
                            <tbody>
                                {comparisonResults.map((result, index) => (
                                    <tr key={index} className="border-b border-gray-200">
                                        <td className="px-3 py-2 font-medium text-gray-900">{result.field}</td>
                                        <td className="px-3 py-2 text-gray-700">{result.value1}</td>
                                        <td className="px-3 py-2 text-gray-700">{result.value2}</td>
                                        <td className="px-3 py-2">
                                            <div className="flex items-center gap-2">
                                                {getMatchIcon(result.match)}
                                                <span className={getMatchColor(result.match)}>
                                                    {result.match ? 'Match' : 'Different'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 text-gray-600 text-xs">
                                            {result.difference || '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {data1.length === 0 || data2.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                    <p>Please load data in both datasets to compare</p>
                </div>
            ) : null}
        </div>
    );
}
