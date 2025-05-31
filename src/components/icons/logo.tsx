import type { SVGProps } from 'react';
import { MessageSquareText } from 'lucide-react'; // Using as a placeholder for the complex isotipo

export function Logo(props: SVGProps<SVGSVGElement> & { collapsed?: boolean }) {
  const { collapsed, ...rest } = props;
  if (collapsed) {
    // Using a simple icon for collapsed state, actual Skailan isotipo would be a complex SVG
    return <MessageSquareText className="h-7 w-7 text-primary" {...rest} />;
  }
  return (
    <div className="flex items-center gap-2" {...rest}>
      {/* Placeholder for actual Skailan isotipo SVG */}
      <MessageSquareText className="h-8 w-8 text-primary" />
      <span className="text-2xl font-bold text-primary whitespace-nowrap font-display">Skailan</span>
    </div>
  );
}
