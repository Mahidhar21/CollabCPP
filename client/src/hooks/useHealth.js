import { useEffect } from 'react';
import { healthApi } from '../services/api.js';
import useAppStore from '../store/useAppStore.js';

export function useHealth({ autoFetch = true } = {}) {
  const {
    apiHealth,
    apiHealthLoading,
    apiHealthError,
    setApiHealth,
    setApiHealthLoading,
    setApiHealthError,
  } = useAppStore();

  const fetchHealth = async () => {
    setApiHealthLoading(true);
    setApiHealthError(null);
    try {
      const { data } = await healthApi.getHealth();
      setApiHealth(data.data);
    } catch (err) {
      setApiHealthError(err.message || 'Failed to reach API');
    } finally {
      setApiHealthLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchHealth();
    }
  }, [autoFetch]);

  return {
    health: apiHealth,
    loading: apiHealthLoading,
    error: apiHealthError,
    refetch: fetchHealth,
  };
}
