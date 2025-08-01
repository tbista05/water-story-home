import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react'; // Added useState, useEffect, useRef for better slider control

interface TimelineProps {
  availableDates: string[]; // e.g., ['2018-05', '2018-06', ...]
  selectedYearMonth: string; // e.g., '2020-07'
  onYearMonthChange: (yearMonth: string) => void;
}

const Timeline: React.FC<TimelineProps> = ({ availableDates, selectedYearMonth, onYearMonthChange }) => {
  const [sliderValue, setSliderValue] = useState(0); // State to control the slider input's value
  const sliderRef = useRef<HTMLInputElement>(null);

  // Memoize the index of the selected date for the slider's value
  const selectedIndex = useMemo(() => {
    return availableDates.indexOf(selectedYearMonth);
  }, [availableDates, selectedYearMonth]);

  // Update slider value when selectedYearMonth changes externally (e.g., initial load)
  useEffect(() => {
    if (selectedIndex !== -1 && sliderValue !== selectedIndex) {
      setSliderValue(selectedIndex);
    }
  }, [selectedIndex, sliderValue]);


  // Helper to format month for display (e.g., '2020-07' -> 'Jul 2020')
  const formatMonthForDisplay = useCallback((yearMonth: string) => {
    if (!yearMonth) return ''; // Handle case where yearMonth might be empty initially
    const [year, month] = yearMonth.split('-');
    // Use new Date(year, month - 1) for safe parsing
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
  }, []);

  // Handler for slider change
  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newIndex = parseInt(e.target.value, 10);
    setSliderValue(newIndex); // Update internal slider state
    // Only call onYearMonthChange if the index is valid
    if (availableDates[newIndex]) {
      onYearMonthChange(availableDates[newIndex]);
    }
  }, [availableDates, onYearMonthChange]);


  // --- NEW LOGIC FOR YEAR LABELS ---

  // 1. Extract unique years from availableDates
  const uniqueYears = useMemo(() => {
    const years = new Set<string>();
    availableDates.forEach(date => {
      if (date && date.length >= 4) { // Ensure date string is valid before substring
        years.add(date.substring(0, 4)); // Extract year (e.g., "2018")
      }
    });
    return Array.from(years).sort(); // Sort them numerically
  }, [availableDates]);

  // 2. Calculate the position for each year label
  const getYearLabelPosition = useCallback((year: string) => {
    // Find the index of the first month of this year in the availableDates array
    // We look for 'YYYY-01', 'YYYY-02', etc., until we find an existing month for that year
    const firstMonthOfYearIndex = availableDates.findIndex(date => date.startsWith(year));

    if (firstMonthOfYearIndex === -1) {
      return -1; // Year not found in available dates
    }

    // Calculate percentage position along the slider track
    // (index / (total_items - 1)) * 100
    // Handle case of single available date to avoid division by zero
    const maxRange = availableDates.length > 1 ? availableDates.length - 1 : 1;
    return (firstMonthOfYearIndex / maxRange) * 100;

  }, [availableDates]);


  return (
    <div className="mt-4 glass-card rounded-xl p-4"> {/* Adjusted mt-6 to mt-4 for consistency */}
      <div className="flex justify-between items-center mb-4"> {/* Adjusted mb-3 to mb-4 */}
        <h4 className="text-sm font-semibold text-gray-900">Temporal Navigation</h4> {/* Changed 'Timeline Slider' to 'Temporal Navigation' */}
        {/* Display the currently selected month/year here */}
        <span className="text-sm text-gray-700 font-medium">{formatMonthForDisplay(selectedYearMonth)}</span> {/* Changed text-gray-500 to text-gray-700 font-medium */}
      </div>
      <div className="relative pt-2 pb-6"> {/* Added pb-6 to create space for year labels */}
        {/* Actual slider input */}
        <input
          type="range"
          min="0"
          max={availableDates.length > 0 ? availableDates.length - 1 : 0} // Ensure max is 0 if no dates
          value={sliderValue} // Control with internal state
          onChange={handleSliderChange} // Use the new handler
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer range-lg focus:outline-none focus:ring-2 focus:ring-blue-500 thumb-blue"
          ref={sliderRef}
          style={{
            // Apply a background gradient to the active part of the slider
            // Ensure availableDates.length - 1 is not zero for calculation
            background: `linear-gradient(to right, #2563eb 0%, #2563eb ${
              availableDates.length > 1
                ? (selectedIndex / (availableDates.length - 1)) * 100
                : selectedIndex === 0 && availableDates.length === 1 ? 100 : 0
            }%, #e2e8f0 ${
              availableDates.length > 1
                ? (selectedIndex / (availableDates.length - 1)) * 100
                : selectedIndex === 0 && availableDates.length === 1 ? 100 : 0
            }%, #e2e8f0 100%)`,
          }}
        />
        {/* Visual labels for YEARS */}
        <div className="absolute top-full left-0 right-0 flex justify-between mt-2 px-1">
          {uniqueYears.map(year => {
            const position = getYearLabelPosition(year);
            // Only render if a valid position is found
            if (position === -1) return null;

            return (
              <span
                key={year}
                className="absolute text-xs text-gray-500 -translate-x-1/2" // -translate-x-1/2 centers the label
                style={{ left: `${position}%` }}
              >
                {year}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Timeline;