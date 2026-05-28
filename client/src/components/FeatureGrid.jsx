import Card from './ui/Card.jsx';

const features = [
  {
    title: 'Shared editor',
    description:
      'Monaco-powered C++ workspace with cursor presence and live sync.',
    status: 'Live',
  },
  {
    title: 'Sandbox execution',
    description:
      'Isolated compile-and-run with stdout, stderr, and exit codes.',
    status: 'Live',
  },
  {
    title: 'Interview rooms',
    description:
      'Create and join shareable rooms with human-readable IDs like cpp-7F3K2A.',
    status: 'Live',
  },
  {
    title: 'Realtime presence',
    description:
      'Socket.IO room channels with live participant join and leave updates.',
    status: 'Live',
  },
  {
    title: 'Secure auth',
    description:
      'JWT-based signup, login, and protected routes for interview participants.',
    status: 'Live',
  },
];

export default function FeatureGrid() {
  return (
    <section id="features" className="scroll-mt-20">
      <div className="mb-10">
        <h2 className="text-2xl font-semibold tracking-tight text-brand-highlight">
          Built for technical interviews
        </h2>
        <p className="mt-2 max-w-xl text-sm text-accent-muted">
          A focused developer tool for reliable collaborative interviewing.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {features.map((feature) => (
          <Card key={feature.title} hover>
            <div className="flex items-start justify-between gap-4">
              <h3 className="font-medium text-brand-highlight">{feature.title}</h3>
              <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-accent-dim">
                {feature.status}
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-accent-muted">
              {feature.description}
            </p>
          </Card>
        ))}
      </div>
    </section>
  );
}
