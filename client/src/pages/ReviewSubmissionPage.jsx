import { useState } from 'react';
import { useParams } from 'react-router-dom';
import request from '../services/api';

function ReviewSubmissionPage() {
  const { token } = useParams();
  const [rating, setRating] = useState('5');
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await request('/reviews/submit', { method: 'POST', body: { token, rating: Number(rating), comment } });
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Unable to submit review');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="auth-shell"><section className="auth-card">
      <div className="auth-header"><div className="brand-mark large">T</div><h1>TripMate</h1><p>Trip review</p></div>
      {submitted ? <div className="alert success">Thank you for sharing your feedback.</div> : (
        <form onSubmit={handleSubmit} className="auth-form">
          <label>Rating<select value={rating} onChange={(event) => setRating(event.target.value)}>{[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} / 5</option>)}</select></label>
          <label>Comment<textarea value={comment} onChange={(event) => setComment(event.target.value)} rows="5" maxLength="2000" /></label>
          {error && <div className="alert error">{error}</div>}
          <button type="submit" className="primary-button" disabled={saving}>{saving ? 'Submitting...' : 'Submit review'}</button>
        </form>
      )}
    </section></div>
  );
}

export default ReviewSubmissionPage;