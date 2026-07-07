import { useState } from 'react';
import { saveFeedback } from '../utils/feedbackStorage';

export default function FeedbackModal({ isOpen, onClose }) {
  const [interest, setInterest] = useState('');
  const [pilot, setPilot] = useState('');
  const [role, setRole] = useState('');
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!interest) return;

    const entry = {
      interest,
      pilot,
      role,
      comment,
      timestamp: new Date().toISOString()
    };

    saveFeedback(entry);
    setSubmitted(true);
  };

  const handleClose = () => {
    setSubmitted(false);
    setInterest('');
    setPilot('');
    setRole('');
    setComment('');
    onClose();
  };

  return (
    <div className="feedback-modal-overlay" onClick={handleClose}>
      <div className="feedback-modal" onClick={(e) => e.stopPropagation()}>
        {submitted ? (
          <>
            <div className="feedback-modal-icon">✓</div>
            <h2>Thanks for your feedback!</h2>
            <p>Your response helps us decide whether to build BluePainter Studio fully.</p>
            <button type="button" className="feedback-submit-btn" onClick={handleClose}>
              Close
            </button>
          </>
        ) : (
          <>
            <h2>Would you use BluePainter?</h2>
            <p className="feedback-subtitle">
              We're validating this concept. Your honest take matters — this takes 30 seconds.
            </p>

            <form onSubmit={handleSubmit}>
              <fieldset className="feedback-fieldset">
                <legend>How interested are you?</legend>
                <div className="feedback-options">
                  {[
                    { value: 'very', label: "Very — I'd pay for this" },
                    { value: 'somewhat', label: "Somewhat — I'd try it" },
                    { value: 'not', label: 'Not really — not for me' }
                  ].map((opt) => (
                    <label key={opt.value} className={`feedback-option ${interest === opt.value ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="interest"
                        value={opt.value}
                        checked={interest === opt.value}
                        onChange={() => setInterest(opt.value)}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset className="feedback-fieldset">
                <legend>Would you pilot this in your real repo?</legend>
                <div className="feedback-options">
                  {[
                    { value: 'yes', label: 'Yes — I would try it on our codebase' },
                    { value: 'maybe', label: 'Maybe — depends on setup' },
                    { value: 'no', label: 'No — not for our team' }
                  ].map((opt) => (
                    <label key={opt.value} className={`feedback-option ${pilot === opt.value ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="pilot"
                        value={opt.value}
                        checked={pilot === opt.value}
                        onChange={() => setPilot(opt.value)}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className="feedback-label">
                Your role
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="">Select one (optional)</option>
                  <option value="designer">Designer</option>
                  <option value="developer">Developer</option>
                  <option value="founder">Founder / PM</option>
                  <option value="other">Other</option>
                </select>
              </label>

              <label className="feedback-label">
                Anything else? (optional)
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="What would make this a must-have for you?"
                  rows={3}
                />
              </label>

              <div className="feedback-modal-actions">
                <button type="button" className="feedback-cancel-btn" onClick={handleClose}>
                  Skip
                </button>
                <button type="submit" className="feedback-submit-btn" disabled={!interest}>
                  Submit Feedback
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
