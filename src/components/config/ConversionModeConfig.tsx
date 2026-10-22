import React from 'react';
import { ConversionMode } from '../../models';
import './ConversionModeConfig.css';

interface ConversionModeConfigProps {
  value: ConversionMode;
  onChange: (mode: ConversionMode) => void;
}

interface ModeOption {
  mode: ConversionMode;
  name: string;
  description: string;
  bestFor: string;
}

export const CONVERSION_MODE_OPTIONS: ModeOption[] = [
  {
    mode: 'semantic',
    name: 'Rebuild with a theme',
    description:
      'Reads headings, paragraphs, lists and tables, splits them into slides and lays them out with the theme you pick below.',
    bestFor: 'Plain documents: articles, notes, reports.'
  },
  {
    mode: 'layout',
    name: 'Keep the HTML design',
    description:
      'Renders the HTML and rebuilds every slide with native shapes and editable text at the same positions, colours and fonts.',
    bestFor: 'Designed slide decks (one element per slide, custom CSS).'
  }
];

export const formatConversionMode = (mode: ConversionMode | undefined): string =>
  CONVERSION_MODE_OPTIONS.find((o) => o.mode === (mode ?? 'semantic'))?.name ?? String(mode);

/**
 * Conversion Mode Configuration
 *
 * Lets the user choose between the semantic converter (re-theme from the
 * document structure) and the layout converter (keep the rendered design).
 * Native radio inputs keep it keyboard and screen-reader accessible.
 */
const ConversionModeConfig: React.FC<ConversionModeConfigProps> = ({ value, onChange }) => (
  <fieldset className="conversion-mode-config">
    <legend id="conversion-mode-heading">Conversion Mode</legend>
    <p className="config-description">How should the HTML become slides?</p>
    <div className="conversion-mode-options">
      {CONVERSION_MODE_OPTIONS.map((option) => {
        const id = `conversion-mode-${option.mode}`;
        const selected = value === option.mode;
        return (
          <label key={option.mode} htmlFor={id} className={`conversion-mode-option${selected ? ' selected' : ''}`}>
            <input
              id={id}
              type="radio"
              name="conversion-mode"
              value={option.mode}
              checked={selected}
              onChange={() => onChange(option.mode)}
              aria-describedby={`${id}-desc`}
            />
            <span className="conversion-mode-text">
              <span className="conversion-mode-name">{option.name}</span>
              <span id={`${id}-desc`} className="conversion-mode-description">
                {option.description} <em>Best for: {option.bestFor}</em>
              </span>
            </span>
          </label>
        );
      })}
    </div>
  </fieldset>
);

export default ConversionModeConfig;
