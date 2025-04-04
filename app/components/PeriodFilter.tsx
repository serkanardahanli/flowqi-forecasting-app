"use client";

interface PeriodFilterProps {
  onChange: (value: string) => void;
}

export default function PeriodFilter({ onChange }: PeriodFilterProps) {
  const months = [
    { value: 'm1', label: 'Januari' },
    { value: 'm2', label: 'Februari' },
    { value: 'm3', label: 'Maart' },
    { value: 'm4', label: 'April' },
    { value: 'm5', label: 'Mei' },
    { value: 'm6', label: 'Juni' },
    { value: 'm7', label: 'Juli' },
    { value: 'm8', label: 'Augustus' },
    { value: 'm9', label: 'September' },
    { value: 'm10', label: 'Oktober' },
    { value: 'm11', label: 'November' },
    { value: 'm12', label: 'December' }
  ];

  return (
    <div className="flex gap-2">
      <select 
        className="border rounded px-2 py-1 text-sm bg-white" 
        onChange={(e) => onChange(e.target.value)}
        defaultValue="q1"
      >
        <optgroup label="Kwartalen">
          <option value="q1">Q1 (Jan-Mar)</option>
          <option value="q2">Q2 (Apr-Jun)</option>
          <option value="q3">Q3 (Jul-Sep)</option>
          <option value="q4">Q4 (Okt-Dec)</option>
        </optgroup>
        <optgroup label="Halfjaar">
          <option value="h1">H1 (Jan-Jun)</option>
          <option value="h2">H2 (Jul-Dec)</option>
        </optgroup>
        <optgroup label="Maanden">
          {months.map(month => (
            <option key={month.value} value={month.value}>
              {month.label}
            </option>
          ))}
        </optgroup>
        <optgroup label="Overig">
          <option value="year">Volledig jaar</option>
        </optgroup>
      </select>
    </div>
  );
} 