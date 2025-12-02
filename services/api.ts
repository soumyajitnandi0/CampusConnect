import axios from 'axios';
import { Platform } from 'react-native';

// Use localhost for web, local IP for mobile devices
const BASE_URL = Platform.OS === 'web' 
    ? 'http://localhost:5000/api'
    : 'http://10.110.154.246:5000/api';

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;
