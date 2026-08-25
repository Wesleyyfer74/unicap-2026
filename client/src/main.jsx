import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import AppRoutes from './routes/AppRoutes';
import './styles/global.css';
import { AuthProvider } from './contexts/AuthContext';
createRoot(document.getElementById('root')).render(<StrictMode><AuthProvider><AppRoutes /></AuthProvider></StrictMode>);
