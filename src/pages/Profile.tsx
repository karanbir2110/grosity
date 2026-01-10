import { useEffect, useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

// Define a type for the profile
interface Profile {
  full_name?: string;
  mobile?: string;
  address?: string;
}

export default function Profile() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '',
    mobile: '',
    address: '',
  });

  /* =====================
     AUTH CHECK
     ===================== */
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  /* =====================
     FETCH PROFILE
     ===================== */
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        // Cast the result to the Profile type
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, mobile, address')
          .eq('id', user.id)
          .single() as { data: Profile | null; error: any };

        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          console.error('Error fetching profile:', error);
        }

        if (data) {
          setFormData({
            full_name: data.full_name || '',
            mobile: data.mobile || '',
            address: data.address || '',
          });
        }
      } catch (error) {
        console.error('Unexpected error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  /* =====================
     UPDATE PROFILE
     ===================== */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setSuccess(false);

    // Cast the data to 'any' to bypass TypeScript errors
    const { error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        role: 'user',
        full_name: formData.full_name,
        mobile: formData.mobile,
        address: formData.address,
      } as any); // Use type assertion to 'any'

    setSaving(false);

    if (!error) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      alert(error.message);
    }
  };

  if (authLoading || loading) {
    return <p style={{ padding: 40 }}>Loading profile...</p>;
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', padding: 40 }}>
      <div
        style={{
          maxWidth: 520,
          margin: 'auto',
          background: '#fff',
          borderRadius: 12,
          padding: 30,
          boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
        }}
      >
        <h2
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 20,
          }}
        >
          <User /> My Profile
        </h2>

        {success && (
          <div
            style={{
              background: '#dcfce7',
              color: '#166534',
              padding: 12,
              borderRadius: 8,
              marginBottom: 16,
              textAlign: 'center',
              fontWeight: 500,
            }}
          >
            Profile updated successfully ✅
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
          <div>
            <label>Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              style={{
                width: '100%',
                padding: 10,
                marginTop: 6,
                background: '#e5e7eb',
                border: '1px solid #d1d5db',
                borderRadius: 6,
              }}
            />
          </div>

          <div>
            <label>Full Name</label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) =>
                setFormData({ ...formData, full_name: e.target.value })
              }
              style={{
                width: '100%',
                padding: 10,
                marginTop: 6,
                borderRadius: 6,
                border: '1px solid #d1d5db',
              }}
            />
          </div>

          <div>
            <label>Mobile Number</label>
            <input
              type="tel"
              required
              value={formData.mobile}
              onChange={(e) =>
                setFormData({ ...formData, mobile: e.target.value })
              }
              style={{
                width: '100%',
                padding: 10,
                marginTop: 6,
                borderRadius: 6,
                border: '1px solid #d1d5db',
              }}
            />
          </div>

          <div>
            <label>Address</label>
            <textarea
              rows={3}
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              style={{
                width: '100%',
                padding: 10,
                marginTop: 6,
                borderRadius: 6,
                border: '1px solid #d1d5db',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            style={{
              marginTop: 10,
              padding: 12,
              background: '#16a34a',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: saving ? 0.7 : 1,
            }}
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}