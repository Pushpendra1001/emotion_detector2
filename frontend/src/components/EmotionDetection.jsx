import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Box, 
  Container, 
  Typography, 
  Paper,
  CircularProgress,
  Button
} from '@mui/material'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'

const modelPaths = {
  'doctor-patient': 'my_model.keras',
  'teacher-student': 'models/teacher_student_model.keras',
  'customer-service': 'models/customer_service_model.keras'
};

export default function EmotionDetection() {
  const { modelId } = useParams()
  const navigate = useNavigate()
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const connectToBackend = async () => {
      try {
        const response = await fetch(`http://localhost:5005/load-model`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            modelPath: modelPaths[modelId] // This is using modelPaths but it's not defined
          })
        })
        
        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to load model')
        }
        
        setIsConnected(true)
      } catch (err) {
        setError(err.message)
        setIsConnected(false)
      }
    }

    connectToBackend()
  }, [modelId])

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/')}
        sx={{ mb: 2 }}
      >
        Back to Model Selection
      </Button>

      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          {modelId.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('/')} Emotion Detection
        </Typography>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            Error: {error}
          </Typography>
        )}

        {isConnected ? (
          <Box
            sx={{
              width: '100%',
              maxWidth: 800,
              height: 600,
              margin: '0 auto',
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 2,
              boxShadow: 3
            }}
          >
            <img 
              src="http://localhost:5005/video_feed"
              alt="Emotion Detection Feed"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography color="text.secondary">
              Connecting to emotion detection server...
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  )
}