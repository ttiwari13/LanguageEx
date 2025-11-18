import React, { useState } from 'react';

// --- TS Interfaces (Keeping them clean) ---
interface FriendRequest {
  id: number;
  senderName: string;
}

interface User {
  id: number;
  name: string;
}
// --- End Interfaces ---

const Friends: React.FC = () => {
  // Static data
  const [pendingRequests] = useState<FriendRequest[]>([
    { id: 101, senderName: 'Alex Johnson' },
    { id: 102, senderName: 'Sarah Connor' },
    { id: 103, senderName: 'Mike Ross' },
  ]);

  const [availableUsers] = useState<User[]>([
    { id: 201, name: 'Jessie Pinkman' },
    { id: 202, name: 'Walter White' },
    { id: 203, name: 'Skyler White' },
    { id: 204, name: 'Gus Fring' },
    { id: 205, name: 'Hank Schrader' },
  ]);

  const [searchTerm, setSearchTerm] = useState<string>('');

  // Placeholder Handlers
  const handleSendRequest = (userId: number): void => {
    console.log(`[UI Action]: Request sent to user ID: ${userId}`);
  };

  const handleAcceptRequest = (requestId: number): void => {
    console.log(`[UI Action]: Accepted request ID: ${requestId}`);
  };

  const handleRejectRequest = (requestId: number): void => {
    console.log(`[UI Action]: Rejected request ID: ${requestId}`);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(event.target.value);
  };

  // --- STYLES DEFINITION (Centralized for better readability) ---
  const styles = {
    container: {
      maxWidth: '900px',
      margin: '40px auto',
      padding: '30px',
      fontFamily: 'Segoe UI, Roboto, Arial, sans-serif',
      backgroundColor: '#f9f9f9',
      borderRadius: '12px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
    },
    section: {
      backgroundColor: '#ffffff',
      padding: '25px',
      borderRadius: '8px',
      marginBottom: '30px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)',
    },
    heading: {
      color: '#333',
      borderBottom: '2px solid #007bff',
      paddingBottom: '10px',
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    listItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 0',
      borderBottom: '1px solid #f0f0f0',
      transition: 'background-color 0.2s',
    },
    list: {
      listStyleType: 'none',
      padding: 0,
    },
    buttonBase: {
      padding: '8px 15px',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      transition: 'background-color 0.2s',
      fontWeight: 600,
      marginLeft: '10px',
    },
    acceptButton: {
      backgroundColor: '#28a745',
      color: 'white',
    },
    rejectButton: {
      backgroundColor: '#dc3545',
      color: 'white',
    },
    sendButton: {
      backgroundColor: '#007bff',
      color: 'white',
    },
    searchInput: {
      width: '100%',
      padding: '12px 15px',
      marginBottom: '15px',
      borderRadius: '6px',
      border: '1px solid #ced4da',
      fontSize: '16px',
      boxSizing: 'border-box' as const, // Important for full width padding
    },
    emptyMessage: {
        color: '#6c757d',
        padding: '10px 0',
        fontStyle: 'italic',
    }
  };
  // --- END STYLES DEFINITION ---


  return (
    <div style={styles.container}>
      <h1 style={{ color: '#1a1a1a', textAlign: 'center', marginBottom: '40px' }}>
         Social Hub
      </h1>
      <div style={styles.section}>
        <h2 style={styles.heading as React.CSSProperties}>
          Requests Received ({pendingRequests.length})
        </h2>
        
        {pendingRequests.length > 0 ? (
          <ul style={styles.list}>
            {pendingRequests.map((request: FriendRequest) => (
              <li key={request.id} style={styles.listItem}>
                <span style={{ fontWeight: 500, color: '#333' }}>{request.senderName}</span>
                <div>
                  <button 
                    onClick={() => handleAcceptRequest(request.id)}
                    style={{ ...styles.buttonBase, ...styles.acceptButton }}
                  >
                    Accept
                  </button>
                  <button 
                    onClick={() => handleRejectRequest(request.id)}
                    style={{ ...styles.buttonBase, ...styles.rejectButton }}
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p style={styles.emptyMessage}>You are all caught up! No new friend requests.</p>
        )}
      </div>
      <div style={styles.section}>
        <h2 style={styles.heading as React.CSSProperties}>
           Find New Connections
        </h2>
        <input
          type="text"
          placeholder="Search for names or usernames..."
          value={searchTerm}
          onChange={handleSearchChange}
          style={styles.searchInput}
        />

        <h3 style={{ color: '#555', marginTop: '30px', marginBottom: '15px', fontSize: '18px' }}>
            Suggested People
        </h3>
        
        <ul style={styles.list}>
          {availableUsers
            .filter((user: User) => user.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((user: User) => (
              <li 
                key={user.id}
                style={styles.listItem}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#333' }}>
                     {user.name}
                </span>
                <button 
                  onClick={() => handleSendRequest(user.id)}
                  style={{ ...styles.buttonBase, ...styles.sendButton }}
                >
                   Send Request
                </button>
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}

export default Friends;