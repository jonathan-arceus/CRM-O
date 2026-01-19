import { Phone, PhoneCall } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTelephony } from '@/hooks/useTelephony';
import { usePhoneVisibility } from '@/hooks/usePhoneVisibility';

interface ClickToCallProps {
  phoneNumber: string | null | undefined;
  leadId?: string;
  contactId?: string;
  variant?: 'button' | 'icon' | 'link';
  className?: string;
}

export function ClickToCall({ 
  phoneNumber, 
  leadId, 
  contactId, 
  variant = 'icon',
  className = ''
}: ClickToCallProps) {
  const { initiateCall, canMakeCalls } = useTelephony();
  const { formatPhoneNumber, canSeeFullNumber } = usePhoneVisibility();

  if (!phoneNumber) return null;

  const displayNumber = formatPhoneNumber(phoneNumber);
  const canCall = canMakeCalls() && canSeeFullNumber();

  const handleCall = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!canCall) return;
    
    await initiateCall(phoneNumber, leadId, contactId);
  };

  if (variant === 'link') {
    return (
      <span className={`inline-flex items-center gap-1 ${className}`}>
        <span className="font-mono">{displayNumber}</span>
        {canCall && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleCall}
                className="p-1 rounded hover:bg-primary/10 text-primary transition-colors"
              >
                <PhoneCall className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Click to call</TooltipContent>
          </Tooltip>
        )}
      </span>
    );
  }

  if (variant === 'button') {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleCall}
        disabled={!canCall}
        className={className}
      >
        <Phone className="w-4 h-4 mr-2" />
        {displayNumber}
      </Button>
    );
  }

  // Icon variant (default)
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCall}
          disabled={!canCall}
          className={className}
        >
          <Phone className={`w-4 h-4 ${canCall ? 'text-primary' : 'text-muted-foreground'}`} />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {canCall ? `Call ${displayNumber}` : 'Click-to-call not available'}
      </TooltipContent>
    </Tooltip>
  );
}
