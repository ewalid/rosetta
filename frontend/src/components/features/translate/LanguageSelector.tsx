import { Dropdown } from '../../ui';
import { languages } from '../../../lib/languages';

interface LanguageSelectorProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  includeAutoDetect?: boolean;
  disabled?: boolean;
  className?: string;
}

export function LanguageSelector({
  value,
  onChange,
  label,
  includeAutoDetect = false,
  disabled = false,
  className,
}: LanguageSelectorProps) {
  const options = [
    ...(includeAutoDetect
      ? [{ value: '', label: 'Auto-detect', icon: <span>🔍</span> }]
      : []),
    ...languages.map((lang) => ({
      value: lang.code,
      label: lang.name,
      icon: <span>{lang.flag}</span>,
    })),
  ];

  return (
    <Dropdown
      options={options}
      value={value}
      onChange={onChange}
      label={label}
      placeholder={includeAutoDetect ? 'Auto-detect' : 'Select language'}
      disabled={disabled}
      className={className}
    />
  );
}
