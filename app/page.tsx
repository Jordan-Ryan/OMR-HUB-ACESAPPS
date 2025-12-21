export default function HomePage() {
  const appStoreUrl = 'https://apps.apple.com/gb/app/omr-hub/id6755069825';
  const coachEmailUrl =
    'mailto:OMRHub@acesapps.com?subject=OMR-HUB%20Coach%20Community%20Access';

  const features = [
    {
      title: 'Workouts',
      description:
        'Create, save, and follow workouts with exercise libraries, videos, and a clear history of what you\'ve completed.',
    },
    {
      title: 'Events',
      description:
        'Keep your training schedule organised with sessions, reminders, and attendance tracking all in one place.',
    },
    {
      title: 'Activities',
      description:
        'Track your daily activity and stay consistent with a simple, reliable log of your fitness journey.',
    },
    {
      title: 'Schedules',
      description:
        'Manage circuit sessions and personal training schedules. Coaches can assign workouts and track client progress.',
    },
    {
      title: 'Exercises',
      description:
        'Access a comprehensive exercise library with video demonstrations, muscle group information, and detailed instructions.',
    },
    {
      title: 'Workout Assignments',
      description:
        'Coaches can assign personalized workouts to clients, ensuring everyone stays on track with their training goals.',
      badge: 'Coach feature',
    },
    {
      title: 'Coach Communities',
      description:
        'Coaches can create separate communities for their clients with full access to manage workouts, events, and schedules.',
      badge: 'Coming soon',
    },
    {
      title: 'Personal Training Space',
      description:
        'Use OMR-HUB independently to create your own schedules and workouts, perfect for solo training without a coach.',
      badge: 'Coming soon',
    },
    {
      title: 'Programs',
      description:
        'Coaches can create structured programs with workouts and week-by-week training plans. Clients can follow these programs step-by-step to achieve their goals.',
      badge: 'Coming soon',
    },
    {
      title: 'Challenges',
      description:
        'Two types of challenges: long-term challenges (8-week, 12-week, etc.) with customizable goals like step counts and macros, and short-term community challenges like "fastest 1km" or "furthest distance" that coaches can set for the whole community.',
      badge: 'Coming soon',
    },
  ] as const;

  return (
    <div className="marketingPage">
      <section className="hero">
        <div className="container heroGrid">
          <div>
            <span className="kicker">
              <span className="kickerDot" />
              Built for coaches & athletes
            </span>

            <h1 className="heroTitle">
              Take your training to the next level
            </h1>

            <p className="heroLead">
              OMR‑HUB is your home for fitness: create workouts, schedule events, track activities, and manage your training with clarity and consistency. Currently available for one community, with coach-led communities and individual training spaces coming soon.
            </p>

            <div className="heroActions">
              <a
                href={appStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="button button-primary"
              >
                Download on the App Store
              </a>
              <a href={coachEmailUrl} className="button button-secondary">
                Coaches: learn about communities
              </a>
            </div>

            <p className="heroNote">
              Originally built for one coach. Soon expanding so coaches can create their own communities, and individual users can train independently.
            </p>
          </div>
        </div>
      </section>

      <section id="coaches" className="section">
        <div className="container">
          <h2 className="sectionTitle">Two ways to use OMR‑HUB</h2>
          <p className="sectionLead">
            Whether you're coaching a group or training for yourself, OMR‑HUB keeps your training week simple, clear, and consistent.
          </p>

          <div className="twoUp">
            <div>
              <div className="cardHeaderRow">
                <h3>Coach Communities</h3>
                <span className="pill pillAccent">Coming soon</span>
              </div>
              <p>
                Create a dedicated community for your clients with all the tools you need to manage workouts, events, schedules, programs, challenges, and assignments — completely separate from other coaches.
              </p>
              <ul className="pointList">
                <li>Separate community spaces per coach</li>
                <li>Full control over workouts, events, and schedules</li>
                <li>Create programs with week-by-week training plans</li>
                <li>Set up long-term challenges with customizable goals and quick community-led challenges</li>
                <li>Assign workouts and track client progress</li>
                <li>Manage exercise libraries with video demonstrations</li>
              </ul>
            </div>

            <div>
              <div className="cardHeaderRow">
                <h3>Personal Training Space</h3>
                <span className="pill pillAccent">Coming soon</span>
              </div>
              <p>
                Use OMR‑HUB independently to create your own schedules and workouts, perfect for solo training without needing to join a coach's community.
              </p>
              <ul className="pointList">
                <li>Create and manage your own workouts</li>
                <li>Build personalized training schedules</li>
                <li>Track activities and review workout history</li>
                <li>Access exercise library for inspiration</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="section">
        <div className="container">
          <h2 className="sectionTitle">What's inside</h2>
          <p className="sectionLead">
            Built around the essentials for coaches and athletes. All the tools you need to manage training, schedules, and progress.
          </p>

          <div className="featureGrid">
            {features.slice(0, 6).map((feature) => (
              <div key={feature.title} className="featureItem">
                {('badge' in feature) && (
                  <span className="kicker" style={{ marginBottom: 8 }}>
                    <span className="kickerDot" />
                    {feature.badge}
                  </span>
                )}
                <h3 style={{ marginBottom: 8 }}>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 48, textAlign: 'center' }}>
            <a href="/features" className="button button-secondary">
              View all features
            </a>
          </div>

          <div className="callout" style={{ marginTop: 48 }}>
            <div className="calloutInner">
              <div className="cardHeaderRow">
                <h3>Coaches: want your own community?</h3>
                <span className="pill pillAccent">Coming soon</span>
              </div>
              <p style={{ marginBottom: 16 }}>
                We're opening up coach communities soon. Create a dedicated space for your clients with full access to all the tools you need to manage workouts, events, schedules, and more.
              </p>
              <div className="heroActions">
                <a href={coachEmailUrl} className="button button-primary">
                  Get in touch
                </a>
                <a
                  href={appStoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="button button-secondary"
                >
                  Download the app
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
