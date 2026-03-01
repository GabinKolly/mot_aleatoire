import { useCallback, useMemo, useState } from 'react';

interface UseClampedInputOptions {
  initialValue: number;
  min: number;
  max: number;
  parse?: (value: string) => number;
}

export function useClampedInput({
  initialValue,
  min,
  max,
  parse = (v: string) => Number(v),
}: UseClampedInputOptions) {
  const normalize = useCallback(
    (value: string | number, fallback: number): number => {
      const parsed = parse(String(value));
      if (Number.isNaN(parsed)) {
        return fallback;
      }

      return Math.min(max, Math.max(min, parsed));
    },
    [max, min, parse]
  );

  const [inputValue, setInputValue] = useState(String(normalize(initialValue, min)));

  const committedValue = useMemo(() => {
    if (inputValue === '') {
      return normalize(initialValue, min);
    }

    return normalize(inputValue, normalize(initialValue, min));
  }, [initialValue, inputValue, min, normalize]);

  const onChange = (value: string): void => {
    setInputValue(value);
  };

  const onBlur = (): number => {
    const next = normalize(inputValue, committedValue);
    setInputValue(String(next));
    return next;
  };

  const setCommittedValue = (value: string | number): void => {
    const next = normalize(value, committedValue);
    setInputValue(String(next));
  };

  return {
    inputValue,
    committedValue,
    onChange,
    onBlur,
    setCommittedValue,
    setInputValue,
  };
}
