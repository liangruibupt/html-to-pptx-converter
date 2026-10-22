import { describe, it, expect, afterEach } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { appReducer, initialState } from '../../src/store/reducer';
import { useAppState } from '../../src/store/hooks';

// The hooks used to dispatch action types from a local stub that the reducer
// did not know, so Preview / Start Conversion / completion never changed the
// phase. These tests drive the real store through the hooks.
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root | null = null;

const setup = () => {
  const store = configureStore({
    reducer: appReducer as any,
    preloadedState: initialState as any,
    middleware: (gdm) => gdm({ serializableCheck: false })
  });
  const ref: { current: ReturnType<typeof useAppState> | null } = { current: null };
  const Probe = () => {
    ref.current = useAppState();
    return null;
  };
  root = createRoot(document.createElement('div'));
  act(() => root!.render(<Provider store={store}><Probe /></Provider>));
  return { store, hooks: () => ref.current! };
};

afterEach(() => {
  act(() => root?.unmount());
  root = null;
});

describe('store hooks drive the reducer', () => {
  it('walks upload -> configure -> preview -> converting -> completed', () => {
    const { store, hooks } = setup();
    act(() => hooks().upload.setContent('<h1>Hi</h1>', 'direct'));
    expect(store.getState().ui.currentPhase).toBe('configure');

    act(() => hooks().transitions.proceedToNext());
    expect(store.getState().ui.currentPhase).toBe('preview');

    act(() => hooks().preview.previewSuccess({ html: '<h1>Hi</h1>' }, []));
    expect(store.getState().ui.canProceed).toBe(true);

    act(() => hooks().globalActions.startConversionWorkflow('job-1'));
    expect(store.getState().ui.currentPhase).toBe('converting');
    expect(store.getState().conversion.jobId).toBe('job-1');

    act(() => hooks().conversion.updateProgress(50, 'creating_slides', 'Half way', 2));
    expect(store.getState().conversion.progress).toBe(50);

    act(() => hooks().globalActions.completeConversionWorkflow({ blob: new Blob(['x']) }, { filename: 'a.pptx' }));
    expect(store.getState().ui.currentPhase).toBe('completed');
    expect(store.getState().download.isAvailable).toBe(true);
  });

  it('stores the conversion mode and shows a failed conversion as an error', () => {
    const { store, hooks } = setup();
    act(() => hooks().configuration.updateConfig({ conversionMode: 'layout' }));
    expect(store.getState().configuration.config.conversionMode).toBe('layout');

    act(() => hooks().globalActions.failConversionWorkflow({ message: 'boom' } as any));
    expect(store.getState().ui.currentPhase).toBe('error');
    expect(store.getState().ui.globalError).toBe('boom');
  });
});
