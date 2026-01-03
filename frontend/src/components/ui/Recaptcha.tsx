import { useRef, useImperativeHandle, forwardRef } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import type { ReCAPTCHA as ReCAPTCHAType } from 'react-google-recaptcha';
import './Recaptcha.css';

export interface RecaptchaRef {
  reset: () => void;
  getValue: () => string | null;
  execute: () => void;
}

interface RecaptchaProps {
  siteKey: string;
  onChange: (token: string | null) => void;
}

export const Recaptcha = forwardRef<RecaptchaRef, RecaptchaProps>(
  ({ siteKey, onChange }, ref) => {
    const recaptchaRef = useRef<ReCAPTCHAType>(null);

    useImperativeHandle(ref, () => ({
      reset: () => {
        recaptchaRef.current?.reset();
        onChange(null);
      },
      getValue: () => {
        return recaptchaRef.current?.getValue() || null;
      },
      execute: () => {
        recaptchaRef.current?.execute();
      },
    }));

    const handleChange = (token: string | null) => {
      onChange(token);
    };

    const handleExpired = () => {
      onChange(null);
    };

    return (
      <div className="recaptcha-container recaptcha-invisible">
        <ReCAPTCHA
          ref={recaptchaRef}
          sitekey={siteKey}
          onChange={handleChange}
          onExpired={handleExpired}
          size="invisible"
        />
      </div>
    );
  }
);

Recaptcha.displayName = 'Recaptcha';

