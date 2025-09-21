'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Edit2, Save, X, Plus, Trash2, Download, Copy, Check } from 'lucide-react';

interface ExcelLikeTableProps {
    data: Record<string, any>[];
    title: string;
    onTitleChange?: (title: string) => void;
    onDataChange?: (data: Record<string, any>[]) => void;
    onExport?: () => void;
    onDelete?: () => void;
    className?: string;
}

interface CellPosition {
    row: number;
    col: string;
}

const ExcelLikeTable: React.FC<ExcelLikeTableProps> = ({
    data,
    title,
    onTitleChange,
    onDataChange,
    onExport,
    onDelete,
    className = ''
}) => {
    const [editingTitle, setEditingTitle] = useState(false);
    const [titleValue, setTitleValue] = useState(title);
    const [editingCell, setEditingCell] = useState<CellPosition | null>(null);
    const [cellValue, setCellValue] = useState('');
    const [tableData, setTableData] = useState(data);
    const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionStart, setSelectionStart] = useState<CellPosition | null>(null);
    const [selectionEnd, setSelectionEnd] = useState<CellPosition | null>(null);
    const [copiedColumn, setCopiedColumn] = useState<string | null>(null);
    const [showCopySuccess, setShowCopySuccess] = useState(false);

    const tableRef = useRef<HTMLTableElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Get all unique column names from data
    const columns = React.useMemo(() => {
        const allKeys = new Set<string>();
        tableData.forEach(row => {
            Object.keys(row).forEach(key => allKeys.add(key));
        });
        return Array.from(allKeys).filter(key => key !== '_index');
    }, [tableData]);

    // Update local data when prop changes
    useEffect(() => {
        setTableData(data);
    }, [data]);

    // Update title when prop changes
    useEffect(() => {
        setTitleValue(title);
    }, [title]);

    const handleTitleClick = () => {
        setEditingTitle(true);
    };

    const handleTitleSave = () => {
        if (onTitleChange) {
            onTitleChange(titleValue);
        }
        setEditingTitle(false);
    };

    const handleTitleCancel = () => {
        setTitleValue(title);
        setEditingTitle(false);
    };

    const handleTitleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleTitleSave();
        } else if (e.key === 'Escape') {
            handleTitleCancel();
        }
    };

    const handleCellClick = (row: number, col: string) => {
        if (editingCell?.row === row && editingCell?.col === col) return;

        setEditingCell({ row, col });
        setCellValue(tableData[row]?.[col] || '');

        // Focus input after state update
        setTimeout(() => {
            inputRef.current?.focus();
            inputRef.current?.select();
        }, 0);
    };

    const handleCellSave = () => {
        if (editingCell) {
            const newData = [...tableData];
            if (!newData[editingCell.row]) {
                newData[editingCell.row] = {};
            }
            newData[editingCell.row][editingCell.col] = cellValue;

            setTableData(newData);
            if (onDataChange) {
                onDataChange(newData);
            }
        }
        setEditingCell(null);
        setCellValue('');
    };

    const handleCellCancel = () => {
        setEditingCell(null);
        setCellValue('');
    };

    const handleCellKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleCellSave();
        } else if (e.key === 'Escape') {
            handleCellCancel();
        }
    };

    const handleAddRow = () => {
        const newRow: Record<string, any> = {};
        columns.forEach(col => {
            newRow[col] = '';
        });
        const newData = [...tableData, newRow];
        setTableData(newData);
        if (onDataChange) {
            onDataChange(newData);
        }
    };

    const handleDeleteRow = (rowIndex: number) => {
        const newData = tableData.filter((_, index) => index !== rowIndex);
        setTableData(newData);
        if (onDataChange) {
            onDataChange(newData);
        }
    };

    const handleAddColumn = () => {
        const columnName = prompt('Enter column name:');
        if (columnName && columnName.trim()) {
            const newData = tableData.map(row => ({
                ...row,
                [columnName]: ''
            }));
            setTableData(newData);
            if (onDataChange) {
                onDataChange(newData);
            }
        }
    };

    const handleDeleteColumn = (columnName: string) => {
        if (columns.length <= 1) {
            alert('Cannot delete the last column');
            return;
        }

        const newData = tableData.map(row => {
            const { [columnName]: removed, ...rest } = row;
            return rest;
        });
        setTableData(newData);
        if (onDataChange) {
            onDataChange(newData);
        }
    };

    const handleRowSelect = (rowIndex: number, isCtrl: boolean = false) => {
        if (isCtrl) {
            const newSelected = new Set(selectedRows);
            if (newSelected.has(rowIndex)) {
                newSelected.delete(rowIndex);
            } else {
                newSelected.add(rowIndex);
            }
            setSelectedRows(newSelected);
        } else {
            setSelectedRows(new Set([rowIndex]));
        }
    };

    const handleSelectAll = () => {
        if (selectedRows.size === tableData.length) {
            setSelectedRows(new Set());
        } else {
            setSelectedRows(new Set(tableData.map((_, index) => index)));
        }
    };

    const handleCopyColumn = (columnName: string) => {
        const columnData = tableData.map(row => row[columnName] || '').join('\n');
        navigator.clipboard.writeText(columnData).then(() => {
            setCopiedColumn(columnName);
            setShowCopySuccess(true);
            setTimeout(() => {
                setShowCopySuccess(false);
                setCopiedColumn(null);
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy column:', err);
        });
    };

    const isCellSelected = (row: number, col: string) => {
        return selectedRows.has(row);
    };

    const isCellEditing = (row: number, col: string) => {
        return editingCell?.row === row && editingCell?.col === col;
    };

    return (
        <div className={`bg-white border border-gray-300 rounded-lg shadow-sm ${className}`} style={{ margin: 0, padding: 0 }}>
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center space-x-2">
                    {editingTitle ? (
                        <input
                            type="text"
                            value={titleValue}
                            onChange={(e) => setTitleValue(e.target.value)}
                            onBlur={handleTitleSave}
                            onKeyDown={handleTitleKeyPress}
                            className="px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                        />
                    ) : (
                        <h3
                            className="text-lg font-semibold text-gray-800 cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                            onClick={handleTitleClick}
                        >
                            {title}
                        </h3>
                    )}
                    {editingTitle && (
                        <div className="flex space-x-1">
                            <button
                                onClick={handleTitleSave}
                                className="p-1 text-green-600 hover:bg-green-100 rounded"
                            >
                                <Save size={16} />
                            </button>
                            <button
                                onClick={handleTitleCancel}
                                className="p-1 text-red-600 hover:bg-red-100 rounded"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex items-center space-x-1">
                    <button
                        onClick={handleAddRow}
                        className="flex items-center space-x-1 px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs"
                    >
                        <Plus size={14} />
                        <span>Row</span>
                    </button>
                    <button
                        onClick={handleAddColumn}
                        className="flex items-center space-x-1 px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs"
                    >
                        <Plus size={14} />
                        <span>Column</span>
                    </button>
                    {onExport && (
                        <button
                            onClick={onExport}
                            className="flex items-center space-x-1 px-2 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 text-xs"
                        >
                            <Download size={14} />
                            <span>Export</span>
                        </button>
                    )}
                    {onDelete && (
                        <button
                            onClick={onDelete}
                            className="flex items-center space-x-1 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                        >
                            <Trash2 size={14} />
                            <span>Delete</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="overflow-auto max-h-96">
                <table ref={tableRef} className="w-full border-collapse" style={{ border: '1px solid #d0d7de' }}>
                    <thead>
                        <tr className="bg-gray-100" style={{ backgroundColor: '#f6f8fa' }}>
                            <th className="border border-gray-300 p-2 text-left font-semibold" style={{ 
                                border: '1px solid #d0d7de',
                                backgroundColor: '#f6f8fa',
                                fontWeight: 600,
                                fontSize: '12px'
                            }}>
                                <input
                                    type="checkbox"
                                    checked={selectedRows.size === tableData.length && tableData.length > 0}
                                    onChange={handleSelectAll}
                                    className="mr-1"
                                />
                                #
                            </th>
                            {columns.map((col) => (
                                <th key={col} className="border border-gray-300 p-2 text-left group" style={{ 
                                    border: '1px solid #d0d7de',
                                    backgroundColor: '#f6f8fa',
                                    fontWeight: 600,
                                    fontSize: '12px'
                                }}>
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-gray-700" style={{ fontWeight: 600 }}>{col}</span>
                                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100">
                                            <button
                                                onClick={() => handleCopyColumn(col)}
                                                className="text-blue-500 hover:text-blue-700 p-1"
                                                title="Copy column data"
                                            >
                                                {copiedColumn === col && showCopySuccess ? (
                                                    <Check size={14} className="text-green-500" />
                                                ) : (
                                                    <Copy size={14} />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteColumn(col)}
                                                className="text-red-500 hover:text-red-700 p-1"
                                                title="Delete column"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </th>
                            ))}
                            <th className="border border-gray-300 p-2 text-center" style={{ 
                                border: '1px solid #d0d7de',
                                backgroundColor: '#f6f8fa',
                                fontWeight: 600,
                                fontSize: '12px'
                            }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tableData.map((row, rowIndex) => (
                            <tr
                                key={rowIndex}
                                className={`hover:bg-gray-50 ${isCellSelected(rowIndex, '') ? 'bg-blue-50' : ''}`}
                                style={{ backgroundColor: rowIndex % 2 === 0 ? '#ffffff' : '#f8f9fa' }}
                            >
                                <td className="border border-gray-300 p-2" style={{ 
                                    border: '1px solid #d0d7de',
                                    fontSize: '12px'
                                }}>
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedRows.has(rowIndex)}
                                            onChange={() => handleRowSelect(rowIndex)}
                                            className="mr-1"
                                        />
                                        <span className="text-gray-600 text-sm">{rowIndex + 1}</span>
                                    </div>
                                </td>
                                {columns.map((col) => (
                                    <td
                                        key={col}
                                        className={`border border-gray-300 p-2 min-w-24 ${isCellSelected(rowIndex, col) ? 'bg-blue-50' : ''
                                            }`}
                                        style={{ 
                                            border: '1px solid #d0d7de',
                                            fontSize: '12px'
                                        }}
                                        onClick={() => handleCellClick(rowIndex, col)}
                                    >
                                        {isCellEditing(rowIndex, col) ? (
                                            <input
                                                ref={inputRef}
                                                type="text"
                                                value={cellValue}
                                                onChange={(e) => setCellValue(e.target.value)}
                                                onBlur={handleCellSave}
                                                onKeyDown={handleCellKeyPress}
                                                className="w-full px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                autoFocus
                                            />
                                        ) : (
                                            <div className="px-1 py-1 min-h-5 cursor-pointer hover:bg-gray-100 rounded group flex items-center justify-between">
                                                <span className="text-gray-800 text-sm">
                                                    {row[col] || ''}
                                                </span>
                                                <Edit2 size={10} className="opacity-0 group-hover:opacity-100 text-gray-400" />
                                            </div>
                                        )}
                                    </td>
                                ))}
                                <td className="border border-gray-300 p-2 text-center" style={{ 
                                    border: '1px solid #d0d7de',
                                    fontSize: '12px'
                                }}>
                                    <button
                                        onClick={() => handleDeleteRow(rowIndex)}
                                        className="text-red-500 hover:text-red-700 p-1"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="p-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
                {tableData.length} rows × {columns.length} columns
            </div>
        </div>
    );
};

export default ExcelLikeTable;
