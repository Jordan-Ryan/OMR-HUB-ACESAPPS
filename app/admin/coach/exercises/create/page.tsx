import Link from 'next/link';
import ExerciseForm from '@/components/admin/ExerciseForm';

export default function CreateExercisePage() {
  return (
    <div>
      <Link
        href="/admin/coach/exercises"
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
        ← Back to Exercises
      </Link>
      <h1 style={{ marginBottom: '32px', marginTop: 0 }}>Create Exercise</h1>
      <ExerciseForm />
    </div>
  );
}




