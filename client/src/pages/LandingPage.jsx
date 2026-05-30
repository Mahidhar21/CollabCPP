import { Link } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';
import Badge from '../components/ui/Badge.jsx';
import FeatureGrid from '../components/FeatureGrid.jsx';

export default function LandingPage() {
  return (
    <div className="animate-fade-in">
      <section className="relative overflow-hidden border-b border-surface-border">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(255,255,255,0.06),transparent)]" />

        <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="animate-slide-up max-w-2xl">
            <Badge variant="default" className="mb-6">
              Realtime collaboration
            </Badge>

            <h1 className="text-4xl font-semibold tracking-tight text-brand-highlight sm:text-5xl sm:leading-[1.1]">
              Collaborative C++
              <br />
              <span className="text-accent-muted">interviews, done right.</span>
            </h1>

            <p className="mt-6 max-w-lg text-base leading-relaxed text-accent-muted">
              CollabCPP is a realtime MERN platform for structured technical
              interviews — shared editing, execution, and presence in one
              focused workspace.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Link to="/signup">
                <Button size="lg">Get started</Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary" size="lg">
                  Sign in
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-16 hidden lg:block">
            <div className="rounded-xl border border-surface-border bg-surface-raised p-4 shadow-elevated">
              <div className="flex items-center gap-2 border-b border-surface-border pb-3">
                <span className="h-2.5 w-2.5 rounded-full bg-surface-muted" />
                <span className="h-2.5 w-2.5 rounded-full bg-surface-muted" />
                <span className="h-2.5 w-2.5 rounded-full bg-surface-muted" />
                <span className="ml-2 font-mono text-xs text-accent-dim">
                  session.cpp — collaborative
                </span>
              </div>
              <pre className="overflow-x-auto p-4 font-mono text-sm leading-relaxed text-accent-muted">
                <code>{`#include <iostream>
using namespace std;

int main() {
  cout << "CollabCPP ready." << endl;
  return 0;
}`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      
    </div>
  );
}
