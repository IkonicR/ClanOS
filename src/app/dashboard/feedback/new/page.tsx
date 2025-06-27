'use client';

import { useRouter } from 'next/navigation';
import FeatureRequestForm from '@/components/feature-request-form';
import { useUser } from '@/lib/hooks/useUser';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader } from 'lucide-react';

export default function NewFeedbackPage() {
    const { user, loading } = useUser();
    const router = useRouter();

    const handleSuccess = () => {
        router.push('/dashboard/feedback');
    };

    const handleCancel = () => {
        router.back();
    };

    if (loading) {
        return <div className="flex items-center justify-center h-48"><Loader className="animate-spin" /></div>;
    }

    return (
        <div className="container max-w-2xl mx-auto py-8">
            <Button variant="ghost" onClick={handleCancel} className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Feedback
            </Button>
            {user ? (
                <FeatureRequestForm email={user.email!} onSuccess={handleSuccess} onCancel={handleCancel} />
            ) : (
                <div>You must be logged in to submit feedback.</div>
            )}
        </div>
    );
} 