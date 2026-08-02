import { Layout } from "~/components/Layout";
import { JobFilterBar } from "~/components/JobFilterBar";
import { JobCardGrid, type JobCardData } from "~/components/JobCardGrid";
import { Pagination } from "~/components/Pagination";
import { apiFetch } from "~/lib/api-client";

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
  const searchParams = Object.fromEntries(
    Array.from(url.searchParams.entries()).filter(([key]) => key !== "page"),
  );

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
    searchParams,
  };
}

export default function ZoneJobs({ loaderData }: { loaderData: any }) {
  const { jobs, total, page, limit, locations, searchParams } = loaderData;

  return (
    <Layout>
      <div className="space-y-6">
        <section className="rounded-3xl bg-cnode-ink p-6 text-white shadow-brand sm:p-8">
          <p className="text-sm font-medium text-cnode-green">JOBS</p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">招聘专区</h1>
              <p className="mt-2 text-sm text-white/70">发现聚焦 Node.js 与现代 Web 技术栈的工作机会。</p>
            </div>
            <p className="text-sm text-white/60">当前 {total} 个职位</p>
          </div>
        </section>
        <div className="space-y-5">
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
      </div>
    </Layout>
  );
}
