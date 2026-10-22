import type { ChangeEvent } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { TextField } from 'components/ui/TextField';
import { describeUnit, maskUnitInput, parseUnit } from '../unit';

interface UnitFieldProps {
  registration: UseFormRegisterReturn<'unit'>;
  value: string;
  error?: string;
}

/** Floor-unit input with a live "FLR 12 · UNIT 03" readout once the value is a real window. */
export function UnitField({ registration, value, error }: UnitFieldProps) {
  const unit = parseUnit(value);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    event.target.value = maskUnitInput(event.target.value);
    return registration.onChange(event);
  };

  return (
    <TextField
      label="Unit no."
      labelAside={
        unit ? (
          <span className="font-mono text-eyebrow uppercase text-lamp">{describeUnit(unit)}</span>
        ) : null
      }
      inputMode="numeric"
      autoComplete="off"
      placeholder="12-03"
      maxLength={5}
      hint="Floor and unit, e.g. 12-03. Or pick your window on the tower."
      error={error}
      {...registration}
      onChange={handleChange}
    />
  );
}
