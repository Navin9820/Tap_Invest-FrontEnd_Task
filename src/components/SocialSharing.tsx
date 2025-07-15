import React, { useState } from 'react';
import { Share2, Camera, Download, Twitter, Facebook, Instagram, Copy, Check } from 'lucide-react';
import { WorkoutData } from '../types';

interface SocialSharingProps {
  workout: WorkoutData;
  onClose: () => void;
}

const SocialSharing: React.FC<SocialSharingProps> = ({ workout, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m ${seconds % 60}s`;
  };

  const formatDistance = (meters: number) => {
    return meters < 1000 ? `${Math.round(meters)}m` : `${(meters / 1000).toFixed(2)}km`;
  };

  const generateShareText = () => {
    const distance = formatDistance(workout.distance);
    const duration = formatTime(workout.duration);
    const avgSpeed = (workout.averageSpeed * 3.6).toFixed(1);
    
    return `Just completed a ${distance} workout in ${duration}! 🏃‍♂️\n` +
           `Average speed: ${avgSpeed} km/h\n` +
           `Calories burned: ${workout.calories} 🔥\n` +
           `#FitTrackPro #Fitness #Running`;
  };

  const generateWorkoutImage = async () => {
    setIsGeneratingImage(true);
    
    try {
      // Create a canvas for the workout summary image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 800;
      canvas.height = 600;

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#4f46e5');
      gradient.addColorStop(0.5, '#7c3aed');
      gradient.addColorStop(1, '#ec4899');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add glassmorphism overlay
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(50, 50, canvas.width - 100, canvas.height - 100);

      // Title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 48px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('Workout Complete! 🏃‍♂️', canvas.width / 2, 150);

      // Stats
      const stats = [
        { label: 'Distance', value: formatDistance(workout.distance) },
        { label: 'Duration', value: formatTime(workout.duration) },
        { label: 'Avg Speed', value: `${(workout.averageSpeed * 3.6).toFixed(1)} km/h` },
        { label: 'Calories', value: `${workout.calories} cal` }
      ];

      ctx.font = '32px system-ui';
      stats.forEach((stat, index) => {
        const y = 250 + (index * 80);
        ctx.fillStyle = '#e5e7eb';
        ctx.textAlign = 'left';
        ctx.fillText(stat.label + ':', 150, y);
        
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'right';
        ctx.fillText(stat.value, canvas.width - 150, y);
      });

      // Footer
      ctx.fillStyle = '#d1d5db';
      ctx.font = '24px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText('Powered by FitTrack Pro', canvas.width / 2, canvas.height - 50);

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `workout-${new Date(workout.startTime).toISOString().split('T')[0]}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
        setIsGeneratingImage(false);
      }, 'image/png');
    } catch (error) {
      console.error('Error generating image:', error);
      setIsGeneratingImage(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generateShareText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const shareToSocial = (platform: string) => {
    const text = encodeURIComponent(generateShareText());
    const url = encodeURIComponent(window.location.href);
    
    let shareUrl = '';
    
    switch (platform) {
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${text}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`;
        break;
      case 'instagram':
        // Instagram doesn't support direct URL sharing, so copy to clipboard
        copyToClipboard();
        alert('Text copied! You can paste it when sharing to Instagram.');
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  const useNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Workout Results',
          text: generateShareText(),
          url: window.location.href
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="backdrop-blur-md bg-white/10 rounded-2xl p-6 border border-white/20 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold flex items-center">
            <Share2 className="h-5 w-5 mr-2" />
            Share Workout
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Workout Summary */}
        <div className="backdrop-blur-sm bg-white/5 rounded-xl p-4 mb-6">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-white">{formatDistance(workout.distance)}</div>
              <div className="text-sm text-gray-300">Distance</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{formatTime(workout.duration)}</div>
              <div className="text-sm text-gray-300">Duration</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{(workout.averageSpeed * 3.6).toFixed(1)} km/h</div>
              <div className="text-sm text-gray-300">Avg Speed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{workout.calories}</div>
              <div className="text-sm text-gray-300">Calories</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Native Share (if supported) */}
          {navigator.share && (
            <button
              onClick={useNativeShare}
              className="w-full flex items-center justify-center space-x-2 bg-blue-500/20 hover:bg-blue-500/30 
                       text-blue-400 py-3 px-4 rounded-xl border border-blue-400/30 transition-all duration-200"
            >
              <Share2 className="w-5 h-5" />
              <span>Share</span>
            </button>
          )}

          {/* Generate Image */}
          <button
            onClick={generateWorkoutImage}
            disabled={isGeneratingImage}
            className="w-full flex items-center justify-center space-x-2 bg-purple-500/20 hover:bg-purple-500/30 
                     text-purple-400 py-3 px-4 rounded-xl border border-purple-400/30 transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingImage ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-400"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Camera className="w-5 h-5" />
                <span>Download Image</span>
              </>
            )}
          </button>

          {/* Copy Text */}
          <button
            onClick={copyToClipboard}
            className="w-full flex items-center justify-center space-x-2 bg-green-500/20 hover:bg-green-500/30 
                     text-green-400 py-3 px-4 rounded-xl border border-green-400/30 transition-all duration-200"
          >
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            <span>{copied ? 'Copied!' : 'Copy Text'}</span>
          </button>

          {/* Social Media Buttons */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => shareToSocial('twitter')}
              className="flex items-center justify-center space-x-2 bg-blue-400/20 hover:bg-blue-400/30 
                       text-blue-400 py-3 px-4 rounded-xl border border-blue-400/30 transition-all duration-200"
            >
              <Twitter className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => shareToSocial('facebook')}
              className="flex items-center justify-center space-x-2 bg-blue-600/20 hover:bg-blue-600/30 
                       text-blue-300 py-3 px-4 rounded-xl border border-blue-300/30 transition-all duration-200"
            >
              <Facebook className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => shareToSocial('instagram')}
              className="flex items-center justify-center space-x-2 bg-pink-500/20 hover:bg-pink-500/30 
                       text-pink-400 py-3 px-4 rounded-xl border border-pink-400/30 transition-all duration-200"
            >
              <Instagram className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialSharing;