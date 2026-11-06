import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { segurancaService } from '../services/seguranca.service';
export default function AccessTelemetry() {
  const location = useLocation();
  useEffect(() => { segurancaService.track(location.pathname); }, [location.pathname]);
  return null;
}
