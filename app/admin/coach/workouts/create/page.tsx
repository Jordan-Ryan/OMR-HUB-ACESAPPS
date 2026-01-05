import Link from 'next/link';
import WorkoutForm from '@/components/admin/WorkoutForm';

export default function CreateWorkoutPage() {
  return (
    <div>
      <Link
        href="/admin/coach/workouts"
        style={{
          color: '#007AFF',
          textDecoration: 'none',
          marginBottom: '24px',
          display: 'inline-block',
          fontSize: '17px',
          fontWeight: '500',
          transition: 'color 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#0051D5';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#007AFF';
        }}
      >
        ← Back to Workouts
      </Link>
      <h1 style={{ marginBottom: '32px', marginTop: 0 }}>Create Workout</h1>
      <WorkoutForm />
    </div>
  );
}




