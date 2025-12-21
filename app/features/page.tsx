export const metadata = {
  title: 'Features - OMR Hub',
  description: 'Discover all the features OMR-HUB has to offer for coaches and athletes',
};

export default function FeaturesPage() {
  const features = [
    {
      title: 'Workouts',
      description:
        'Create, save, and follow workouts with exercise libraries, videos, and a clear history of what you\'ve completed.',
      details: [
        'Build workouts from our comprehensive exercise library',
        'Add sets, reps, and personal notes to each exercise',
        'Save workout templates for easy reuse',
        'Track your workout history and progress over time',
        'View video demonstrations for each exercise',
      ],
    },
    {
      title: 'Events',
      description:
        'Keep your training schedule organised with sessions, reminders, and attendance tracking all in one place.',
      details: [
        'Schedule training sessions with dates and times',
        'Set reminders so you never miss a session',
        'Track attendance for group sessions',
        'View upcoming events in your weekly schedule',
        'Coaches can manage events for their community',
      ],
    },
    {
      title: 'Activities',
      description:
        'Track your daily activity and stay consistent with a simple, reliable log of your fitness journey.',
      details: [
        'Log daily activities like steps, runs, or workouts',
        'View your activity history at a glance',
        'Track consistency and progress over time',
        'Set personal activity goals',
      ],
    },
    {
      title: 'Schedules',
      description:
        'Manage circuit sessions and personal training schedules. Coaches can assign workouts and track client progress.',
      details: [
        'Organize circuit training sessions',
        'Plan personal training schedules',
        'Coaches can create and manage schedules for clients',
        'View your weekly schedule in one place',
        'Track completion and attendance',
      ],
    },
    {
      title: 'Exercises',
      description:
        'Access a comprehensive exercise library with video demonstrations, muscle group information, and detailed instructions.',
      details: [
        'Browse exercises by muscle group, equipment, or difficulty',
        'Watch video demonstrations for proper form',
        'Read detailed instructions and tips',
        'Coaches can add custom exercises with their own videos',
        'Save favorite exercises for quick access',
      ],
    },
    {
      title: 'Workout Assignments',
      badge: 'Coach feature',
      description:
        'Coaches can assign personalized workouts to clients, ensuring everyone stays on track with their training goals.',
      details: [
        'Assign specific workouts to individual clients or groups',
        'Set due dates and completion requirements',
        'Track which clients have completed their assignments',
        'Personalize training programs for each client',
        'View assignment history and progress',
      ],
    },
    {
      title: 'Programs',
      badge: 'Coming soon',
      description:
        'Coaches can create structured programs with workouts and week-by-week training plans. Clients can follow these programs step-by-step to achieve their goals.',
      details: [
        'Build multi-week training programs',
        'Assign workouts for each week of the program',
        'Set program duration and milestones',
        'Clients can follow programs at their own pace',
        'Track progress through the program timeline',
      ],
    },
    {
      title: 'Challenges',
      badge: 'Coming soon',
      description:
        'Two types of challenges: long-term challenges (8-week, 12-week, etc.) with customizable goals like step counts and macros, and short-term community challenges like "fastest 1km" or "furthest distance" that coaches can set for the whole community.',
      details: [
        'Long-term challenges with personalized goals for each participant',
        'Track progress on step counts, macros, and workout requirements',
        'Short-term community challenges for quick competitions',
        'Set challenge start dates and durations',
        'View leaderboards and participant progress',
      ],
    },
    {
      title: 'Coach Communities',
      badge: 'Coming soon',
      description:
        'Coaches can create separate communities for their clients with full access to manage workouts, events, schedules, and assignments.',
      details: [
        'Create dedicated spaces for your clients',
        'Full control over all community content and settings',
        'Manage workouts, events, schedules, and assignments',
        'Separate from other coaches\' communities',
        'Track client engagement and progress',
      ],
    },
  ] as const;

  return (
    <div className="page">
      <div className="container">
        <header className="pageHeader">
          <h1>Features</h1>
          <p>
            Everything you need to manage your training and coaching. Built for coaches and athletes who want clarity, consistency, and results.
          </p>
        </header>

        <div className="featuresList">
          {features.map((feature, index) => (
            <div key={feature.title} className="featureDetail">
              <div className="featureDetailHeader">
                <div>
                  {feature.badge && (
                    <span className="badge badgeAccent" style={{ marginBottom: 12, display: 'inline-block' }}>
                      {feature.badge}
                    </span>
                  )}
                  <h2>{feature.title}</h2>
                  <p className="featureDetailDescription">{feature.description}</p>
                </div>
              </div>
              
              <ul className="featureDetailsList">
                {feature.details.map((detail, detailIndex) => (
                  <li key={detailIndex}>{detail}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


