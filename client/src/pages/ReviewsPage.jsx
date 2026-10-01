import { useEffect, useState } from 'react';
import request from '../services/api';

function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    request('/reviews')
      .then((response) => setReviews(response.data || []))
      .catch((err) => setError(err.message || 'Unable to load reviews'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-shell">
      <section className="card-block">
        <div className="section-heading"><p className="eyebrow">Customer feedback</p><h2>Reviews</h2><p>Feedback submitted for completed trips.</p></div>
        {error && <div className="alert error">{error}</div>}
        {loading ? <div className="empty-card compact"><h3>Loading reviews...</h3></div> : reviews.length === 0 ? (
          <div className="empty-card compact"><h3>No reviews yet</h3><p>Customer feedback will appear here after a review link is used.</p></div>
        ) : (
          <div className="table-wrapper"><table className="data-table">
            <thead><tr><th>Customer</th><th>Trip</th><th>Rating</th><th>Comment</th><th>Date</th></tr></thead>
            <tbody>{reviews.map((review) => <tr key={review._id}>
              <td>{review.customer?.name || 'Customer'}</td>
              <td>{review.trip?.destination || 'Trip'}<br /><small>{review.trip?.travelDate ? new Date(review.trip.travelDate).toLocaleDateString() : ''}</small></td>
              <td>{review.rating} / 5</td>
              <td>{review.comment || '-'}</td>
              <td>{new Date(review.createdAt).toLocaleDateString()}</td>
            </tr>)}</tbody>
          </table></div>
        )}
      </section>
    </div>
  );
}

export default ReviewsPage;