import type { SVGProps } from 'react';
import { MessageSquareText } from 'lucide-react';

export function Logo(props: SVGProps<SVGSVGElement> & { collapsed?: boolean }) {
  const { collapsed, ...rest } = props;
  if (collapsed) {
    return <MessageSquareText className="h-7 w-7 text-primary" {...rest} />;
  }
  return (
    <div className="flex items-center gap-2" {...rest}>
      <MessageSquareText className="h-8 w-8 text-primary" />
      <span className="text-2xl font-bold text-primary whitespace-nowrap">Conecta Hub</span>
    </div>
  );
}
