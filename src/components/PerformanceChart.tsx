import React, { useRef, useEffect } from 'react';
import { WorkoutData } from '../types';

interface PerformanceChartProps {
  workouts: WorkoutData[];
}

const PerformanceChart: React.FC<PerformanceChartProps> = ({ workouts }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || workouts.length === 0) return;

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

    let animationProgress = 0;
    const animationDuration = 2000; // 2 seconds

    const animate = (timestamp: number) => {
      if (!animationRef.current) {
        animationRef.current = timestamp;
      }

      const elapsed = timestamp - animationRef.current;
      animationProgress = Math.min(elapsed / animationDuration, 1);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const padding = 40;
      const width = canvas.width / window.devicePixelRatio - padding * 2;
      const height = canvas.height / window.devicePixelRatio - padding * 2;

      // Sort workouts by date
      const sortedWorkouts = [...workouts].sort((a, b) => a.startTime - b.startTime);
      const distances = sortedWorkouts.map(w => w.distance / 1000); // Convert to km
      const maxDistance = Math.max(...distances);

      // Draw grid lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;

      // Horizontal grid lines
      for (let i = 0; i <= 5; i++) {
        const y = padding + (height / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(padding + width, y);
        ctx.stroke();

        // Y-axis labels
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        ctx.font = '12px system-ui';
        ctx.textAlign = 'right';
        ctx.fillText(
          `${((maxDistance / 5) * (5 - i)).toFixed(1)}km`,
          padding - 10,
          y + 4
        );
      }

      // Vertical grid lines
      for (let i = 0; i <= sortedWorkouts.length - 1; i++) {
        const x = padding + (width / Math.max(sortedWorkouts.length - 1, 1)) * i;
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, padding + height);
        ctx.stroke();
      }

      // Draw distance line chart with animation
      if (sortedWorkouts.length > 1) {
        const gradient = ctx.createLinearGradient(0, padding, 0, padding + height);
        gradient.addColorStop(0, '#8b5cf6');
        gradient.addColorStop(1, 'rgba(139, 92, 246, 0.1)');

        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Create path for line
        ctx.beginPath();
        const pointsToShow = Math.floor(sortedWorkouts.length * animationProgress);
        
        if (pointsToShow > 0) {
          const firstPoint = {
            x: padding,
            y: padding + height - (distances[0] / maxDistance) * height
          };
          ctx.moveTo(firstPoint.x, firstPoint.y);

          for (let i = 1; i < pointsToShow; i++) {
            const x = padding + (width / Math.max(sortedWorkouts.length - 1, 1)) * i;
            const y = padding + height - (distances[i] / maxDistance) * height;
            ctx.lineTo(x, y);
          }
        }

        ctx.stroke();

        // Fill area under curve
        if (pointsToShow > 0) {
          ctx.fillStyle = gradient;
          ctx.lineTo(padding + (width / Math.max(sortedWorkouts.length - 1, 1)) * (pointsToShow - 1), padding + height);
          ctx.lineTo(padding, padding + height);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Draw data points with animation
      sortedWorkouts.forEach((workout, index) => {
        const pointProgress = Math.max(0, Math.min(1, (animationProgress * sortedWorkouts.length) - index));
        
        if (pointProgress > 0) {
          const x = padding + (width / Math.max(sortedWorkouts.length - 1, 1)) * index;
          const y = padding + height - (distances[index] / maxDistance) * height;

          // Point with pulsing effect
          const pulseScale = 1 + Math.sin(Date.now() * 0.005 + index) * 0.1;
          const pointSize = 6 * pointProgress * pulseScale;

          ctx.beginPath();
          ctx.arc(x, y, pointSize, 0, Math.PI * 2);
          ctx.fillStyle = '#8b5cf6';
          ctx.fill();

          // White border
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Glow effect
          ctx.shadowColor = '#8b5cf6';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(x, y, pointSize * 0.7, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(139, 92, 246, 0.6)';
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // Draw title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('Distance Progress', padding + width / 2, 25);

      if (animationProgress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [workouts]);

  if (workouts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        <p>Complete your first workout to see analytics!</p>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-64 rounded-xl"
    />
  );
};

export default PerformanceChart;