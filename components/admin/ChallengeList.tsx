interface ChallengeListProps {
  challenges: any[];
}

export default function ChallengeList({ challenges }: ChallengeListProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (challenges.length === 0) {
    return (
      <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
        <p style={{ color: 'rgba(235, 235, 245, 0.6)' }}>No challenges attended</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {challenges.map((submission) => {
        const challenge = submission.challenge;
        return (
          <div key={submission.id} className="card">
            <h3 style={{ marginBottom: '8px', fontSize: '17px' }}>
              {challenge?.title || 'Unknown Challenge'}
            </h3>
            {challenge?.description && (
              <p
                style={{
                  color: 'rgba(235, 235, 245, 0.6)',
                  fontSize: '15px',
                  marginBottom: '8px',
                }}
              >
                {challenge.description}
              </p>
            )}
            <div style={{ fontSize: '15px', color: 'rgba(235, 235, 245, 0.6)' }}>
              <div>Type: {challenge?.challenge_type || 'N/A'}</div>
              {challenge?.start_date && (
                <div>Start: {formatDate(challenge.start_date)}</div>
              )}
              {challenge?.end_date && (
                <div>End: {formatDate(challenge.end_date)}</div>
              )}
              <div>Submitted: {formatDate(submission.submitted_at)}</div>
              {submission.time && <div>Time: {submission.time}s</div>}
              {submission.distance && <div>Distance: {submission.distance}km</div>}
              {submission.weight && <div>Weight: {submission.weight}kg</div>}
              {submission.reps_or_rounds && (
                <div>Reps/Rounds: {submission.reps_or_rounds}</div>
              )}
              {submission.calories && <div>Calories: {submission.calories}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}




