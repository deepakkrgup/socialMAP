// import React, { useState } from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import { AuthProvider, useAuth } from './context/AuthContext';
// import { ThemeProvider } from './context/ThemeContext';
// import { WebSocketProvider } from './context/WebSocketContext';

// // Pages
// import Login from './pages/Login';
// import Register from './pages/Register';
// import Home from './pages/Home';
// import Explore from './pages/Explore';
// import Profile from './pages/Profile';
// import Messages from './pages/Messages';

// // Components
// import Navbar from './components/Navbar';
// import Sidebar from './components/Sidebar';
// import CreatePostModal from './components/CreatePostModal';

// // Route Guard component
// function ProtectedRoute({ children }) {
//   const { user, loading } = useAuth();
//   if (loading) {
//     return (
//       // <div className="min-h-screen bg-[#080b11] flex items-center justify-center text-slate-400">
//       //   Syncing session...
//       // </div>
//       <div className="min-h-screen bg-[#EEF2F9] flex items-center justify-center">
//         <div className="bg-white px-8 py-5 rounded-2xl shadow-lg text-slate-600 font-semibold">
//               Loading SocialMAP...
//         </div>
//       </div>
//     );
//   }
//   return user ? children : <Navigate to="/login" replace />;
// }

// // App Layout assembler
// function AppContent() {
//   const { user } = useAuth();
//   const [isSidebarOpen, setIsSidebarOpen] = useState(false);
//   const [isComposerOpen, setIsComposerOpen] = useState(false);

//   const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

//   if (!user) {
//     return (
//       <Routes>
//         <Route path="/login" element={<Login />} />
//         <Route path="/register" element={<Register />} />
//         <Route path="*" element={<Navigate to="/login" replace />} />
//       </Routes>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-[#EEF2F9]">
//       <Navbar onMenuClick={toggleSidebar} />
      
//       <div className="flex h-[calc(100vh-72px)] max-w-[1600px] mx-auto">
//         {/* Navigation Sidebar */}
//         <Sidebar
//           onCreatePostClick={() => setIsComposerOpen(true)}
//           isOpen={isSidebarOpen}
//           onClose={() => setIsSidebarOpen(false)}
//         />

//         {/* Main Content Area */}
//         <main className="flex-1 overflow-y-auto bg-[#F7F9FD] px-8 py-6">
//           <Routes>
//             <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
//             <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
//             <Route path="/profile/:username" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
//             <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
//             <Route path="*" element={<Navigate to="/" replace />} />
//           </Routes>
//         </main>
//       </div>

//       {/* Global Create Post Modal dialog */}
//       <CreatePostModal
//         isOpen={isComposerOpen}
//         onClose={() => setIsComposerOpen(false)}
//         onPostCreated={(newPost) => {
//           // Relies on event/state changes or page refresh to reload feeds
//           // The modal will refresh list in Home if we pass trigger or use router
//           window.location.reload(); // Simple reload to refresh all feeds
//         }}
//       />
//     </div>
//   );
// }

// export default function App() {
//   return (
//     <ThemeProvider>
//       <AuthProvider>
//         <WebSocketProvider>
//           <Router>
//             <AppContent />
//           </Router>
//         </WebSocketProvider>
//       </AuthProvider>
//     </ThemeProvider>
//   );
// }

import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { WebSocketProvider } from './context/WebSocketContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Profile from './pages/Profile';
import Messages from './pages/Messages';

// Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import CreatePostModal from './components/CreatePostModal';

// Route Guard component
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-[#080b11] flex items-center justify-center text-slate-400">
        Syncing session...
      </div>
    );
  }
  return user ? children : <Navigate to="/login" replace />;
}

// App Layout assembler
function AppContent() {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isComposerOpen, setIsComposerOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-mesh-glow">
      <Navbar onMenuClick={toggleSidebar} />
      
      <div className="flex-1 max-w-7xl w-full mx-auto flex">
        {/* Navigation Sidebar */}
        <Sidebar
          onCreatePostClick={() => setIsComposerOpen(true)}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 relative overflow-x-hidden min-h-[calc(100vh-70px)]">
          <Routes>
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
            <Route path="/profile/:username" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Global Create Post Modal dialog */}
      <CreatePostModal
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        onPostCreated={(newPost) => {
          // Relies on event/state changes or page refresh to reload feeds
          // The modal will refresh list in Home if we pass trigger or use router
          window.location.reload(); // Simple reload to refresh all feeds
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <WebSocketProvider>
          <Router>
            <AppContent />
          </Router>
        </WebSocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
