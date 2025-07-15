import React, { useRef, useEffect } from 'react';
import { RoutePoint } from '../types';

interface RouteCanvasProps {
  route: RoutePoint[];
  currentLocation?: GeolocationPosition | null;
}

const RouteCanvas: React.FC<RouteCanvasProps> = ({ route, currentLocation }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (route.length === 0) {
        // Draw placeholder
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(0, 0, canvas.width / window.devicePixelRatio, canvas.height / window.devicePixelRatio);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '16px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText(
          'Start tracking to see your route!',
          canvas.width / (2 * window.devicePixelRatio),
          canvas.height / (2 * window.devicePixelRatio)
        );
        return;
      }

      // Calculate bounds
      const lats = route.map(p => p.lat);
      const lngs = route.map(p => p.lng);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);

      const padding = 20;
      const width = canvas.width / window.devicePixelRatio - padding * 2;
      const height = canvas.height / window.devicePixelRatio - padding * 2;

      // Convert lat/lng to canvas coordinates
      const toCanvas = (lat: number, lng: number) => ({
        x: padding + ((lng - minLng) / (maxLng - minLng)) * width,
        y: padding + ((maxLat - lat) / (maxLat - minLat)) * height
      });

      // Draw route with gradient
      if (route.length > 1) {
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#8b5cf6');
        gradient.addColorStop(0.5, '#3b82f6');
        gradient.addColorStop(1, '#06b6d4');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Add glow effect
        ctx.shadowColor = '#8b5cf6';
        ctx.shadowBlur = 10;

        ctx.beginPath();
        const startPoint = toCanvas(route[0].lat, route[0].lng);
        ctx.moveTo(startPoint.x, startPoint.y);

        for (let i = 1; i < route.length; i++) {
          const point = toCanvas(route[i].lat, route[i].lng);
          ctx.lineTo(point.x, point.y);
        }
        ctx.stroke();

        // Remove shadow for other elements
        ctx.shadowBlur = 0;
      }

      // Draw route points with varying sizes based on speed
      route.forEach((point, index) => {
        const canvasPoint = toCanvas(point.lat, point.lng);
        const speedIntensity = Math.min(point.speed / 10, 1); // Normalize speed
        const size = 2 + speedIntensity * 4;

        ctx.beginPath();
        ctx.arc(canvasPoint.x, canvasPoint.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${240 + speedIntensity * 60}, 70%, 60%)`;
        ctx.fill();

        // Add pulsing effect for recent points
        if (index > route.length - 10) {
          const alpha = (index - (route.length - 10)) / 10;
          ctx.beginPath();
          ctx.arc(canvasPoint.x, canvasPoint.y, size * 2, 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${240 + speedIntensity * 60}, 70%, 60%, ${alpha * 0.3})`;
          ctx.fill();
        }
      });

      // Draw start and end markers
      if (route.length > 0) {
        const startPoint = toCanvas(route[0].lat, route[0].lng);
        const endPoint = toCanvas(route[route.length - 1].lat, route[route.length - 1].lng);

        // Start marker (green)
        ctx.beginPath();
        ctx.arc(startPoint.x, startPoint.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#10b981';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // End marker (red) - only if different from start
        if (route.length > 1) {
          ctx.beginPath();
          ctx.arc(endPoint.x, endPoint.y, 8, 0, Math.PI * 2);
          ctx.fillStyle = '#ef4444';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      // Draw current location indicator
      if (currentLocation) {
        const currentPoint = toCanvas(currentLocation.coords.latitude, currentLocation.coords.longitude);
        const time = Date.now() * 0.005;
        const pulse = Math.sin(time) * 0.3 + 0.7;

        ctx.beginPath();
        ctx.arc(currentPoint.x, currentPoint.y, 12 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(59, 130, 246, ${0.3 * pulse})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(currentPoint.x, currentPoint.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#3b82f6';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [route, currentLocation]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-64 rounded-xl border border-white/20"
      style={{ touchAction: 'none' }}
    />
  );
};

export default RouteCanvas;