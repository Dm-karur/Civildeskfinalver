import { Construction, AlertTriangle, ArrowLeft } from 'lucide-react';
import { PageHeader } from '../../../components/layout/PageHeader';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button } from '../../../components/ui/Button';

export function UnderConstructionPage({ title, moduleName, description }) {
  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Masters' },
    { label: title },
  ];

  return (
    <PageContainer>
      <PageHeader title={title} breadcrumbs={breadcrumbs} />

      <div className="flex flex-col items-center justify-center min-h-[480px] p-6 text-center bg-surface border border-border rounded-xl shadow-sm max-w-2xl mx-auto my-8">
        <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mb-6">
          <Construction className="w-8 h-8 text-warning animate-pulse" />
        </div>

        <h1 className="text-[20px] font-bold text-text-primary mb-2">Module Under Construction</h1>
        <p className="text-[14px] font-semibold text-text-secondary mb-4">
          Feature: <span className="font-mono text-primary font-bold">{moduleName}</span>
        </p>

        <p className="text-[12px] text-text-muted leading-relaxed max-w-md mb-6">
          {description || "This master data screen is currently offline because the corresponding database tables, relational schemas, and REST API controllers do not exist on the backend application server."}
        </p>

        <div className="border border-border/80 bg-surface-muted/50 rounded-lg p-4 mb-6 text-left w-full font-mono text-[11px] text-text-secondary leading-normal">
          <div className="font-bold text-text-primary mb-1 border-b border-border/60 pb-1 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-warning" /> Technical Integration Status:
          </div>
          <div>• Schema status: MISSING</div>
          <div>• Backend model: NOT IMPLEMENTED</div>
          <div>• REST endpoint: None registered in Routes.php</div>
          <div className="mt-2 text-text-muted">Contact the API development team to deploy the database migrations.</div>
        </div>

        <Button
          variant="outline"
          className="h-9 px-4 text-[13px]"
          onClick={() => window.history.back()}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
        >
          Go Back
        </Button>
      </div>
    </PageContainer>
  );
}
