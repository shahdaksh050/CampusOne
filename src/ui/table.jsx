import React from 'react';
export function Table({ children }) { return <table className="min-w-full table-auto">{children}</table>; }
export function TableHeader({ children }) { return <thead>{children}</thead>; }
export function TableBody({ children }) { return <tbody>{children}</tbody>; }
export function TableRow({ children, className = '' }) { return <tr className={className}>{children}</tr>; }
export function TableHead({ children, className = '' }) { return <th className={`p-3 text-left ${className}`}>{children}</th>; }
export function TableCell({ children, className = '' }) { return <td className={`p-3 ${className}`}>{children}</td>; }
