import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import supabase from '@/utils/supabase';

interface CreateOrganizationFormProps {
  onOrganizationCreated: (organization: any) => void;
  onClose?: () => void;
}

const CreateOrganizationForm = ({ onOrganizationCreated, onClose }: CreateOrganizationFormProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createOrganization = async () => {
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter an organization name.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Creating organization:', { name, description });
      
      const { data, error } = await supabase
        .from('organizations')
        .insert({
          name: name.trim(),
          description: description.trim() || null
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating organization:', error);
        throw error;
      }

      console.log('Organization created:', data);

      toast({
        title: "Organization created",
        description: `Organization "${data.name}" has been created successfully.`,
      });

      onOrganizationCreated(data);
      setName('');
      setDescription('');
      
      if (onClose) {
        onClose();
      }
    } catch (error: any) {
      console.error('Failed to create organization:', error);
      toast({
        title: "Failed to create organization",
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
        <Label htmlFor="org-name">Organization Name *</Label>
        <Input 
          id="org-name" 
          placeholder="Enter organization name" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && createOrganization()}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="org-description">Description (Optional)</Label>
        <Textarea 
          id="org-description" 
          placeholder="Enter organization description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      <Button 
        onClick={createOrganization} 
        disabled={loading || !name.trim()}
        className="w-full"
      >
        {loading ? "Creating Organization..." : "Create Organization"}
      </Button>

      <div className="text-xs text-muted-foreground">
        <p>• Organization name is required</p>
        <p>• You will become the admin of this organization</p>
        <p>• You can invite users to join this organization</p>
      </div>
    </div>
  );
};

export default CreateOrganizationForm;
