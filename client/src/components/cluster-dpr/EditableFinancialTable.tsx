// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/Input';

interface EditableFinancialTableProps {
  headers: string[];
  rows: any[][];
  title?: string;
  statementNumber?: string;
  onCellChange?: (rowIndex: number, colIndex: number, value: number | string) => void;
  editableCells?: boolean[][]; // 2D array indicating which cells are editable
  calculatedCells?: { row: number; col: number; formula: (data: any[][]) => number }[]; // Cells that are calculated
  data?: any; // Original data for calculations
}

export const EditableFinancialTable: React.FC<EditableFinancialTableProps> = ({
  headers,
  rows: initialRows,
  title,
  statementNumber,
  onCellChange,
  editableCells,
  calculatedCells = [],
  data,
}) => {
  const [rows, setRows] = useState<any[][]>(initialRows || []);
  const [isEditing, setIsEditing] = useState<Record<string, boolean>>({});

  // Update rows when initialRows change and recalculate
  useEffect(() => {
    if (initialRows && initialRows.length > 0) {
      const newRows = initialRows.map(row => [...row]);
      
      // Recalculate calculated cells
      if (calculatedCells.length > 0) {
        calculatedCells.forEach(({ row, col, formula }) => {
          if (row < newRows.length && col < newRows[row].length) {
            const calculatedValue = formula(newRows);
            newRows[row][col] = calculatedValue;
          }
        });
      }
      
      setRows(newRows);
    }
  }, [initialRows, calculatedCells.length]);

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    const newRows = rows.map(row => [...row]);
    newRows[rowIndex][colIndex] = numValue;
    
    // Recalculate calculated cells after the change
    if (calculatedCells.length > 0) {
      calculatedCells.forEach(({ row, col, formula }) => {
        if (row < newRows.length && col < newRows[row].length) {
          const calculatedValue = formula(newRows);
          newRows[row][col] = calculatedValue;
        }
      });
    }
    
    setRows(newRows);
    
    if (onCellChange) {
      onCellChange(rowIndex, colIndex, numValue);
    }
  };

  const isCellEditable = (rowIndex: number, colIndex: number): boolean => {
    if (editableCells) {
      return editableCells[rowIndex]?.[colIndex] || false;
    }
    // Default: first column is labels (not editable), rest are editable
    return colIndex > 0;
  };

  const isCellCalculated = (rowIndex: number, colIndex: number): boolean => {
    return calculatedCells.some(calc => calc.row === rowIndex && calc.col === colIndex);
  };

  const getCellValue = (rowIndex: number, colIndex: number): string => {
    const value = rows[rowIndex]?.[colIndex];
    if (typeof value === 'number') {
      return value.toFixed(2);
    }
    return value?.toString() || '';
  };

  return (
    <div className="my-6">
      {title && (
        <div className="mb-3">
          {statementNumber && (
            <p className="text-xs text-gray-600 mb-1 font-semibold">Statement {statementNumber}</p>
          )}
          <h4 className="text-lg font-bold text-gray-900">{title}</h4>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-800 text-sm" style={{ borderColor: '#1F2937' }}>
          <thead>
            <tr style={{ backgroundColor: '#E5E7EB' }}>
              {headers.map((header, idx) => (
                <th
                  key={idx}
                  className="border border-gray-800 px-3 py-2 text-left font-bold text-xs"
                  style={{
                    backgroundColor: '#E5E7EB',
                    borderColor: '#1F2937',
                    color: '#1F2937'
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                style={{ backgroundColor: rowIdx % 2 === 0 ? '#FFFFFF' : '#F9FAFB' }}
              >
                {row.map((cell, cellIdx) => {
                  const cellKey = `${rowIdx}-${cellIdx}`;
                  const editable = isCellEditable(rowIdx, cellIdx);
                  const calculated = isCellCalculated(rowIdx, cellIdx);
                  
                  return (
                    <td
                      key={cellIdx}
                      className="border border-gray-800 px-3 py-2 text-xs"
                      style={{
                        borderColor: '#1F2937',
                        color: '#1F2937',
                        backgroundColor: calculated ? '#FEF3C7' : 'inherit', // Highlight calculated cells
                      }}
                    >
                      {editable && !calculated ? (
                        <Input
                          type="number"
                          value={getCellValue(rowIdx, cellIdx)}
                          onChange={(e) => handleCellChange(rowIdx, cellIdx, e.target.value)}
                          onBlur={() => setIsEditing(prev => ({ ...prev, [cellKey]: false }))}
                          onFocus={() => setIsEditing(prev => ({ ...prev, [cellKey]: true }))}
                          className="w-full border-0 p-0 text-xs bg-transparent focus:ring-1 focus:ring-blue-500"
                          style={{
                            minWidth: '80px',
                            textAlign: cellIdx === 0 ? 'left' : 'right',
                          }}
                          step="0.01"
                        />
                      ) : (
                        <span style={{ 
                          display: 'block',
                          textAlign: cellIdx === 0 ? 'left' : 'right',
                          fontWeight: calculated ? 'bold' : 'normal'
                        }}>
                          {typeof cell === 'number' ? cell.toFixed(2) : cell}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
