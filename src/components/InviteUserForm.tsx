import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import supabase from '@/utils/supabase';

interface InviteUserFormProps {
  organizationId?: string;
  departments?: Array<{ id: string; name: string }>;
  onInviteSent: () => void;
  onClose?: () => void;
}

const InviteUserForm = ({ organizationId, departments = [], onInviteSent, onClose }: InviteUserFormProps) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [userFound, setUserFound] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  // Department assignment is not supported at invite time because join_requests has no department_id
  const { toast } = useToast();

  console.log('InviteUserForm props:', { organizationId, onInviteSent, onClose });

  const searchUser = async () => {
    if (!email) return;
    
    setSearching(true);
    try {
      const { data: user, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, organization_id')
        .eq('email', email)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          toast({
            title: "User not found",
            description: "No user found with this email address.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        setUserFound(user);
        
        if (user.organization_id) {
          toast({
            title: "User already in organization",
            description: "This user is already part of an organization.",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      toast({
        title: "Search failed",
        description: error.message || "Failed to search for user.",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const sendInvitation = async () => {
    if (!userFound || !organizationId) {
      console.error('Missing data:', { userFound, organizationId });
      return;
    }
    
    console.log('Sending invitation for:', { userFound, organizationId });
    setLoading(true);
    try {
      // Check the most recent invitation (if any) for this user/org
      const { data: existingRequests, error: checkError } = await supabase
        .from('join_requests')
        .select('id, status')
        .eq('user_id', userFound.id)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (checkError) {
        console.error('Error checking existing request:', checkError);
      }

      const existingRequest = existingRequests && existingRequests[0] ? existingRequests[0] : null;

      if (existingRequest) {
        if (existingRequest.status === 'pending') {
          toast({
            title: "Invitation already sent",
            description: "An invitation has already been sent to this user.",
            variant: "destructive",
          });
          return;
        } else {
          // Re-send by updating the last request back to pending
          const { error: updateErr } = await supabase
            .from('join_requests')
            .update({
              status: 'pending',
              created_at: new Date().toISOString(),
            })
            .eq('id', existingRequest.id);
          if (updateErr) {
            console.error('Error updating existing request:', updateErr);
          } else {
            toast({
              title: "Invitation re-sent",
              description: `Re-sent invitation to ${userFound.full_name || userFound.email}`,
            });
            onInviteSent();
            setEmail('');
            setUserFound(null);
            if (onClose) onClose();
            return;
          }
        }
      }

      console.log('Creating join request...');
      // Create join request
      const { data, error } = await supabase
        .from('join_requests')
        .insert({
          user_id: userFound.id,
          organization_id: organizationId,
          status: 'pending'
        })
        .select();

      if (error) {
        console.error('Error creating join request:', error);
        throw error;
      }

      console.log('Join request created:', data);

      toast({
        title: "Invitation sent",
        description: `Invitation sent to ${userFound.full_name || userFound.email}`,
      });

      onInviteSent();
      setEmail('');
      setUserFound(null);
      if (onClose) {
        onClose();
      }
    } catch (error: any) {
      console.error('Failed to send invitation:', error);
      toast({
        title: "Failed to send invitation",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="invite-email">User Email</Label>
        <div className="flex gap-2">
          <Input 
            id="invite-email" 
            placeholder="user@example.com" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchUser()}
          />
          <Button 
            onClick={searchUser} 
            disabled={searching || !email}
            variant="outline"
          >
            {searching ? "Searching..." : "Search"}
          </Button>
        </div>
      </div>

      {userFound && (
        <div className="p-4 border rounded-lg bg-muted/50">
          <h4 className="font-medium">User Found:</h4>
          <p className="text-sm text-muted-foreground">
            <strong>Name:</strong> {userFound.full_name || 'Not provided'}<br/>
            <strong>Email:</strong> {userFound.email}<br/>
            <strong>Current Organization:</strong> {userFound.organization_id ? 'Already in organization' : 'No organization'}
          </p>
          
          {!userFound.organization_id && (
            <div className="space-y-4 mt-4">
              <Button 
                onClick={() => {
                  console.log('Send invitation button clicked');
                  sendInvitation();
                }}
                disabled={loading}
                className="w-full"
              >
                {loading ? "Sending Invitation..." : "Send Invitation"}
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        <p>• Enter the email address of the user you want to invite</p>
        <p>• The user will receive the invitation in their dashboard</p>
        <p>• They can accept or decline the invitation</p>
        <p className="mt-2 text-blue-600">Debug: Organization ID = {organizationId || 'Not provided'}</p>
      </div>
    </div>
  );
};

export default InviteUserForm;
