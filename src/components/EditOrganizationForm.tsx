import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import supabase from '@/utils/supabase';

interface EditOrganizationFormProps {
  organization: {
    id: string;
    name: string;
    description?: string;
  };
  onOrganizationUpdated: () => void;
  onClose?: () => void;
}

const EditOrganizationForm = ({ organization, onOrganizationUpdated, onClose }: EditOrganizationFormProps) => {
  const [name, setName] = useState(organization.name || '');
  const [description, setDescription] = useState(organization.description || '');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const updateOrganization = async () => {
    setLoading(true);
    try {
      console.log('Updating organization:', { id: organization.id, name, description });
      
      const { data, error } = await supabase
        .from('organizations')
        .update({
          name: name.trim(),
          description: description.trim() || null
        })
        .eq('id', organization.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating organization:', error);
        throw error;
      }

      console.log('Organization updated:', data);

      toast({
        title: "Organization updated",
        description: `Organization "${name}" has been updated successfully.`,
      });

      onOrganizationUpdated();
      
      if (onClose) {
        onClose();
      }
    } catch (error: any) {
      console.error('Failed to update organization:', error);
      toast({
        title: "Failed to update organization",
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
        <Label htmlFor="org-name">Organization Name</Label>
        <Input 
          id="org-name" 
          placeholder="Enter organization name" 
          value={name}
          onChange={(e) => setName(e.target.value)}
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
        onClick={updateOrganization} 
        disabled={loading || !name.trim()}
        className="w-full"
      >
        {loading ? "Updating Organization..." : "Update Organization"}
      </Button>

      <div className="text-xs text-muted-foreground">
        <p>• Update your organization's name and description</p>
        <p>• Changes will be visible to all organization members</p>
        <p>• Description is optional but helps members understand your organization</p>
      </div>
    </div>
  );
};

export default EditOrganizationForm;
