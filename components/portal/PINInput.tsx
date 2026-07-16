import { useState, useCallback } from 'react';

interface PINInputProps {
  length?: number;
  onComplete: (pin: string) => void;
  error?: string;
  onClear?: () => void;
}

export function PINInput({ length = 6, onComplete, error, onClear }: PINInputProps) {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(''));
  const [shake, setShake] = useState(false);

  const handleDigit = useCallback(
    (digit: string) => {
      const currentIndex = digits.findIndex((d) => d === '');
      if (currentIndex === -1) return;

      const newDigits = [...digits];
      newDigits[currentIndex] = digit;
      setDigits(newDigits);

      // Check if complete
      if (currentIndex === length - 1) {
        const pin = newDigits.join('');
        onComplete(pin);
      }
    },
    [digits, length, onComplete]
  );

  const handleBackspace = useCallback(() => {
    const lastFilledIndex = digits.map((d, i) => (d !== '' ? i : -1)).filter((i) => i !== -1).pop();
    if (lastFilledIndex === undefined) return;

    const newDigits = [...digits];
    newDigits[lastFilledIndex] = '';
    setDigits(newDigits);
  }, [digits]);

  const handleClear = useCallback(() => {
    setDigits(Array(length).fill(''));
    onClear?.();
  }, [length, onClear]);

  // Trigger shake on error
  if (error && !shake) {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  }

  const displayError = error !== undefined && error !== '';

  return (
    <div className="flex flex-col items-center">
      {/* PIN Dots */}
      <div
        className={`flex gap-4 mb-10 ${shake ? 'animate-shake' : ''}`}
      >
        {digits.map((digit, index) => (
          <div
            key={index}
            className={`w-5 h-5 rounded-full transition-all duration-200 ${
              digit ? 'bg-primary shadow-sm' : 'bg-border'
            }`}
          />
        ))}
      </div>

      {/* Error message */}
      {displayError && (
        <p className="text-red-600 text-sm mb-4 font-medium">{error}</p>
      )}

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => handleDigit(String(num))}
            className="w-18 h-18 rounded-2xl bg-surface border border-border hover:bg-cream text-lg font-semibold text-text-primary transition-all touch-target active:scale-95"
          >
            {num}
          </button>
        ))}
        <button
          type="button"
          onClick={handleClear}
          className="w-18 h-18 rounded-2xl bg-surface border border-border hover:bg-cream text-sm font-medium text-text-muted transition-all touch-target active:scale-95"
        >
          Hapus
        </button>
        <button
          type="button"
          onClick={() => handleDigit('0')}
          className="w-18 h-18 rounded-2xl bg-surface border border-border hover:bg-cream text-lg font-semibold text-text-primary transition-all touch-target active:scale-95"
        >
          0
        </button>
        <button
          type="button"
          onClick={handleBackspace}
          className="w-18 h-18 rounded-2xl bg-surface border border-border hover:bg-cream text-lg font-medium text-text-muted transition-all touch-target active:scale-95"
        >
          ←
        </button>
      </div>
    </div>
  );
}
