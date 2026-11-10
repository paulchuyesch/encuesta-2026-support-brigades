import { SurveyDashboard } from '@/components/SurveyDashboard';
import { getBaselineDataset } from '@/lib/baseline';

export default function HomePage() {
  const baselineDataset = getBaselineDataset();
  return <SurveyDashboard initialDataset={baselineDataset} />;
}
