import { Link } from 'react-router-dom';
import Logo from '../Logo.jsx';
import Card from '../ui/Card.jsx';

export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-md animate-slide-up">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        <Card className="shadow-elevated">
          <div className="mb-8 text-center">
            <h1 className="text-xl font-semibold tracking-tight text-brand-highlight">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 text-sm text-accent-muted">{subtitle}</p>
            )}
          </div>

          {children}
        </Card>

        {footer && (
          <p className="mt-6 text-center text-sm text-accent-muted">{footer}</p>
        )}
      </div>
    </div>
  );
}

export function AuthFooterLink({ text, linkText, to }) {
  return (
    <>
      {text}{' '}
      <Link
        to={to}
        className="font-medium text-brand-highlight transition-colors hover:text-white"
      >
        {linkText}
      </Link>
    </>
  );
}
