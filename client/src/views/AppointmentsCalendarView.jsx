import React, { useState } from 'react';
import { Calendar, Clock, Scissors, UserCheck, Plus, CheckCircle2, AlertCircle } from 'lucide-react';

function AppointmentsCalendarView({ appointments, customers, stylists, services, onAddAppointment, onUpdateAppointmentStatus }) {
  const [showModal, setShowModal] = useState(false);
  const [dateFilter, setDateFilter] = useState('2026-09-07');

  const [newApp, setNewApp] = useState({
    customer_id: 1,
    stylist_id: 1,
    service_id: 1,
    appointment_date: '2026-09-07',
    appointment_time: '15:00',
    notes: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedService = services.find(s => s.id === parseInt(newApp.service_id));
    const selectedCust = customers.find(c => c.id === parseInt(newApp.customer_id));
    
    onAddAppointment({
      ...newApp,
      customer_name: selectedCust?.name || 'Walk-in Client',
      total_amount: selectedService?.price || 350.00
    });
    setShowModal(false);
  };

  return (
    <div>
      {/* Action Bar */}
      <div className="controls-bar">
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-sub)', fontWeight: '700' }}>Select Date:</label>
          <input 
            type="date" 
            className="search-input" 
            style={{ width: '180px' }}
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value)} 
          />
        </div>

        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Book New Appointment
        </button>
      </div>

      {/* Calendar Appointments List Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Booking ID & Time</th>
              <th>Customer Name</th>
              <th>Salon Service</th>
              <th>Assigned Stylist</th>
              <th>Status</th>
              <th>Total Amount</th>
            </tr>
          </thead>
          <tbody>
            {appointments.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  No appointments scheduled.
                </td>
              </tr>
            ) : (
              appointments.map((app) => (
                <tr key={app.id}>
                  <td>
                    <div style={{ fontWeight: '800', color: 'var(--accent-gold)' }}>#APT-{app.id}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                      {String(app.appointment_date).split('T')[0]} at {app.appointment_time}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: '700' }}>{app.customer_name || 'Walk-in Client'}</div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Scissors size={14} style={{ color: 'var(--accent-gold)' }} />
                      {app.service_name || 'Salon Service'}
                    </div>
                  </td>
                  <td>{app.stylist_name || 'Rohan Sharma'}</td>
                  <td>
                    <select 
                      value={app.status} 
                      onChange={(e) => onUpdateAppointmentStatus(app.id, e.target.value)}
                      style={{
                        background: app.status === 'Completed' ? 'rgba(16, 185, 129, 0.2)' : app.status === 'In-Progress' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(99, 102, 241, 0.2)',
                        color: app.status === 'Completed' ? 'var(--success)' : app.status === 'In-Progress' ? 'var(--accent-gold)' : 'var(--primary-indigo)',
                        border: '1px solid var(--border)',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '0.78rem',
                        fontWeight: '800',
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      <option value="Scheduled">Scheduled</option>
                      <option value="In-Progress">In-Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td style={{ fontWeight: '800', color: '#fff' }}>
                    ₹ {parseFloat(app.total_amount || 350).toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Book Appointment Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '16px' }}>Book Salon Appointment</h3>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Select Customer</label>
                <select value={newApp.customer_id} onChange={(e) => setNewApp({...newApp, customer_id: parseInt(e.target.value)})}>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Select Service</label>
                  <select value={newApp.service_id} onChange={(e) => setNewApp({...newApp, service_id: parseInt(e.target.value)})}>
                    {services.map(s => <option key={s.id} value={s.id}>{s.name} (₹{s.price})</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>Assign Stylist</label>
                  <select value={newApp.stylist_id} onChange={(e) => setNewApp({...newApp, stylist_id: parseInt(e.target.value)})}>
                    {stylists.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Appointment Date</label>
                  <input type="date" required value={newApp.appointment_date} onChange={(e) => setNewApp({...newApp, appointment_date: e.target.value})} />
                </div>

                <div className="form-group">
                  <label>Booking Time</label>
                  <input type="time" required value={newApp.appointment_time} onChange={(e) => setNewApp({...newApp, appointment_time: e.target.value})} />
                </div>
              </div>

              <div className="form-group">
                <label>Booking Notes</label>
                <input type="text" placeholder="e.g. Requested VIP room" value={newApp.notes} onChange={(e) => setNewApp({...newApp, notes: e.target.value})} />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="glass-card" style={{ padding: '8px 16px', cursor: 'pointer', color: 'var(--text-sub)' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AppointmentsCalendarView;
