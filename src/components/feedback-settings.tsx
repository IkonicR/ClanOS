import { useState, useEffect, useCallback } from 'react';
import FeatureRequestForm from '@/components/feature-request-form';
import { Loader, MessageSquare, Plus, CheckCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface FeatureRequest {
    id: number;
    title: string;
    description: string;
    category: string;
    created_at: string;
}

const useFeatureRequests = (email: string) => {
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
    const { requests, loading, error, setRequests } = useFeatureRequests(email);
    const [showForm, setShowForm] = useState(true);

    const handleSuccess = (newRequest: FeatureRequest) => {
        setRequests(prev => [newRequest, ...prev]);
        setShowForm(false);
        setTimeout(() => setShowForm(true), 2000); // Re-show form after a delay
    };

    if (loading) {
        return <div className="flex items-center justify-center h-48"><Loader className="animate-spin" /></div>;
    }

    if (error) {
        return <div className="text-destructive">{error}</div>;
    }

    return (
        <div className="space-y-8">
            {showForm ? (
                <FeatureRequestForm email={email} onSuccess={handleSuccess} />
            ) : (
                <div className="flex flex-col items-center justify-center text-center p-8 bg-secondary rounded-lg border border-dashed">
                    <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
                    <h3 className="text-xl font-bold">Thank you for your feedback!</h3>
                    <p className="text-muted-foreground">Want to submit another idea? The form will reappear shortly.</p>
                </div>
            )}

            <div>
                <h3 className="text-2xl font-bold tracking-tight flex items-center mb-4">
                    <MessageSquare className="w-6 h-6 mr-3" />
                    Your Submitted Ideas
                </h3>
                <div className="space-y-4">
                    {requests.length > 0 ? (
                        requests.map(req => (
                            <div key={req.id} className="p-4 bg-secondary rounded-lg border">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-bold">{req.title}</h4>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                                        {formatDistanceToNow(new Date(req.created_at), { addSuffix: true })}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">{req.description}</p>
                                <span className="text-xs font-semibold uppercase bg-primary/10 text-primary px-2 py-1 rounded-full mt-3 inline-block">
                                    {req.category}
                                </span>
                            </div>
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