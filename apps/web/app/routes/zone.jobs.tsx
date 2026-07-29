import { Layout } from "~/components/Layout";
import { JobFilterBar } from "~/components/JobFilterBar";
import { JobCardGrid, type JobCardData } from "~/components/JobCardGrid";
import { Pagination } from "~/components/Pagination";
import { apiFetch } from "~/lib/api-client";
import { PageContainer } from "~/components/PageShell";

export function meta() {
  return [
    { title: "招聘专区 · CNode" },
    { name: "description", content: "CNode 招聘专区 — Node.js 招聘信息" },
  ];
}

export async function loader({ request }: { request: Request }) {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page")) || 1;
  const limit = 20;

  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  const location = url.searchParams.get("location");
  const remote = url.searchParams.get("remote");
  const salaryMin = url.searchParams.get("salary_min");
  const tags = url.searchParams.get("tags");
  if (location) params.set("location", location);
  if (remote) params.set("remote", remote);
  if (salaryMin) params.set("salary_min", salaryMin);
  if (tags) params.set("tags", tags);

  const cookie = request.headers.get("cookie") || "";

  const [jobsRes, facetsRes] = await Promise.all([
    apiFetch<{ success: boolean; data: JobCardData[]; total: number }>(
      `/api/v1/zone/jobs?${params.toString()}`,
      { headers: { cookie } },
    ),
    apiFetch<{ success: boolean; data: { locations: string[]; remote_options: string[] } }>(
      "/api/v1/zone/jobs/facets",
      { headers: { cookie } },
    ),
  ]);

  return {
    jobs: jobsRes.success ? jobsRes.data : [],
    total: jobsRes.success ? jobsRes.total : 0,
    page,
    limit,
    locations: facetsRes.success ? facetsRes.data.locations : [],
  };
}

export default function ZoneJobs({ loaderData }: { loaderData: any }) {
  const { jobs, total, page, limit, locations } = loaderData;
  const searchParams: Record<string, string> = {};
  if (typeof window !== "undefined") {
    const url = new URL(window.location.href);
    for (const [k, v] of url.searchParams.entries()) {
      if (k !== "page") searchParams[k] = v;
    }
  }

  return (
    <Layout>
      <PageContainer className="py-6">
        <div className="mb-4">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">招聘专区</h1>
          <p className="mt-1 text-sm text-muted-foreground">Node.js 招聘信息</p>
        </div>
        <div className="space-y-4">
          <JobFilterBar locations={locations} />
          <JobCardGrid jobs={jobs} />
        </div>
        <div className="mt-6">
          <Pagination
            page={page}
            total={total}
            limit={limit}
            basePath="/zone/jobs"
            searchParams={searchParams}
          />
        </div>
      </PageContainer>
    </Layout>
  );
}
