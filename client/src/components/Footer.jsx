import Logo from './Logo.jsx';

export default function Footer() {
  return (
    <footer className="border-t border-surface-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-12 sm:px-6 lg:px-8 md:flex-row md:items-center md:justify-between">
        <Logo />

        <div className="text-center md:text-left">
          <p className="text-sm text-accent-dim">
            Designed and built by Mahidhar Geddada
          </p>
          <p className="mt-1 font-mono text-xs text-accent-dim">
            MERN • Socket.IO • MongoDB • Express • React • Node.js
          </p>
        </div>

        <p className="font-mono text-xs text-accent-dim">
          © {new Date().getFullYear()} CollabCPP
        </p>
      </div>
    </footer>
  );
}
