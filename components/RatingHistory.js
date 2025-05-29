import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

export default function RatingHistory() {
  const { currentUser } = useAuth();
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRatings = async () => {
      if (!currentUser) return;
      
      try {
        const ratingsRef = collection(db, 'ratings');
        const q = query(
          ratingsRef,
          where('userId', '==', currentUser.uid),
          orderBy('timestamp', 'desc')
        );
        
        const snapshot = await getDocs(q);
        const ratingList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setRatings(ratingList);
      } catch (error) {
        console.error('Error fetching ratings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRatings();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-md">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const categoryLabels = {
    ease: 'Ease of Use',
    accuracy: 'Translation Accuracy & Comprehension Aid',
    learning: 'Learning Benefit',
    design: 'Website Design'
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-md">
      <h2 className="text-2xl font-bold mb-4 flex items-center">
        <svg className="w-6 h-6 mr-2 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
        Your Rating History
      </h2>
      
      {ratings.length > 0 ? (
        <div className="space-y-6">
          {ratings.map((rating) => (
            <div key={rating.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-500 text-sm">
                  {new Date(rating.timestamp).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                <div className="text-sm text-gray-600">
                  Average: {(
                    Object.entries(rating)
                      .filter(([key]) => ['ease', 'accuracy', 'learning', 'design'].includes(key))
                      .reduce((sum, [, value]) => sum + value, 0) / 4
                  ).toFixed(1)} ⭐
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(rating).map(([key, value]) => {
                  if (categoryLabels[key]) {
                    return (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-gray-700 text-sm">{categoryLabels[key]}</span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={`text-lg ${
                                i < value ? 'text-yellow-400' : 'text-gray-300'
                              }`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <p className="text-gray-500 mb-2 font-medium">No ratings yet</p>
          <p className="text-sm text-gray-400">Rate your experience to see your history here</p>
        </div>
      )}
    </div>
  );
} 