const handleCompleteStory = async () => {
  try {
    if (!currentUser || !story) return;
    
    const userRef = doc(db, "users", currentUser.uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      const completedStories = userData.completedStories || [];
      
      if (completedStories.includes(id)) {
        setCompleted(true);
        return;
      }
      
      // Tamamlanan hikaye sayısını güncelle
      const newStoriesRead = completedStories.length + 1;
      
      await updateDoc(userRef, {
        completedStories: arrayUnion(id),
        storiesRead: newStoriesRead
      });
      
      setCompleted(true);
      
      const notification = document.createElement('div');
      notification.className = 'fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50';
      notification.innerHTML = 'Congratulations! You have completed the story.';
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.remove();
      }, 3000);
    }
  } catch (error) {
    console.error("Error completing story:", error);
    alert('Hikaye tamamlanırken bir hata oluştu.');
  }
}; 