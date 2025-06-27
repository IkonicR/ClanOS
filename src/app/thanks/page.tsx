import { Suspense } from 'react';
import FeatureRequestForm from './feature-request-form';

export default function ThanksPage() {
  return (
    <Suspense>
      <FeatureRequestForm />
    </Suspense>
  );
} 