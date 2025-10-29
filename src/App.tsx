import MapWithQuakes from './components/MapWithQuakes';
import { useEarthquakes } from './hooks/useEarthquakes';

export default function App() {
  const { data, loading, error } = useEarthquakes();
  
  // Calculate statistics
  const stats = data?.features ? {
    total: data.features.length,
    highMagnitude: data.features.filter((f: any) => (f.properties?.mag || 0) >= 5.0).length,
    recent: data.features.filter((f: any) => {
      const time = f.properties?.time;
      if (!time) return false;
      const quakeTime = new Date(time);
      const now = new Date();
      const hoursDiff = (now.getTime() - quakeTime.getTime()) / (1000 * 60 * 60);
      return hoursDiff <= 6;
    }).length,
    maxMagnitude: Math.max(...data.features.map((f: any) => f.properties?.mag || 0))
  } : { total: 0, highMagnitude: 0, recent: 0, maxMagnitude: 0 };

  return (
    <div className="min-h-screen">
      {/* Statistics Dashboard */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Earthquakes Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 animate-fade-in-up">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Total Earthquakes</p>
                <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
                <p className="text-xs text-slate-500 mt-1">Last 24 hours</p>
              </div>
              <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
              </div>
            </div>
          </div>

          {/* High Magnitude Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 animate-fade-in-up" style={{animationDelay: '0.1s'}}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">High Magnitude</p>
                <p className="text-3xl font-bold text-red-600">{stats.highMagnitude}</p>
                <p className="text-xs text-slate-500 mt-1">≥ 5.0 magnitude</p>
              </div>
              <div className="w-12 h-12 rounded-xl gradient-danger flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z"></path>
                </svg>
              </div>
            </div>
          </div>

          {/* Recent Activity Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Recent Activity</p>
                <p className="text-3xl font-bold text-green-600">{stats.recent}</p>
                <p className="text-xs text-slate-500 mt-1">Last 6 hours</p>
              </div>
              <div className="w-12 h-12 rounded-xl gradient-success flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                </svg>
              </div>
            </div>
          </div>

          {/* Max Magnitude Card */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300 animate-fade-in-up" style={{animationDelay: '0.3s'}}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-1">Max Magnitude</p>
                <p className="text-3xl font-bold text-orange-600">{stats.maxMagnitude.toFixed(1)}</p>
                <p className="text-xs text-slate-500 mt-1">Highest recorded</p>
              </div>
              <div className="w-12 h-12 rounded-xl gradient-warning flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Information Panel */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 mb-8 animate-fade-in-up" style={{animationDelay: '0.4s'}}>
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-lg flex-shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Interactive Earthquake Map</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Explore real-time seismic activity from around the world. Each circle represents an earthquake, 
                with size indicating magnitude and color representing intensity. Click on any earthquake marker 
                to view detailed information including location, magnitude, depth, and time of occurrence.
              </p>
              <div className="flex flex-wrap gap-4 mt-4 text-xs text-slate-500">
                <span className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-400 mr-2"></div>
                  Low magnitude (0-3)
                </span>
                <span className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-yellow-400 mr-2"></div>
                  Medium magnitude (3-5)
                </span>
                <span className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-400 mr-2"></div>
                  High magnitude (5+)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map Component */}
      <MapWithQuakes />
    </div>
  );
}



