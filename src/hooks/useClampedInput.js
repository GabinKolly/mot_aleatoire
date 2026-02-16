import { useCallback, useMemo, useState } from 'react';

export function useClampedInput({ initialValue, min, max, parse = Number }) {
  const normalize = useCallback(
    (value, fallback) => {
      const parsed = parse(value);
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

  const onChange = (value) => {
    setInputValue(value);
  };

  const onBlur = () => {
    const next = normalize(inputValue, committedValue);
    setInputValue(String(next));
    return next;
  };

  const setCommittedValue = (value) => {
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
