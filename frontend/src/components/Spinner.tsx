interface SpinnerProps {
  label?: string;
  size?: 'sm' | 'md';
}

export function Spinner({ label = 'Loading...', size = 'md' }: SpinnerProps) {
  return (
    <div className="spinner-wrap">
      <span className={size === 'sm' ? 'spinner spinner-sm' : 'spinner'} aria-hidden="true" />
      {label && <span>{label}</span>}
    </div>
  );
}
