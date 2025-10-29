const { useEffect, useState } = React;

export const FEED_URL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson';

export function useEarthquakes() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async (signal) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(FEED_URL, { signal });
      if (!response.ok) throw new Error(`Request failed: ${response.status}`);
      const json = await response.json();
      setData(json);
    } catch (err) {
      if (err.name !== 'AbortError') setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    fetchData(controller.signal);
    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  const retry = () => {
    const controller = new AbortController();
    fetchData(controller.signal);
  };

  return { data, error, loading, retry };
}



