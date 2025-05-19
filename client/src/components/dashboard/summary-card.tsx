import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { ReactNode } from "react";

interface SummaryCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: ReactNode;
  iconBgColor?: string;
  iconColor?: string;
  link?: {
    href: string;
    label: string;
  };
  className?: string;
}

export function SummaryCard({
  title,
  value,
  change,
  icon,
  iconBgColor = "bg-primary/10",
  iconColor = "text-primary",
  link,
  className,
}: SummaryCardProps) {
  const isPositiveChange = change && change > 0;
  
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className={cn("flex-shrink-0 rounded-md p-3", iconBgColor)}>
            <div className={cn("h-6 w-6", iconColor)}>{icon}</div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline">
              <div className="text-2xl font-semibold">{value}</div>
              {change !== undefined && (
                <div 
                  className={cn(
                    "ml-2 flex items-baseline text-sm font-semibold",
                    isPositiveChange ? "text-secondary" : "text-destructive"
                  )}
                >
                  {isPositiveChange ? (
                    <ArrowUpIcon className="self-center flex-shrink-0 h-5 w-5" />
                  ) : (
                    <ArrowDownIcon className="self-center flex-shrink-0 h-5 w-5" />
                  )}
                  <span className="ml-1">{Math.abs(change)}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
      {link && (
        <CardFooter className="bg-muted px-6 py-3">
          <a href={link.href} className="text-sm font-medium text-primary hover:text-primary/80">
            {link.label}
          </a>
        </CardFooter>
      )}
    </Card>
  );
}
