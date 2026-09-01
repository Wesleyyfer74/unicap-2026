export const TRANSPORT_SHIFTS = [
  { value: 'UNIGRAN_MATUTINO_INTEGRAL', label: 'UNIGRAN MATUTINO/INTEGRAL' },
  { value: 'UFGD_MATUTINO_INTEGRAL', label: 'UFGD MATUTINO/INTEGRAL' },
  { value: 'UFGD_TRANSLADO_MATUTINO_11H', label: 'UFGD TRANSLADO MATUTINO (11h)' },
  { value: 'UNIGRAN_NOTURNO', label: 'UNIGRAN NOTURNO' },
  { value: 'IFMS_MATUTINO', label: 'IFMS MATUTINO' },
  { value: 'UFGD_NOTURNO', label: 'UFGD NOTURNO' },
];

export const TRANSPORT_SHIFT_LABELS = {
  MATUTINO: 'Matutino (registro antigo)',
  INTEGRAL: 'Integral (registro antigo)',
  NOTURNO: 'Noturno (registro antigo)',
  ...Object.fromEntries(TRANSPORT_SHIFTS.map(({ value, label }) => [value, label])),
};
