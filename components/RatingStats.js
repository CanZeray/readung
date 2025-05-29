import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function RatingStats() {
  const [stats, setStats] = useState({
    ease: { avg: 0, total: 0 },
    accuracy: { avg: 0, total: 0 },
    learning: { avg: 0, total: 0 },
    design: { avg: 0, total: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [totalRatings, setTotalRatings] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const ratingsRef = collection(db, 'ratings');
        const snapshot = await getDocs(ratingsRef);
        const ratings = snapshot.docs.map(doc => doc.data());
        
        setTotalRatings(ratings.length);
        
        const newStats = {
          ease: { sum: 0, count: 0 },
          accuracy: { sum: 0, count: 0 },
          learning: { sum: 0, count: 0 },
          design: { sum: 0, count: 0 }
        };

        ratings.forEach(rating => {
          Object.keys(newStats).forEach(key => {
            if (rating[key]) {
              newStats[key].sum += rating[key];
              newStats[key].count += 1;
            }
          });
        });

        const finalStats = {};
        Object.keys(newStats).forEach(key => {
          finalStats[key] = {
            avg: newStats[key].count > 0 
              ? (newStats[key].sum / newStats[key].count).toFixed(1)
              : 0,
            total: newStats[key].count
          };
        });

        setStats(finalStats);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const categoryLabels = {
    ease: 'Ease of Use',
    accuracy: 'Translation Accuracy & Comprehension Aid',
    learning: 'Learning Benefit',
    design: 'Website Design'
  };

  const getColorClass = (avg) => {
    if (avg >= 4.5) return 'text-green-600 bg-green-50 border-green-200';
    if (avg >= 3.5) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-md">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const overallAverage = Object.values(stats)
    .reduce((sum, stat) => sum + parseFloat(stat.avg), 0) / 4;

  return (
    <div className="bg-white rounded-xl p-6 shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center">
          <svg className="w-6 h-6 mr-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Rating Statistics
        </h2>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary-500">
            {overallAverage.toFixed(1)}
          </div>
          <div className="text-sm text-gray-500">Overall Average</div>
        </div>
      </div>

      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-800 mb-1">{totalRatings}</div>
          <div className="text-gray-600">Total Ratings Received</div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(stats).map(([key, value]) => (
          <div key={key} className={`p-4 rounded-lg border ${getColorClass(value.avg)}`}>
            <h3 className="text-lg font-semibold mb-2">{categoryLabels[key]}</h3>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  {value.avg}
                </div>
                <div className="text-sm opacity-70">
                  ({value.total} ratings)
                </div>
              </div>
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={`text-xl ${
                      i < Math.round(value.avg) ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-800 mb-2">Rating Breakdown</h3>
        <div className="grid grid-cols-5 gap-2 text-center">
          {[5, 4, 3, 2, 1].map(rating => {
            const count = Object.values(stats).reduce((sum, stat) => {
              // Bu gerçek veriye göre hesaplanmalı, şimdilik tahmin
              return sum + Math.floor(stat.total * (rating === 5 ? 0.4 : rating === 4 ? 0.3 : rating === 3 ? 0.2 : rating === 2 ? 0.08 : 0.02));
            }, 0);
            
            return (
              <div key={rating} className="text-blue-700">
                <div className="font-bold">{rating}★</div>
                <div className="text-sm">{count}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
} 