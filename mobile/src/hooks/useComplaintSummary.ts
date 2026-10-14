import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { authorityApi } from '../api/authorityApi';
import { complaintApi } from '../api/complaintApi';
import { Complaint } from '../types/complaint';

export function useComplaintSummary(role: 'citizen' | 'officer') {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = role === 'officer' ? await authorityApi.getAllComplaints() : await complaintApi.getMyComplaints();
      setComplaints(data.complaints || []);
    } catch (e: any) { setError(e.message || 'Reports are unavailable. Please retry.'); }
    finally { setLoading(false); }
  }, [role]);
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));
  return { complaints, loading, error, refresh };
}
