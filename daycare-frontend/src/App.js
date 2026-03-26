import React, { useState, useEffect } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const AVAILABLE_DATES = {
  fridays: [
    '2026-03-20',
    '2026-04-10',
    '2026-05-01',
    '2026-05-29',
    '2026-06-12',
    '2026-07-10',
    '2026-07-24',
    '2026-08-07',
    '2026-08-28',
    '2026-09-11',
  ],
  saturdays: [
    '2026-03-28',
    '2026-04-18',
    '2026-05-02',
    '2026-06-06',
    '2026-07-18',
    '2026-08-15',
    '2026-09-12',
    '2026-10-10',
    '2026-11-07',
    '2026-12-12',
  ],
};

const FORMATTED_DATES = {
  '2026-03-20': 'March 20th',
  '2026-03-28': 'March 28th',
  '2026-04-10': 'April 10th',
  '2026-04-18': 'April 18th',
  '2026-05-01': 'May 1st',
  '2026-05-02': 'May 2nd',
  '2026-05-29': 'May 29th',
  '2026-06-06': 'June 6th',
  '2026-06-12': 'June 12th',
  '2026-07-10': 'July 10th',
  '2026-07-18': 'July 18th',
  '2026-07-24': 'July 24th',
  '2026-08-07': 'August 7th',
  '2026-08-15': 'August 15th',
  '2026-08-28': 'August 28th',
  '2026-09-11': 'September 11th',
  '2026-09-12': 'September 12th',
  '2026-10-10': 'October 10th',
  '2026-11-07': 'November 7th',
  '2026-12-12': 'December 12th',
};

export default function DaycarePNO() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    date: '',
    numKids: 1,
    phone: '',
  });

  const [availability, setAvailability] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Fetch availability for all dates on mount
  useEffect(() => {
    fetchAllAvailability();
  }, []);

  const fetchAllAvailability = async () => {
    setLoading(true);
    const allDates = [...AVAILABLE_DATES.fridays, ...AVAILABLE_DATES.saturdays];

    try {
      const results = {};
      await Promise.all(
        allDates.map(async (date) => {
          const res = await fetch(`${API_BASE_URL}/api/spots/${date}`);
          if (res.ok) {
            results[date] = await res.json();
          }
        })
      );
      setAvailability(results);
    } catch (error) {
      console.error('Error fetching availability:', error);
      setMessage({ type: 'error', text: 'Failed to load availability' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'numKids' ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch(`${API_BASE_URL}/api/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({
          type: 'success',
          text: `✨ Booked! ${data.message} You have ${data.spotsLeftAfter} spot(s) left on ${FORMATTED_DATES[formData.date]}.`,
        });
        setFormData({ name: '', email: '', date: '', numKids: 1, phone: '' });
        // Refresh availability
        await fetchAllAvailability();
      } else {
        setMessage({ type: 'error', text: `❌ ${data.error}` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to submit reservation' });
      console.error('Error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getDateColor = (date) => {
    if (!availability[date]) return '#ddd';
    return availability[date].isFull ? '#ff6b9d' : '#a8e6cf'; // Pink if full, green if available
  };

  const getSpotText = (date) => {
    if (!availability[date]) return '?/6';
    const { totalKidsBooked, spotsLeft } = availability[date];
    return `${totalKidsBooked}/6`;
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>✨ Parents Night Out Sign-Up ✨</h1>
        <p style={styles.subtitle}>Book your spot for a fun evening!</p>
      </div>

      <div style={styles.mainContent}>
        {/* Form Section */}
        <div style={styles.formSection}>
          <h2 style={styles.sectionTitle}>📝 Make a Reservation</h2>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Parent/Guardian Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your name"
                required
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="your@email.com"
                required
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Phone (Optional)</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="555-1234"
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Select a Date *</label>
              <select
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
                style={styles.select}
              >
                <option value="">Choose a date...</option>
                <optgroup label="Fridays (5:30 PM - 9:30 PM)">
                  {AVAILABLE_DATES.fridays.map((date) => (
                    <option key={date} value={date}>
                      {FORMATTED_DATES[date]} ({getSpotText(date)} kids)
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Saturdays (12:00 PM - 5:00 PM)">
                  {AVAILABLE_DATES.saturdays.map((date) => (
                    <option key={date} value={date}>
                      {FORMATTED_DATES[date]} ({getSpotText(date)} kids)
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Number of Kids *</label>
              <select
                name="numKids"
                value={formData.numKids}
                onChange={handleInputChange}
                style={styles.select}
              >
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <option key={num} value={num}>
                    {num} kid{num > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting || loading}
              style={{
                ...styles.submitButton,
                opacity: submitting || loading ? 0.6 : 1,
              }}
            >
              {submitting ? 'Booking...' : 'Book Now! 🎉'}
            </button>
          </form>

          {message.text && (
            <div
              style={{
                ...styles.message,
                backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
                color: message.type === 'success' ? '#155724' : '#721c24',
              }}
            >
              {message.text}
            </div>
          )}
        </div>

        {/* Dashboard Section */}
        <div style={styles.dashboardSection}>
          <h2 style={styles.sectionTitle}>📅 Availability</h2>

          {loading ? (
            <p style={styles.loadingText}>Loading availability...</p>
          ) : (
            <div style={styles.dateGrid}>
              {/* Fridays */}
              <div style={styles.dayColumn}>
                <h3 style={styles.dayHeader}>🌙 FRIDAYS</h3>
                <p style={styles.dayTime}>5:30 PM - 9:30 PM</p>
                <div style={styles.dateList}>
                  {AVAILABLE_DATES.fridays.map((date) => (
                    <div
                      key={date}
                      style={{
                        ...styles.dateCard,
                        backgroundColor: getDateColor(date),
                        borderColor: availability[date]?.isFull ? '#d61355' : '#2d7d4c',
                      }}
                    >
                      <div style={styles.dateCardContent}>
                        <div style={styles.dateCardDate}>{FORMATTED_DATES[date]}</div>
                        <div style={styles.dateCardSpots}>
                          {availability[date] ? (
                            <>
                              <div style={styles.spotNumber}>{getSpotText(date)}</div>
                              <div style={styles.spotLabel}>
                                {availability[date].spotsLeft === 0
                                  ? 'FULL'
                                  : `${availability[date].spotsLeft} LEFT`}
                              </div>
                            </>
                          ) : (
                            <div>--</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Saturdays */}
              <div style={styles.dayColumn}>
                <h3 style={styles.dayHeader}>☀️ SATURDAYS</h3>
                <p style={styles.dayTime}>12:00 PM - 5:00 PM</p>
                <div style={styles.dateList}>
                  {AVAILABLE_DATES.saturdays.map((date) => (
                    <div
                      key={date}
                      style={{
                        ...styles.dateCard,
                        backgroundColor: getDateColor(date),
                        borderColor: availability[date]?.isFull ? '#d61355' : '#2d7d4c',
                      }}
                    >
                      <div style={styles.dateCardContent}>
                        <div style={styles.dateCardDate}>{FORMATTED_DATES[date]}</div>
                        <div style={styles.dateCardSpots}>
                          {availability[date] ? (
                            <>
                              <div style={styles.spotNumber}>{getSpotText(date)}</div>
                              <div style={styles.spotLabel}>
                                {availability[date].spotsLeft === 0
                                  ? 'FULL'
                                  : `${availability[date].spotsLeft} LEFT`}
                              </div>
                            </>
                          ) : (
                            <div>--</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#2d7d4c',
    padding: '40px 20px',
    fontFamily: "'Arial', sans-serif",
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  title: {
    fontSize: '48px',
    fontWeight: 'bold',
    color: '#ff6b9d',
    margin: '0 0 10px 0',
    textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
  },
  subtitle: {
    fontSize: '18px',
    color: '#fff',
    margin: 0,
  },
  mainContent: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '40px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  formSection: {
    backgroundColor: '#fff',
    padding: '30px',
    borderRadius: '10px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  dashboardSection: {
    backgroundColor: '#fff',
    padding: '30px',
    borderRadius: '10px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#2d7d4c',
    margin: '0 0 20px 0',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#333',
  },
  input: {
    padding: '12px',
    fontSize: '14px',
    border: '2px solid #ddd',
    borderRadius: '6px',
    fontFamily: 'inherit',
    transition: 'border-color 0.3s',
  },
  select: {
    padding: '12px',
    fontSize: '14px',
    border: '2px solid #ddd',
    borderRadius: '6px',
    fontFamily: 'inherit',
    backgroundColor: '#fff',
    cursor: 'pointer',
  },
  submitButton: {
    padding: '14px 24px',
    fontSize: '16px',
    fontWeight: 'bold',
    backgroundColor: '#ff6b9d',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
    marginTop: '10px',
  },
  message: {
    padding: '14px',
    borderRadius: '6px',
    fontSize: '14px',
    marginTop: '10px',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  dateGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '30px',
  },
  dayColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  dayHeader: {
    fontSize: '22px',
    fontWeight: 'bold',
    color: '#2d7d4c',
    margin: 0,
  },
  dayTime: {
    fontSize: '14px',
    color: '#666',
    margin: 0,
    fontStyle: 'italic',
  },
  dateList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  dateCard: {
    padding: '15px',
    borderRadius: '6px',
    border: '3px solid',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateCardContent: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateCardDate: {
    fontSize: '15px',
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
  },
  dateCardSpots: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  spotNumber: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#000',
  },
  spotLabel: {
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#333',
  },
  loadingText: {
    textAlign: 'center',
    color: '#666',
    fontSize: '16px',
  },
};