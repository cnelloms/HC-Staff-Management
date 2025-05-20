import React from 'react';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface CompleteTicketButtonProps {
  ticketId: number;
  disabled?: boolean;
}

export function CompleteTicketButton({ ticketId, disabled }: CompleteTicketButtonProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const completeTicketMutation = useMutation<any, Error, void>({
    mutationFn: async () => {
      // Only send the status change - server will handle the date
      return apiRequest('PATCH', `/api/tickets/${ticketId}`, {
        status: 'closed'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tickets/${ticketId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/tickets'] });
      toast({
        title: 'Ticket completed',
        description: 'The ticket has been marked as completed successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to complete ticket. Please try again.',
        variant: 'destructive',
      });
    },
  });

  return (
    <Button 
      onClick={() => completeTicketMutation.mutate()}
      disabled={disabled || completeTicketMutation.isPending}
      className="w-full"
    >
      {completeTicketMutation.isPending ? 'Completing...' : 'Mark Ticket Complete'}
    </Button>
  );
}