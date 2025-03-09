import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import { Box, AppBar, Toolbar, Typography, IconButton, Button } from '@mui/material'
import VideocamIcon from '@mui/icons-material/Videocam'
import BarChartIcon from '@mui/icons-material/BarChart'
import HomeIcon from '@mui/icons-material/Home'
import Auth from './components/Auth'
import ModelSelection from './components/ModelSelection'
import EmotionDetection from './components/EmotionDetection'
import Analytics from './components/Analytics'
import './App.css'
import { AuthProvider, useAuth } from './context/AuthContext';

// Create a separate component for the authenticated content
function AuthenticatedApp() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <BrowserRouter>
      <Box sx={{ flexGrow: 1 }}>
        <AppBar position="static" sx={{ backgroundColor: '#2c3e50' }}>
          <Toolbar>
            <IconButton 
              component={Link} 
              to="/"
              edge="start" 
              color="inherit" 
              sx={{ mr: 2 }}
            >
              <VideocamIcon />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Emotion Detector
            </Typography>
            <Button 
              component={Link}
              to="/"
              color="inherit" 
              startIcon={<HomeIcon />}
              sx={{ mr: 2 }}
            >
              Home
            </Button>
            <Button 
              component={Link}
              to="/analytics"
              color="inherit" 
              startIcon={<BarChartIcon />}
              sx={{ mr: 2 }}
            >
              Analytics
            </Button>
            <Typography variant="body1" sx={{ mr: 2 }}>
              {user.email}
            </Typography>
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          </Toolbar>
        </AppBar>

        <Routes>
          <Route path="/" element={<ModelSelection />} />
          <Route path="/detection/:modelId" element={<EmotionDetection />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>
    </BrowserRouter>
  );
}

// Create a component for the main app content
function AppContent() {
  const { user } = useAuth();
  return !user ? <Auth /> : <AuthenticatedApp />;
}

// Main App component
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App