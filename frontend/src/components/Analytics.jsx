import { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  CircularProgress,
  Box,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    emotionsByTime: [],
    emotionsByModel: [],
  });
  const [timeRange, setTimeRange] = useState('day');
  const [selectedEmotion, setSelectedEmotion] = useState('all');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`http://localhost:5005/analytics?timeRange=${timeRange}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      
      const analyticsData = await response.json();
      
      const processedData = processAnalyticsData(analyticsData);
      setData(processedData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const processAnalyticsData = (rawData) => {
    // Calculate emotion percentages
    const totalEmotions = rawData.emotionsByModel.reduce((acc, curr) => acc + curr.count, 0);
    const emotionsWithPercentage = rawData.emotionsByModel.map(item => ({
      ...item,
      percentage: ((item.count / totalEmotions) * 100).toFixed(2)
    }));

    // Calculate emotion trends
    const emotionTrends = calculateEmotionTrends(rawData.emotionsByTime);

    return {
      ...rawData,
      emotionsByModel: emotionsWithPercentage,
      emotionTrends
    };
  };

  const calculateEmotionTrends = (timeData) => {
    const trends = {};
    timeData.forEach(entry => {
      const hour = new Date(entry.timestamp).getHours();
      if (!trends[hour]) {
        trends[hour] = { hour, count: 0 };
      }
      trends[hour].count += entry.count;
    });
    return Object.values(trends);
  };

  const EmotionMetricsCard = ({ title, value, subtitle }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>{title}</Typography>
        <Typography variant="h4" color="primary">{value}</Typography>
        <Typography variant="body2" color="text.secondary">{subtitle}</Typography>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography color="error" align="center">Error: {error}</Typography>
      </Container>
    );
  }

  const getEmotionSummaryData = () => {
    const totalDetections = data.emotionsByModel.reduce((acc, curr) => acc + curr.count, 0);
    const dominantEmotion = [...data.emotionsByModel].sort((a, b) => b.count - a.count)[0];
    return { totalDetections, dominantEmotion };
  };

  const { totalDetections, dominantEmotion } = getEmotionSummaryData();

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" align="center" gutterBottom>
        Emotion Analytics Dashboard
      </Typography>

     
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <EmotionMetricsCard
            title="Total Detections"
            value={totalDetections}
            subtitle="Total emotion detections"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <EmotionMetricsCard
            title="Dominant Emotion"
            value={dominantEmotion?.emotion}
            subtitle={`${dominantEmotion?.percentage}% of total detections`}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <EmotionMetricsCard
            title="Active Sessions"
            value={data.emotionTrends.length}
            subtitle="Number of detection sessions"
          />
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        <Grid item xs={12} lg={8}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Emotion Trends Over Time</Typography>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={data.emotionsByTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#8884d8" 
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Emotion Distribution</Typography>
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={data.emotionsByModel}
                  dataKey="count"
                  nameKey="emotion"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {data.emotionsByModel.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Emotion Radar Analysis</Typography>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart cx="50%" cy="50%" outerRadius="80%">
                <PolarGrid />
                <PolarAngleAxis dataKey="emotion" />
                <PolarRadiusAxis />
                <Radar
                  name="Emotions"
                  dataKey="count"
                  data={data.emotionsByModel}
                  fill="#8884d8"
                  fillOpacity={0.6}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}