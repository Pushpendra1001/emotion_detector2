import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Box, Button, TextField, Typography, Container, Alert, CircularProgress
} from '@mui/material';

function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpField, setShowOtpField] = useState(false);
  const [message, setMessage] = useState('');
  const { loading, error, register, login, verifyOTP, resendOTP } = useAuth();

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      if (showOtpField) {
        const result = await verifyOTP(email, otp);
        console.log('Verification result:', result);
        
        if (result.success) {
          setMessage('Email verified successfully! Please login.');
          // Reset form after successful verification
          setTimeout(() => {
            setShowOtpField(false);
            setIsLogin(true);
            setOtp('');
          }, 2000);
        }
      } else {
        const result = isLogin 
          ? await login(email, password)
          : await register(email, password);
        
        if (!isLogin && result.requiresOTP) {
          setShowOtpField(true);
          setMessage('Please check your email for verification code');
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setMessage(err.message || 'An error occurred');
    }
  };

  const handleResendOTP = async () => {
    try {
      const result = await resendOTP(email);
      setMessage('New verification code sent to your email');
    } catch (err) {
      console.error('Resend OTP error:', err);
      setMessage(err.message || 'Failed to resend code');
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5">
          {showOtpField ? 'Verify Email' : (isLogin ? 'Sign In' : 'Sign Up')}
        </Typography>

        {(message || error) && (
          <Alert 
            severity={message.includes('successfully') ? 'success' : error ? 'error' : 'info'}
            sx={{ mt: 2, width: '100%' }}
          >
            {message || error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, width: '100%' }}>
          {!showOtpField ? (
            <>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Email Address"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </>
          ) : (
            <Box sx={{ width: '100%' }}>
              <Typography variant="body2" gutterBottom>
                Verification code sent to: {email}
              </Typography>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Verification Code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                disabled={loading}
              />
              <Button
                fullWidth
                onClick={handleResendOTP}
                sx={{ mt: 1 }}
                disabled={loading}
              >
                Resend Code
              </Button>
            </Box>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              showOtpField ? 'Verify Email' : (isLogin ? 'Sign In' : 'Sign Up')
            )}
          </Button>

          {!showOtpField && (
            <Button
              fullWidth
              onClick={() => {
                setIsLogin(!isLogin);
                setMessage('');
                setError('');
              }}
              sx={{ mt: 1 }}
            >
              {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
            </Button>
          )}
        </Box>
      </Box>
    </Container>
  );
}

export default Auth;