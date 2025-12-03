import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2, X, Play } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';

interface VoiceInputProps {
  onTranscript: (transcript: string) => void;
  isProcessing: boolean;
}

export const VoiceInput = ({ onTranscript, isProcessing }: VoiceInputProps) => {
  const [open, setOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  // Refs to avoid stale state inside SpeechRecognition event handlers
  const finalRef = useRef('');
  const interimRef = useRef('');
  const { toast } = useToast();

  useEffect(() => {
    if (!open) {
      // reset state when modal closes
      setIsRecording(false);
      setIsListening(false);
      setInterimTranscript('');
      setFinalTranscript('');
      finalRef.current = '';
      interimRef.current = '';
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
        recognitionRef.current = null;
      }
    }
  }, [open]);

  const startRecording = async () => {
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        toast({ title: 'Not Supported', description: 'Speech recognition is not supported in this browser. Try Chrome or Edge.', variant: 'destructive' });
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false; // auto-stop after silence
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      let localFinal = '';

      recognition.onstart = () => {
        setIsRecording(true);
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            localFinal += t + ' ';
          } else {
            interim += t;
          }
        }
        setInterimTranscript(interim);
        setFinalTranscript(localFinal);
        // keep refs in sync so onend sees the latest transcript
        interimRef.current = interim;
        finalRef.current = localFinal;
      };

      recognition.onerror = (e: any) => {
        console.error('Speech recognition error', e.error);
        toast({ title: 'Recognition Error', description: `Error: ${e.error}`, variant: 'destructive' });
        setIsRecording(false);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
        setIsListening(false);
        // Use refs instead of state here to avoid stale closures on first run
        const full = (finalRef.current + ' ' + interimRef.current).trim();
        const result = full.trim();
        if (result) {
          onTranscript(result);
          setOpen(false);
        } else {
          toast({ title: 'No Speech Detected', description: 'Please try again and speak clearly.', variant: 'destructive' });
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({ title: 'Error', description: 'Failed to start recording. Please check microphone permissions.', variant: 'destructive' });
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }
    setIsRecording(false);
    setIsListening(false);
  };

  const speaking = isRecording && (interimTranscript.length > 0 || finalTranscript.length > 0);

  return (
    <div>
      <Button onClick={() => setOpen(true)} size="default" className="w-full sm:w-auto">
        <Mic className="mr-2 h-4 w-4" />
        Voice Input
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md backdrop-blur-xl bg-card/95 border-border/50 shadow-card-hover animate-modal-open">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Mic className="h-6 w-6 text-primary" />
              Record Voice Task
            </DialogTitle>
            <DialogDescription className="text-muted-foreground/80">
              Speak your task. Recording stops automatically after silence or when you press stop.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="p-4 rounded-lg bg-muted/20 border border-border/20">
              <div className="min-h-[64px]">
                <p className="text-sm italic text-foreground/90">{(finalTranscript + ' ' + interimTranscript).trim() || 'Live transcript will appear here...'}</p>
              </div>

              <div className="mt-3 flex items-end gap-1 h-8">
                {Array.from({ length: 12 }).map((_, i) => (
                  <span key={i}
                    className={`block w-1 rounded-sm bg-indigo-400 ${speaking ? 'animate-wave' : 'opacity-40'}`}
                    style={{ animationDelay: `${i * 60}ms`, height: `${6 + (i % 6) * 6}px` }}
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                {isRecording ? (
                  <Button onClick={stopRecording} variant="destructive">
                    <Square className="mr-2 h-4 w-4" />
                    Stop
                  </Button>
                ) : (
                  <Button onClick={startRecording}>
                    <Play className="mr-2 h-4 w-4" />
                    Start
                  </Button>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setOpen(false); stopRecording(); }}>
                  <X className="h-4 w-4 mr-2" />
                  Close
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};