/**
 * Automation Configuration Page
 * 
 * WO-126: Main page for automation configuration wizard
 */

import { useRouter } from 'next/router';
import AutomationConfigurationWizard from '../../../components/automation/AutomationConfigurationWizard';

export default function AutomationConfigurationPage() {
  const router = useRouter();
  const { projectId, contractId } = router.query;

  const handleComplete = () => {
    router.push(`/escrow/releases/monitor?contractId=${contractId}`);
  };

  if (!projectId || !contractId) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <AutomationConfigurationWizard
        projectId={projectId as string}
        contractId={contractId as string}
        onComplete={handleComplete}
      />
    </div>
  );
}



