import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import Community from './pages/Community';
import WritePost from './pages/WritePost';
import PostDetail from './pages/PostDetail';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          <Route 
            path="/" 
            element={
              <PrivateRoute>
                <Home />
              </PrivateRoute>
            } 
          />
          
          <Route 
            path="/community" 
            element={
              <PrivateRoute>
                <Community />
              </PrivateRoute>
            } 
          />
          
          <Route 
            path="/community/write" 
            element={
              <PrivateRoute>
                <WritePost />
              </PrivateRoute>
            } 
          />
          
          <Route 
            path="/community/:id" 
            element={
              <PrivateRoute>
                <PostDetail />
              </PrivateRoute>
            } 
          />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;