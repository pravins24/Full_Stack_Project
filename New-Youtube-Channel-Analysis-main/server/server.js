// server.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 5000;

app.use(cors());

// Replace 'YOUR_API_KEY' with your actual YouTube Data API v3 key
const API_KEY = 'AIzaSyCRreCni6wmdd-BXr1Gd7SABioXUdQ-b6o';

// Get channel data and top 10 popular videos
app.get('/api/channel-data', async (req, res) => {
  const CHANNEL_ID = req.query.channelId; // Get the channel ID from the query parameters
  try {
    // Fetch channel statistics
    const channelResponse = await axios.get(`https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${CHANNEL_ID}&key=${API_KEY}`);
    const channelData = channelResponse.data.items[0];

    // Channel snippet contains the logo URL
    const channelLogo = channelData.snippet.thumbnails.high?.url || channelData.snippet.thumbnails.default.url;
    const channelStatistics = channelData.statistics;

    // Fetch top 10 popular videos
    const videosResponse = await axios.get(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&order=viewCount&maxResults=10&key=${API_KEY}`);
    
    const videos = await Promise.all(videosResponse.data.items.map(async (video) => {
      const videoId = video.id.videoId;
      // Fetch video statistics
      const videoStatsResponse = await axios.get(`https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoId}&key=${API_KEY}`);
      const videoStats = videoStatsResponse.data.items[0];

      const likeCount = videoStats.statistics.likeCount || 0; // Handle cases where like count is not available
      const publishedAt = videoStats.snippet.publishedAt;
      const earnings = calculateEstimatedIncome(videoStats.statistics.viewCount); // Calculate income based on views
      const thumbnailUrl = videoStats.snippet.thumbnails.maxres?.url || videoStats.snippet.thumbnails.high?.url || videoStats.snippet.thumbnails.default.url;

      // Here we can also fetch comments if needed, and analyze them into good and bad comments
      // For now, just returning a placeholder for comments
      const comments = {
        goodComments: [{ author: 'User1', text: 'Great video!' }], // Placeholder
        badComments: [{ author: 'User2', text: 'Not what I expected.' }] // Placeholder
      };

      return {
        title: video.snippet.title,
        videoId,
        link: `https://www.youtube.com/watch?v=${videoId}`,
        likeCount,
        publishedAt,
        earnings,
        thumbnailUrl, // Include thumbnail URL
        comments
      };
    }));

    // Combine data
    const data = {
      title: channelData.snippet.title,
      description: channelData.snippet.description,
      logo: channelLogo,
      subscribers: channelStatistics.subscriberCount,
      views: channelStatistics.viewCount,
      videoCount: channelStatistics.videoCount,
      videos, // Include popular videos
    };

    res.json(data);
  } catch (error) {
    console.error('Error fetching data from YouTube API:', error);
    res.status(500).send('Error fetching channel data');
  }
});

// Function to calculate estimated income
const calculateEstimatedIncome = (views) => {
  const earningsPerView = 0.01; // Assuming $0.01 per view
  return (views * earningsPerView).toFixed(2);
};

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
