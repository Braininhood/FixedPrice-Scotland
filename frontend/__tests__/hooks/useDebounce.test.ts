/**
 * Tests for useDebounce hook
 */
import { renderHook, waitFor } from '@testing-library/react';
import { useDebounce } from '@/hooks/useDebounce';

describe('useDebounce Hook', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('test', 500));
    expect(result.current).toBe('test');
  });

  it('debounces value changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'initial', delay: 500 },
      }
    );

    expect(result.current).toBe('initial');

    rerender({ value: 'updated', delay: 500 });
    expect(result.current).toBe('initial'); // Still initial

    jest.advanceTimersByTime(500);
    await waitFor(() => {
      expect(result.current).toBe('updated');
    });
  });

  it('cancels previous timeout on rapid changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'first', delay: 500 },
      }
    );

    rerender({ value: 'second', delay: 500 });
    jest.advanceTimersByTime(300);
    rerender({ value: 'third', delay: 500 });
    jest.advanceTimersByTime(500);

    await waitFor(() => {
      expect(result.current).toBe('third');
    });
  });
});
