import Link from 'next/link';

export const metadata = {
  title: 'Support - OMR Hub',
  description: 'Get help and support for OMR Hub',
};

export default function SupportPage() {
  const supportEmail = 'OMRHub@acesapps.com';
  const supportEmailHref =
    'mailto:OMRHub@acesapps.com?subject=OMR-HUB%20Support';

  const faqs = [
    {
      q: 'How do I get started with OMR‑HUB?',
      a: 'Download OMR‑HUB from the App Store and create an account. Currently, the app is available for one community. Once you're signed in, you can start creating workouts, scheduling events, tracking activities, and managing your training schedule.',
    },
    {
      q: 'What features are available in OMR‑HUB?',
      a: 'OMR‑HUB includes workouts (create, save, and follow workouts with exercise libraries), events (schedule sessions with reminders and attendance tracking), activities (track daily activity logs), schedules (circuit sessions and personal training schedules), exercises (comprehensive library with videos and instructions), workout assignments (coaches can assign workouts to clients), programs (structured training plans with week-by-week workouts - coming soon), challenges (timed challenges with customizable goals - coming soon), and credits (for purchasing services).',
    },
    {
      q: 'How do workouts work?',
      a: 'You can create workouts by selecting exercises from the exercise library, adding sets, reps, and notes. Coaches can create workout templates and assign them to clients. All your completed workouts are saved in your history for easy review.',
    },
    {
      q: 'How do events and schedules work?',
      a: 'Events allow you to schedule training sessions with reminders. You can track attendance for events. Schedules include circuit sessions and personal training sessions that coaches can manage. These help organize your training week in one place.',
    },
    {
      q: 'What is the exercise library?',
      a: 'The exercise library contains exercises with video demonstrations, descriptions, muscle group information, equipment needed, and difficulty levels. Coaches can add custom exercises with their own videos and descriptions.',
    },
    {
      q: 'How do workout assignments work?',
      a: 'Coaches can assign specific workouts to their clients. When assigned, the workout appears in the client's app. This feature helps coaches personalize training programs for each client.',
    },
    {
      q: 'Can I use OMR‑HUB without being in a community?',
      a: 'Currently, OMR‑HUB is available for one community only. In the future, individual users will be able to use the app independently to create their own schedules and workouts without needing to join a coach's community. Stay tuned for updates!',
    },
    {
      q: 'I'm a coach — can I create my own community?',
      a: 'Coach communities are coming soon! Coaches will be able to create separate communities for their clients with full access to manage workouts, events, schedules, programs, challenges, exercise libraries, and workout assignments. Email us to learn more and get notified when this feature launches.',
    },
    {
      q: 'What are programs?',
      a: 'Programs (coming soon) are structured training plans that coaches can create with week-by-week workouts. Clients can follow these programs step-by-step, with workouts assigned for each week of the program. This helps provide a clear training pathway for clients to achieve their goals.',
    },
    {
      q: 'What are challenges?',
      a: 'Challenges (coming soon) come in two types: 1) Long-term challenges (e.g., 8-week, 12-week challenges) with customizable goals like daily step counts, macro targets, and workout requirements where each participant can have personalized goals. 2) Community-led challenges are short-term challenges that coaches set for the whole community, such as "do your fastest 1km" or "run your furthest distance" - quick competitions to engage and motivate the community.',
    },
    {
      q: 'How do I sync my data across devices?',
      a: 'Your data syncs automatically when you sign in with the same account. Make sure you're connected to the internet for changes to upload and download. All your workouts, events, activities, and schedules are stored in the cloud.',
    },
    {
      q: 'What should I do if the app crashes?',
      a: 'Close and reopen the app, then check you're on the latest version and your device OS is up to date. If the issue persists, email support with any details you can share, including what you were doing when it crashed.',
    },
    {
      q: 'How do I delete my account?',
      a: 'Go to your profile, scroll down, and tap "Delete account". This action is permanent and cannot be undone. All your data including workouts, events, activities, and schedules will be deleted.',
    },
    {
      q: 'Is my data secure?',
      a: 'We take security seriously and store data securely. For more details about how we collect, use, and protect your data, see our Privacy Policy.',
      link: { href: '/privacy', label: 'Privacy Policy' },
    },
  ] as const;

  return (
    <div className="page">
      <div className="container narrow">
        <header className="pageHeader">
          <h1>Support</h1>
          <p style={{ marginBottom: 24 }}>
            Need a hand with OMR‑HUB? Email us and we'll get back to you as soon
            as we can.
          </p>
          <div className="heroActions">
            <a href={supportEmailHref} className="button button-primary">
              Email support
            </a>
          </div>
        </header>

        <div className="contentStack">
          <section className="contentSection">
            <h2>Contact</h2>
            <p style={{ marginTop: 8 }}>
              Email:{' '}
              <a href={supportEmailHref} style={{ color: '#007AFF' }}>
                {supportEmail}
              </a>
            </p>
            <p style={{ marginTop: 12, fontSize: 15, lineHeight: '22px' }}>
              If you can, include your device model, iOS version, and what you
              were doing when the issue happened.
            </p>
          </section>

          <section className="contentSection">
            <h2>FAQ</h2>
            <div className="faq" style={{ marginTop: 12 }}>
              {faqs.map((item) => (
                <details key={item.q}>
                  <summary>{item.q}</summary>
                  <p>
                    {item.a}{' '}
                    {'link' in item ? (
                      <Link href={item.link.href}>{item.link.label}</Link>
                    ) : null}
                  </p>
                </details>
              ))}
            </div>
          </section>

          <section className="contentSection">
            <h2>Troubleshooting</h2>
            <div className="prose" style={{ marginTop: 12 }}>
              <section>
                <h3>App won't load or feels slow</h3>
                <ul>
                  <li>Check your internet connection - OMR‑HUB requires internet access to sync data</li>
                  <li>Close and restart the app</li>
                  <li>Update to the latest version from the App Store</li>
                  <li>Restart your device</li>
                  <li>Clear the app cache if issues persist (uninstall and reinstall, your data is saved in the cloud)</li>
                </ul>
              </section>
              <section>
                <h3>Can't sign in</h3>
                <ul>
                  <li>Verify your email and password</li>
                  <li>Try resetting your password through the sign-in screen</li>
                  <li>Check your internet connection</li>
                  <li>Ensure you're using the correct account credentials</li>
                  <li>Contact support if the issue persists</li>
                </ul>
              </section>
              <section>
                <h3>Workouts or events not showing</h3>
                <ul>
                  <li>Check your internet connection - data syncs when online</li>
                  <li>Pull down to refresh the screen</li>
                  <li>If you're a client, ensure your coach has assigned the workout to you</li>
                  <li>If you're a coach, verify you've created and assigned the workout correctly</li>
                </ul>
              </section>
              <section>
                <h3>Exercise videos not loading</h3>
                <ul>
                  <li>Check your internet connection - videos stream from the server</li>
                  <li>Try closing and reopening the exercise detail screen</li>
                  <li>If using mobile data, ensure you have sufficient data allowance</li>
                  <li>Report broken video links to support</li>
                </ul>
              </section>
              <section>
                <h3>Schedule or attendance not updating</h3>
                <ul>
                  <li>Ensure you're connected to the internet</li>
                  <li>Pull down to refresh the schedule view</li>
                  <li>Verify you have the correct permissions (coaches can manage schedules, clients can view)</li>
                  <li>Try signing out and back in to refresh your session</li>
                </ul>
              </section>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
