import { describe, it, expect, vi, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import ConversionModeConfig, { formatConversionMode } from '../../src/components/config/ConversionModeConfig';

// Uses react-dom directly: @testing-library/react is not a dependency of this repo.
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root | null = null;
let host: HTMLDivElement | null = null;

const mount = (el: React.ReactElement) => {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() => root!.render(el));
  return host;
};

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
});

describe('ConversionModeConfig', () => {
  it('renders both modes as labelled radios with the current value checked', () => {
    const el = mount(<ConversionModeConfig value="semantic" onChange={vi.fn()} />);
    const semantic = el.querySelector<HTMLInputElement>('#conversion-mode-semantic')!;
    const layout = el.querySelector<HTMLInputElement>('#conversion-mode-layout')!;
    expect(semantic.type).toBe('radio');
    expect(semantic.checked).toBe(true);
    expect(layout.checked).toBe(false);
    expect(el.querySelector('label[for="conversion-mode-layout"]')!.textContent).toContain('Keep the HTML design');
    expect(el.querySelector('fieldset legend')!.textContent).toBe('Conversion Mode');
    expect(layout.getAttribute('aria-describedby')).toBe('conversion-mode-layout-desc');
  });

  it('reports the chosen mode', () => {
    const onChange = vi.fn();
    const el = mount(<ConversionModeConfig value="semantic" onChange={onChange} />);
    act(() => el.querySelector<HTMLInputElement>('#conversion-mode-layout')!.click());
    expect(onChange).toHaveBeenCalledWith('layout');
  });

  it('formats mode names, defaulting to semantic', () => {
    expect(formatConversionMode('layout')).toBe('Keep the HTML design');
    expect(formatConversionMode(undefined)).toBe('Rebuild with a theme');
  });
});
