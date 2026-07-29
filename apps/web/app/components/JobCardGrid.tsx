import { Link } from "react-router";
import { Card, CardContent } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { getAvatarFallback } from "~/lib/brand";
import { MapPin, Wifi, DollarSign, Briefcase, MessageSquare, Eye } from "lucide-react";

export interface JobCardData {
  id: string;
  title: string;
  excerpt: string;
  company: string;
  company_logo: string | null;
  position: string;
  location: string;
  remote: string;
  salary_min: number | null;
  salary_max: number | null;
  experience: string | null;
  tech_tags: string[];
  contact: string;
  create_at: string;
  reply_count: number;
  visit_count: number;
}

const REMOTE_LABEL: Record<string, string> = {
  "on-site": "坐班",
  hybrid: "混合",
  remote: "远程",
};

function formatSalary(min?: number | null, max?: number | null): string {
  const hasMin = min !== null && min !== undefined;
  const hasMax = max !== null && max !== undefined;
  if (!hasMin && !hasMax) return "面议";
  if (hasMin && hasMax) return `${min}-${max}K`;
  if (hasMin) return `${min}K+`;
  return `≤${max}K`;
}

export function JobCardGrid({ jobs }: { jobs: JobCardData[] }) {
  if (jobs.length === 0) {
    return <div className="py-12 text-center text-muted-foreground">暂无招聘信息</div>;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {jobs.map((job) => (
        <JobCardItem key={job.id} job={job} />
      ))}
    </div>
  );
}

function JobCardItem({ job }: { job: JobCardData }) {
  return (
    <Link to={`/topic/${job.id}`} className="block">
      <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
        <CardContent className="space-y-3 p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10 shrink-0 rounded-lg border border-border">
              {job.company_logo ? (
                <AvatarImage src={job.company_logo} alt={job.company} />
              ) : (
                <AvatarFallback className="rounded-lg">
                  {getAvatarFallback(job.company)}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {job.company}
              </p>
              <p className="truncate text-xs text-muted-foreground">{job.position}</p>
            </div>
          </div>

          <h3 className="line-clamp-2 text-sm font-medium leading-5 text-foreground">
            {job.title}
          </h3>

          <div className="flex flex-wrap gap-1.5">
            <Badge icon={MapPin} text={job.location} />
            <Badge icon={Wifi} text={REMOTE_LABEL[job.remote] || job.remote} />
            <Badge icon={DollarSign} text={formatSalary(job.salary_min, job.salary_max)} />
            {job.experience && <Badge icon={Briefcase} text={job.experience} />}
          </div>

          {job.tech_tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {job.tech_tags.slice(0, 5).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <p className="line-clamp-2 text-xs leading-4 text-muted-foreground">
            {job.excerpt}
          </p>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" /> {job.reply_count}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" /> {job.visit_count}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function Badge({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 rounded-md bg-cnode-soft px-1.5 py-0.5 text-xs text-cnode-ink">
      <Icon className="h-3 w-3" />
      {text}
    </span>
  );
}
