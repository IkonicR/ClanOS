import { useState, useEffect, useCallback } from 'react';
import FeatureRequestForm from '@/components/feature-request-form';
import { Loader, MessageSquare, Plus, CheckCircle, Edit, Trash, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from './ui/button';
import { useToast } from './ui/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface FeatureRequest {
    id: number;
    title: string;
    description: string;
    category: string;
    created_at: string;
}

const useFeatureRequests = () => {
    const [requests, setRequests] = useState<FeatureRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/feature-requests');
            if (!res.ok) throw new Error('Failed to fetch ideas.');
            setRequests(await res.json());
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    return { requests, loading, error, setRequests };
};

export const FeedbackSettings = ({ email }: { email: string }) => {
    const { requests, loading, error, setRequests } = useFeatureRequests();
    const [view, setView] = useState<'list' | 'edit'>('list');
    const [selectedRequest, setSelectedRequest] = useState<FeatureRequest | null>(null);
    const { toast } = useToast();

    const handleEditClick = (request: FeatureRequest) => {
        setSelectedRequest(request);
        setView('edit');
    };

    const handleDelete = async (id: number) => {
        try {
            const res = await fetch('/api/feature-requests', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            if (!res.ok) throw new Error('Failed to delete idea.');
            setRequests(prev => prev.filter(r => r.id !== id));
            toast({ title: 'Success', description: 'Your idea has been deleted.' });
        } catch (err) {
            toast({ title: 'Error', description: err instanceof Error ? err.message : 'Could not delete idea.', variant: 'destructive' });
        }
    };

    const handleUpdateSuccess = (updatedRequest: FeatureRequest) => {
        setRequests(prev => prev.map(r => r.id === updatedRequest.id ? updatedRequest : r));
        setView('list');
        setSelectedRequest(null);
    };
    
    const handleNewSuccess = (newRequest: FeatureRequest) => {
        setRequests(prev => [newRequest, ...prev]);
    }

    if (loading) return <div className="flex items-center justify-center h-48"><Loader className="animate-spin" /></div>;
    if (error) return <div className="text-destructive">{error}</div>;

    if (view === 'edit' && selectedRequest) {
        return <FeatureRequestForm isEditMode request={selectedRequest} email={email} onSuccess={handleUpdateSuccess} onCancel={() => setView('list')} />;
    }

    return (
        <div className="space-y-8">
            <FeatureRequestForm email={email} onSuccess={handleNewSuccess} />
            
            <div className="mt-12">
                <h3 className="text-2xl font-bold tracking-tight flex items-center mb-4">
                    <MessageSquare className="w-6 h-6 mr-3" />
                    Your Submitted Ideas
                </h3>
                <div className="space-y-4">
                    {requests.length > 0 ? (
                        requests.map(req => (
                            <RequestItem key={req.id} request={req} onEdit={handleEditClick} onDelete={handleDelete} />
                        ))
                    ) : (
                        <div className="text-center py-8 px-4 border border-dashed rounded-lg">
                            <p className="text-muted-foreground">You haven&apos;t submitted any ideas yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const RequestItem = ({ request, onEdit, onDelete }: { request: FeatureRequest, onEdit: (req: FeatureRequest) => void, onDelete: (id: number) => void }) => {
    const [showConfirm, setShowConfirm] = useState(false);
    return (
        <>
            <div className="p-4 bg-secondary rounded-lg border flex justify-between items-start gap-4">
                <div className="flex-grow">
                    <div className="flex justify-between items-start">
                        <h4 className="font-bold">{request.title}</h4>
                        <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:block">
                            {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                        </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{request.description}</p>
                    <span className="text-xs font-semibold uppercase bg-primary/10 text-primary px-2 py-1 rounded-full mt-3 inline-block">
                        {request.category}
                    </span>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(request)}>
                        <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setShowConfirm(true)}>
                        <Trash className="w-4 h-4 text-destructive" />
                    </Button>
                </div>
            </div>
            <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your feedback.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(request.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
} 