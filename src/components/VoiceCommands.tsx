import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';

interface VoiceCommandsProps {
  onCommand: (command: string) => void;
  isEnabled: boolean;
  onToggle: () => void;
}

const VoiceCommands: React.FC<VoiceCommandsProps> = ({ onCommand, isEnabled, onToggle }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const commands = {
    'start workout': 'START_WORKOUT',
    'stop workout': 'STOP_WORKOUT',
    'pause workout': 'PAUSE_WORKOUT',
    'resume workout': 'RESUME_WORKOUT',
    'show stats': 'SHOW_STATS',
    'show history': 'SHOW_HISTORY',
    'reset timer': 'RESET_TIMER',
    'take screenshot': 'TAKE_SCREENSHOT'
  };

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
          setConfidence(result[0].confidence);
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      setTranscript(interimTranscript || finalTranscript);

      // Process final transcript for commands
      if (finalTranscript) {
        const command = finalTranscript.toLowerCase().trim();
        const matchedCommand = Object.entries(commands).find(([key]) => 
          command.includes(key)
        );

        if (matchedCommand) {
          onCommand(matchedCommand[1]);
          speak(`Command recognized: ${matchedCommand[0]}`);
          
          // Add haptic feedback
          if ('vibrate' in navigator) {
            navigator.vibrate([50, 100, 50]);
          }
        }
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'aborted') {
        console.info('Speech recognition aborted:', event.error);
      } else {
        console.error('Speech recognition error:', event.error);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (isEnabled) {
        // Restart recognition if still enabled
        setTimeout(() => {
          try {
            recognition.start();
          } catch (error) {
            console.error('Failed to restart recognition:', error);
          }
        }, 1000);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [isEnabled, onCommand]);

  useEffect(() => {
    if (isEnabled && recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Failed to start recognition:', error);
      }
    } else if (!isEnabled && recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, [isEnabled]);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1;
      utterance.volume = 0.7;
      speechSynthesis.speak(utterance);
    }
  };

  const getConfidenceColor = () => {
    if (confidence > 0.8) return 'text-green-400';
    if (confidence > 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="fixed bottom-20 right-4 z-50">
      <div className="flex flex-col items-end space-y-2">
        {/* Voice Command Status */}
        {isEnabled && (
          <div className="backdrop-blur-md bg-white/10 rounded-xl p-3 border border-white/20 max-w-xs">
            <div className="flex items-center space-x-2 mb-2">
              <Volume2 className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-white">Voice Commands Active</span>
            </div>
            
            {isListening && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-300">Listening...</span>
                </div>
                
                {transcript && (
                  <div className="text-xs">
                    <div className="text-gray-400">Transcript:</div>
                    <div className="text-white font-mono">{transcript}</div>
                    {confidence > 0 && (
                      <div className={`text-xs ${getConfidenceColor()}`}>
                        Confidence: {(confidence * 100).toFixed(0)}%
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="mt-2 text-xs text-gray-400">
              <div>Available commands:</div>
              <div className="grid grid-cols-1 gap-1 mt-1">
                {Object.keys(commands).map((command) => (
                  <div key={command} className="font-mono">"{command}"</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Toggle Button */}
        <button
          onClick={onToggle}
          className={`
            flex items-center justify-center w-14 h-14 rounded-full
            backdrop-blur-md border border-white/20 transition-all duration-300
            transform hover:scale-110 active:scale-95
            ${isEnabled 
              ? 'bg-blue-500/20 text-blue-400 shadow-lg shadow-blue-500/20' 
              : 'bg-white/10 text-gray-400'
            }
            ${isListening ? 'animate-pulse' : ''}
          `}
        >
          {isEnabled ? (
            <Mic className={`w-6 h-6 ${isListening ? 'animate-pulse' : ''}`} />
          ) : (
            <MicOff className="w-6 h-6" />
          )}
        </button>
      </div>
    </div>
  );
};

export default VoiceCommands;