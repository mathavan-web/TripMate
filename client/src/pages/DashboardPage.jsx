import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import request from '../services/api';

const formatCurrency = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;
const toDateKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getPeriodRange = (period, customStart, customEnd) => {
  const today = new Date();
  const start = new Date(today);
  const end = new Date(today);

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  if (period === 'thisMonth') {
    start.setDate(1);
    end.setMonth(end.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
  }

  if (period === 'lastMonth') {
    start.setMonth(start.getMonth() - 1, 1);
    end.setMonth(end.getMonth(), 0);
    end.setHours(23, 59, 59, 999);
  }

  if (period === 'thisYear') {
    start.setMonth(0, 1);
    end.setMonth(11, 31);
    end.setHours(23, 59, 59, 999);
  }

  if (period === 'custom' && customStart) {
    const customStartDate = new Date(customStart);
    customStartDate.setHours(0, 0, 0, 0);
    start.setTime(customStartDate.getTime());
  }

  if (period === 'custom' && customEnd) {
    const customEndDate = new Date(customEnd);
    customEndDate.setHours(23, 59, 59, 999);
    end.setTime(customEndDate.getTime());
  }

  return { start, end };
};

const isWithinRange = (value, start, end) => {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  return date >= start && date <= end;
};

function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalEnquiries: 0,
    openEnquiries: 0,
    confirmedEnquiries: 0,
    activePackages: 0,
    pendingQuotations: 0,
    confirmedBookings: 0,
    pendingBookings: 0,
    todaysTrips: 0,
    upcomingTrips: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    totalProfit: 0,
    pendingPayments: 0,
  });
  const [recentEnquiries, setRecentEnquiries] = useState([]);
  const [recentQuotations, setRecentQuotations] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [trips, setTrips] = useState([]);
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [period, setPeriod] = useState('thisMonth');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [calendarMonth, setCalendarMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(() => toDateKey(new Date()));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [customersResponse, enquiriesResponse, packagesResponse, quotationsResponse, bookingsResponse, tripsResponse, paymentsResponse, expensesResponse, metricsResponse] = await Promise.all([
          request('/customers'),
          request('/enquiries'),
          request('/packages'),
          request('/quotations'),
          request('/bookings'),
          request('/trips'),
          request('/payments'),
          request('/expenses'),
          request('/dashboard/metrics'),
        ]);

        const customers = customersResponse.data || [];
        const enquiries = enquiriesResponse.data || [];
        const packages = packagesResponse.data || [];
        const quotations = quotationsResponse.data || [];
        const bookingsData = bookingsResponse.data || [];
        const tripsData = tripsResponse.data || [];
        const paymentsData = paymentsResponse.data || [];
        const expensesData = expensesResponse.data || [];

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcomingTripsData = tripsData.filter((trip) => {
          if (!trip.travelDate) return false;
          const tripDate = new Date(trip.travelDate);
          tripDate.setHours(0, 0, 0, 0);
          return tripDate >= today;
        }).sort((left, right) => new Date(left.travelDate) - new Date(right.travelDate)).slice(0, 5);

        setStats({
          totalCustomers: customers.length,
          totalEnquiries: enquiries.length,
          openEnquiries: enquiries.filter((enquiry) => ['New', 'Contacted', 'Quoted', 'Follow-up'].includes(enquiry.status)).length,
          confirmedEnquiries: enquiries.filter((enquiry) => enquiry.status === 'Confirmed').length,
          activePackages: packages.filter((pkg) => pkg.isActive).length,
          pendingQuotations: quotations.filter((quote) => ['Draft', 'Sent'].includes(quote.status)).length,
          confirmedBookings: bookingsData.filter((booking) => booking.status === 'Confirmed').length,
          pendingBookings: bookingsData.filter((booking) => booking.status === 'Pending').length,
          todaysTrips: tripsData.filter((trip) => {
            if (!trip.travelDate) return false;
            const tripDate = new Date(trip.travelDate);
            return tripDate.toDateString() === today.toDateString();
          }).length,
          upcomingTrips: upcomingTripsData.length,
          ...(metricsResponse.data || {}),
        });

        setBookings(bookingsData);
        setTrips(tripsData);
        setPayments(paymentsData);
        setExpenses(expensesData);
        setRecentEnquiries(enquiries.slice(0, 5));
        setRecentQuotations(quotations.slice(0, 5));
      } catch (error) {
        setStats({
          totalCustomers: 0,
          totalEnquiries: 0,
          openEnquiries: 0,
          confirmedEnquiries: 0,
          activePackages: 0,
          pendingQuotations: 0,
          confirmedBookings: 0,
          pendingBookings: 0,
          todaysTrips: 0,
          upcomingTrips: 0,
          totalRevenue: 0,
          totalExpenses: 0,
          totalProfit: 0,
          pendingPayments: 0,
        });
        setBookings([]);
        setTrips([]);
        setPayments([]);
        setExpenses([]);
        setRecentEnquiries([]);
        setRecentQuotations([]);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const activeRange = useMemo(() => getPeriodRange(period, customStart, customEnd), [period, customStart, customEnd]);

  const upcomingTripsForDashboard = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return [...trips]
      .filter((trip) => trip.travelDate && new Date(trip.travelDate) >= today)
      .sort((left, right) => new Date(left.travelDate) - new Date(right.travelDate))
      .slice(0, 5);
  }, [trips]);

  const summary = useMemo(() => {
    const bookingsInRange = bookings.filter((booking) => isWithinRange(booking.travelDate || booking.createdAt, activeRange.start, activeRange.end));
    const paymentsInRange = payments.filter((payment) => isWithinRange(payment.paymentDate, activeRange.start, activeRange.end));
    const expensesInRange = expenses.filter((expense) => isWithinRange(expense.expenseDate, activeRange.start, activeRange.end));

    const revenue = bookingsInRange.reduce((total, booking) => total + Number(booking.totalAmount || 0), 0);
    const expenseTotal = expensesInRange.reduce((total, expense) => total + Number(expense.amount || 0), 0);
    const paymentReceived = paymentsInRange.reduce((total, payment) => {
      const value = payment.paymentType === 'Refund' ? -Number(payment.amount || 0) : Number(payment.amount || 0);
      return total + value;
    }, 0);

    const pendingList = bookingsInRange
      .map((booking) => {
        const paid = payments
          .filter((payment) => String(payment.booking) === String(booking._id) || String(payment.booking?._id || '') === String(booking._id))
          .reduce((total, payment) => total + (payment.paymentType === 'Refund' ? -Number(payment.amount || 0) : Number(payment.amount || 0)), 0);
        return {
          booking,
          balance: Math.max(0, Number(booking.totalAmount || 0) - paid),
          customerName: booking.customer?.name || 'Customer',
        };
      })
      .filter((item) => item.balance > 0)
      .sort((left, right) => right.balance - left.balance);

    return {
      revenue,
      expenseTotal,
      profit: revenue - expenseTotal,
      paymentReceived,
      pendingList,
      pendingTotal: pendingList.reduce((total, item) => total + item.balance, 0),
    };
  }, [activeRange, bookings, expenses, payments]);

  const tripCalendarMap = useMemo(() => {
    const map = {};
    trips.forEach((trip) => {
      if (!trip.travelDate) return;
      const dateKey = toDateKey(trip.travelDate);
      if (!dateKey) return;
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(trip);
    });
    return map;
  }, [trips]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const startOffset = firstDay.getDay();
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - startOffset);

    const days = [];
    for (let index = 0; index < 42; index += 1) {
      const current = new Date(startDate);
      current.setDate(startDate.getDate() + index);
      days.push(current);
    }

    return days;
  }, [calendarMonth]);

  const tripReportRows = useMemo(() => (
    [...trips]
      .filter((trip) => isWithinRange(trip.travelDate, activeRange.start, activeRange.end))
      .sort((left, right) => new Date(left.travelDate) - new Date(right.travelDate))
      .slice(0, 5)
  ), [activeRange, trips]);

  const paymentReportRows = useMemo(() => (
    [...payments]
      .filter((payment) => isWithinRange(payment.paymentDate, activeRange.start, activeRange.end))
      .sort((left, right) => new Date(right.paymentDate) - new Date(left.paymentDate))
      .slice(0, 5)
  ), [activeRange, payments]);

  const expenseReportRows = useMemo(() => (
    [...expenses]
      .filter((expense) => isWithinRange(expense.expenseDate, activeRange.start, activeRange.end))
      .sort((left, right) => new Date(right.expenseDate) - new Date(left.expenseDate))
      .slice(0, 5)
  ), [activeRange, expenses]);

  const selectedDateTrips = selectedDate && tripCalendarMap[selectedDate] ? tripCalendarMap[selectedDate] : [];

  const financialCards = [
    { title: 'Revenue', value: summary.revenue, note: 'Bookings in selected period', accent: 'green' },
    { title: 'Expenses', value: summary.expenseTotal, note: 'Recorded trip expenses', accent: 'orange' },
    { title: 'Profit', value: summary.profit, note: 'Revenue less expenses', accent: 'teal' },
    { title: 'Pending Payments', value: summary.pendingTotal, note: 'Outstanding booking balances', accent: 'blue' },
  ];

  const renderStatCard = (stat, isFinancial = false) => (
    <div key={stat.title} className={`stat-card ${stat.accent}`}>
      <div className="stat-icon">•</div>
      <div className="stat-meta">
        <span>{stat.title}</span>
        <strong>{loading ? '...' : isFinancial ? formatCurrency(stat.value) : stat.value}</strong>
        <small>{stat.note}</small>
      </div>
    </div>
  );

  const operationalCards = [
    { title: 'Total Customers', value: stats.totalCustomers, note: 'Customer records in your business', accent: 'blue' },
    { title: 'Total Enquiries', value: stats.totalEnquiries, note: 'Customer requests tracked', accent: 'teal' },
    { title: 'Open Enquiries', value: stats.openEnquiries, note: 'Active follow-up work', accent: 'orange' },
    { title: 'Active Packages', value: stats.activePackages, note: 'Packages ready for quoting', accent: 'green' },
    { title: 'Pending Quotations', value: stats.pendingQuotations, note: 'Draft and sent quotations', accent: 'blue' },
    { title: 'Confirmed Bookings', value: stats.confirmedBookings, note: 'Bookings ready for execution', accent: 'green' },
    { title: 'Pending Bookings', value: stats.pendingBookings, note: 'Awaiting confirmation', accent: 'orange' },
    { title: "Today's Trips", value: stats.todaysTrips, note: 'Trips scheduled today', accent: 'teal' },
    { title: 'Upcoming Trips', value: stats.upcomingTrips, note: 'Trips in the near future', accent: 'blue' },
  ];

  return (
    <div className="page-shell">
      <section className="welcome-card">
        <div>
          <p className="eyebrow">Overview</p>
          <h1>Welcome back, {user?.name || 'Business Owner'}</h1>
          <p>Track daily operations, upcoming trips, and the core business numbers that matter most.</p>
        </div>
      </section>

      <section>
        <div className="section-heading dashboard-section-heading">
          <h2>Operational Overview</h2>
          <p>Overview of your current bookings, quotations and trips.</p>
        </div>
        <div className="stats-grid">
          {operationalCards.map((stat) => renderStatCard(stat))}
        </div>
      </section>

      <section className="card-block">
        <div className="section-heading">
          <h2>Business summary</h2>
          <p>Simple performance metrics using your real booking, payment, and expense data.</p>
        </div>

        <div className="period-controls" style={{ marginBottom: '18px' }}>
          <select value={period} onChange={(event) => setPeriod(event.target.value)}>
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
            <option value="thisYear">This Year</option>
            <option value="custom">Custom Date Range</option>
          </select>

          {period === 'custom' && (
            <>
              <input type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} />
              <input type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} />
            </>
          )}
        </div>

        <div className="summary-strip">
          {financialCards.map((stat) => renderStatCard(stat, true))}
        </div>
      </section>

      <section id="trip-calendar" className="card-block">
        <div className="calendar-header">
          <div>
            <p className="eyebrow">Trip calendar</p>
            <h2>{calendarMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</h2>
          </div>
          <div className="calendar-actions">
            <button type="button" className="secondary-button" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}>Previous</button>
            <button type="button" className="secondary-button" onClick={() => setCalendarMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}>Today</button>
            <button type="button" className="secondary-button" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}>Next</button>
          </div>
        </div>

        <div className="calendar-grid" style={{ marginTop: '18px' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="calendar-weekday">{day}</div>
          ))}

          {calendarDays.map((day) => {
            const key = toDateKey(day);
            const tripsForDate = tripCalendarMap[key] || [];
            const isCurrentMonth = day.getMonth() === calendarMonth.getMonth();
            const isToday = toDateKey(day) === toDateKey(new Date());
            const isSelected = key === selectedDate;

            return (
              <button
                key={key}
                type="button"
                className={`calendar-day ${isCurrentMonth ? '' : 'muted'} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${tripsForDate.length > 0 ? 'has-trips' : ''}`}
                onClick={() => setSelectedDate(key)}
              >
                <span>{day.getDate()}</span>
                {tripsForDate.length > 0 && <small className="calendar-dot" />}
              </button>
            );
          })}
        </div>

        {selectedDate && (
          <div className="date-detail-card" style={{ marginTop: '24px' }}>
            <h3>{new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</h3>
            {selectedDateTrips.length === 0 ? (
              <div className="empty-card compact">
                <h3>No trips scheduled for this date</h3>
                <p>There are no trip bookings assigned to this day.</p>
              </div>
            ) : (
              <div className="date-trip-list">
                <p className="micro-copy">{selectedDateTrips.length} trip{selectedDateTrips.length > 1 ? 's' : ''}</p>
                {selectedDateTrips.map((trip, index) => (
                  <div key={`${trip._id}-${index}`} className="trip-item">
                    <div className="trip-item-header">
                      <strong>{trip.customer?.name || 'Customer'}</strong>
                      <span className={`status-badge ${String(trip.status).toLowerCase().replace(/\s+/g, '-')}`}>{trip.status}</span>
                    </div>
                    <p>{trip.destination || 'Destination not set'}</p>
                    <div className="trip-meta-row">
                      <span>{trip.booking?.bookingNumber || 'Booking'}</span>
                      <span>Passengers: {trip.passengerCount || trip.booking?.numberOfPassengers || 1}</span>
                    </div>
                    <div className="trip-meta-row">
                      <span>Vehicle: {trip.vehicleModel || trip.vehicleType || 'Not assigned'}</span>
                      <span>{formatCurrency(trip.booking?.totalAmount || 0)}</span>
                    </div>
                    <button type="button" className="secondary-button" onClick={() => navigate('/trips')}>View trip details</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="card-block">
        <div className="section-heading">
          <h2>Upcoming trips</h2>
          <p>Nearest scheduled movements for the next few days.</p>
        </div>

        {upcomingTripsForDashboard.length === 0 ? (
          <div className="empty-card compact">
            <h3>No upcoming trips</h3>
            <p>Once trip dates are scheduled, they will appear here.</p>
          </div>
        ) : (
          <div className="trip-list simple-list">
            {upcomingTripsForDashboard.map((trip) => (
              <div key={trip._id} className="simple-list-item">
                <div>
                  <strong>{new Date(trip.travelDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</strong>
                  <p>{trip.customer?.name || 'Customer'}</p>
                  <small>{trip.destination || 'Destination not set'}</small>
                </div>
                <div className="simple-list-actions">
                  <span>{formatCurrency(trip.booking?.totalAmount || 0)}</span>
                  <button type="button" className="text-button" onClick={() => navigate('/trips')}>View</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card-block">
        <div className="section-heading">
          <h2>Pending payments</h2>
          <p>Balance amounts still due against bookings in the selected range.</p>
        </div>

        {summary.pendingList.length === 0 ? (
          <div className="empty-card compact">
            <h3>No pending payments</h3>
            <p>Outstanding balances will appear here once a booking is confirmed.</p>
          </div>
        ) : (
          <div className="pending-list">
            {summary.pendingList.slice(0, 5).map((entry) => (
              <div key={entry.booking._id} className="simple-list-item">
                <div>
                  <strong>{entry.customerName}</strong>
                  <small>{entry.booking.bookingNumber || 'Booking'}</small>
                </div>
                <span>{formatCurrency(entry.balance)}</span>
              </div>
            ))}
            <div className="pending-total">
              <span>Total</span>
              <strong>{formatCurrency(summary.pendingTotal)}</strong>
            </div>
          </div>
        )}
      </section>

      <section id="reports" className="card-block">
        <div className="section-heading">
          <h2>Simple reports</h2>
          <p>Practical summaries for trips, payments, and expenses in the selected period.</p>
        </div>

        <div className="report-grid">
          <div className="report-panel">
            <h3>Trip report</h3>
            {tripReportRows.length === 0 ? <p className="report-empty">No trips in this period.</p> : (
              <table className="data-table compact-table">
                <thead>
                  <tr><th>Customer</th><th>Date</th><th>Status</th><th>Amount</th></tr>
                </thead>
                <tbody>
                  {tripReportRows.map((trip) => (
                    <tr key={trip._id}>
                      <td>{trip.customer?.name || 'Customer'}</td>
                      <td>{trip.travelDate ? new Date(trip.travelDate).toLocaleDateString() : '-'}</td>
                      <td><span className={`status-badge ${String(trip.status).toLowerCase().replace(/\s+/g, '-')}`}>{trip.status}</span></td>
                      <td>{formatCurrency(trip.booking?.totalAmount || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="report-panel">
            <h3>Payment report</h3>
            {paymentReportRows.length === 0 ? <p className="report-empty">No payment entries in this period.</p> : (
              <table className="data-table compact-table">
                <thead>
                  <tr><th>Customer</th><th>Amount</th><th>Status</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {paymentReportRows.map((payment) => (
                    <tr key={payment._id}>
                      <td>{payment.customer?.name || 'Customer'}</td>
                      <td>{formatCurrency(payment.amount)}</td>
                      <td>{payment.paymentType}</td>
                      <td>{payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="report-panel">
            <h3>Expense report</h3>
            {expenseReportRows.length === 0 ? <p className="report-empty">No expense entries in this period.</p> : (
              <table className="data-table compact-table">
                <thead>
                  <tr><th>Category</th><th>Amount</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {expenseReportRows.map((expense) => (
                    <tr key={expense._id}>
                      <td>{expense.category}</td>
                      <td>{formatCurrency(expense.amount)}</td>
                      <td>{expense.expenseDate ? new Date(expense.expenseDate).toLocaleDateString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>

    </div>
  );
}

export default DashboardPage;
