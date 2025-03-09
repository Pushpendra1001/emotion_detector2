import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'

const models = [
  {
    id: 'doctor-patient',
    title: 'Doctor/Patient',
    description: 'Emotion detection for healthcare',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=500',
  },
  {
    id: 'teacher-student',
    title: 'Teacher/Student',
    description: 'Emotion detection for Students and Teachers',
    image: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=500',
  },
  {
    id: 'customer-service',
    title: 'Customer Service',
    description: 'Emotion detection for customer interactions',
    image: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=500',
  },
]

export default function ModelSelection() {
  const navigate = useNavigate()

  const handleModelSelect = (modelId) => {
    navigate(`/detection/${modelId}`)
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Select Emotion Detection Model
      </Typography>
      <Grid container spacing={4} sx={{ mt: 2 }}>
        {models.map((model) => (
          <Grid item xs={12} md={4} key={model.id}>
            <Card sx={{ height: '100%' }}>
              <CardMedia
                component="img"
                height="200"
                image={model.image}
                alt={model.title}
              />
              {/* <CardContent>
                <Typography gutterBottom variant="h5" component="div">
                  {model.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {model.description}
                </Typography>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => handleModelSelect(model.id)}
                >
                  Pick Model
                </Button>
              </CardContent> */}
              <CardContent>
                <Typography gutterBottom variant="h5" component="div">
                  {model.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {model.description}
                </Typography>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => handleModelSelect(model.id)}
                >
                  Select Model
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  )
}