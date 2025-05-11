import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';

const Navbar = () => {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="bg-dark text-white px-4 py-3">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-xl font-bold flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <span className="text-blue-500">Readung Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin" className="hover:text-gray-300">
            Admin Paneli
          </Link>
          <button onClick={handleLogout} className="hover:text-gray-300">
            Çıkış
          </button>
        </div>
      </div>
    </nav>
  );
};

export default function ManageUsers() {
  const router = useRouter();
  const { currentUser, getUserData } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({
    membershipType: 'free',
    role: 'user'
  });

  useEffect(() => {
    const checkAdminAndLoadUsers = async () => {
      if (!currentUser) {
        router.push('/auth/login');
        return;
      }

      try {
        // Admin kontrolü
        const userData = await getUserData();
        if (!userData || userData.role !== 'admin') {
          router.push('/home');
          return;
        }

        fetchUsers();
      } catch (error) {
        console.error('Error checking admin status:', error);
        router.push('/home');
      }
    };

    checkAdminAndLoadUsers();
  }, [currentUser, router, getUserData]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      
      const userData = [];
      querySnapshot.forEach((doc) => {
        userData.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setUsers(userData);
    } catch (error) {
      console.error('Error fetching users:', error);
      setMessage({
        type: 'error',
        text: 'Kullanıcılar yüklenirken bir hata oluştu.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setSelectedUser(null);
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditData({
      membershipType: user.membershipType || 'free',
      role: user.role || 'user'
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedUser(null);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      // Kullanıcıyı Firestore'dan sil
      await deleteDoc(doc(db, "users", selectedUser.id));
      
      // Kullanıcı listesini güncelle
      setUsers(users.filter(user => user.id !== selectedUser.id));
      
      setMessage({
        type: 'success',
        text: `"${selectedUser.email}" kullanıcısı başarıyla silindi.`
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      setMessage({
        type: 'error',
        text: 'Kullanıcı silinirken bir hata oluştu.'
      });
    } finally {
      closeDeleteModal();
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    
    try {
      // Kullanıcı bilgilerini güncelle
      await updateDoc(doc(db, "users", selectedUser.id), {
        membershipType: editData.membershipType,
        role: editData.role
      });
      
      // Kullanıcı listesini güncelle
      setUsers(users.map(user => 
        user.id === selectedUser.id 
          ? { ...user, membershipType: editData.membershipType, role: editData.role }
          : user
      ));
      
      setMessage({
        type: 'success',
        text: `"${selectedUser.email}" kullanıcısı başarıyla güncellendi.`
      });
    } catch (error) {
      console.error('Error updating user:', error);
      setMessage({
        type: 'error',
        text: 'Kullanıcı güncellenirken bir hata oluştu.'
      });
    } finally {
      closeEditModal();
    }
  };

  const getMembershipBadge = (type) => {
    return type === 'premium' 
      ? 'bg-blue-100 text-blue-800' 
      : 'bg-gray-100 text-gray-800';
  };

  const getRoleBadge = (role) => {
    return role === 'admin' 
      ? 'bg-purple-100 text-purple-800' 
      : 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8 flex items-center justify-center">
          <div className="text-center">
            <svg className="animate-spin h-10 w-10 mx-auto text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4">Kullanıcılar yükleniyor...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Head>
        <title>Kullanıcı Yönetimi - Readung Admin</title>
      </Head>
      
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Kullanıcı Yönetimi</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={fetchUsers}
              className="p-2 bg-gray-100 hover:bg-gray-200 rounded-md"
              title="Yenile"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <Link href="/admin" className="flex items-center text-blue-600 hover:text-blue-800">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
              </svg>
              Admin Paneline Dön
            </Link>
          </div>
        </div>
        
        {message.text && (
          <div className={`p-4 mb-6 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message.text}
            <button 
              onClick={() => setMessage({ type: '', text: '' })} 
              className="float-right"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-bold text-xl">Tüm Kullanıcılar ({users.length})</h2>
          </div>
          
          {users.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              Henüz kullanıcı bulunmamaktadır.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kullanıcı</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Üyelik</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kayıt Tarihi</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İstatistikler</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.email}</div>
                        <div className="text-sm text-gray-500">{user.displayName || 'İsimsiz Kullanıcı'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getMembershipBadge(user.membershipType)}`}>
                          {user.membershipType === 'premium' ? 'Premium' : 'Ücretsiz'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadge(user.role)}`}>
                          {user.role === 'admin' ? 'Admin' : 'Kullanıcı'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'Bilinmiyor'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>Kaydedilen Kelimeler: {user.savedWords?.length || 0}</div>
                        <div>Okunan Hikayeler: {user.storiesRead || 0}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex gap-3 justify-end">
                          <button
                            onClick={() => openEditModal(user)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => openDeleteModal(user)}
                            className="text-red-600 hover:text-red-900"
                            disabled={user.id === currentUser.uid}
                            title={user.id === currentUser.uid ? "Kendini silemezsin" : "Kullanıcıyı sil"}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${user.id === currentUser.uid ? 'opacity-50 cursor-not-allowed' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
      
      {/* Silme Onay Modalı */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md mx-auto p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Kullanıcıyı Sil</h3>
            <p className="mb-6 text-gray-600">
              <strong>"{selectedUser.email}"</strong> kullanıcısını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md"
              >
                İptal
              </button>
              <button
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Düzenleme Modalı */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md mx-auto p-6 w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Kullanıcıyı Düzenle</h3>
            <p className="mb-4 text-gray-600">
              <strong>"{selectedUser.email}"</strong> kullanıcısını düzenliyorsunuz.
            </p>
            
            <div className="mb-4">
              <label htmlFor="membershipType" className="block text-sm font-medium text-gray-700 mb-1">
                Üyelik Tipi
              </label>
              <select
                id="membershipType"
                name="membershipType"
                value={editData.membershipType}
                onChange={handleEditChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="free">Ücretsiz</option>
                <option value="premium">Premium</option>
              </select>
            </div>
            
            <div className="mb-6">
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                Kullanıcı Rolü
              </label>
              <select
                id="role"
                name="role"
                value={editData.role}
                onChange={handleEditChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="user">Normal Kullanıcı</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            
            <div className="flex justify-end gap-4">
              <button
                onClick={closeEditModal}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-md"
              >
                İptal
              </button>
              <button
                onClick={handleUpdateUser}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
              >
                Güncelle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 