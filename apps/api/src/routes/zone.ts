import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { z } from "zod";
import { jobMetaQueries, zoneQueries, tabQueries } from "../lib/db";
import { excerptMarkdown } from "../lib/format";
import { tabSchema, zoneSchema } from "@cnode/shared";

const zone = new OpenAPIHono();

const REMOTE_OPTIONS = ["on-site", "hybrid", "remote"];

const jobCardSchema = z.object({
  id: z.string(),
  title: z.string(),
  excerpt: z.string(),
  company: z.string(),
  company_logo: z.string().nullable(),
  position: z.string(),
  location: z.string(),
  remote: z.string(),
  salary_min: z.number().nullable(),
  salary_max: z.number().nullable(),
  experience: z.string().nullable(),
  tech_tags: z.array(z.string()),
  contact: z.string(),
  create_at: z.string(),
  reply_count: z.number(),
  visit_count: z.number(),
});

const listJobsRoute = createRoute({
  method: "get",
  path: "/zone/jobs",
  tags: ["zones"],
  summary: "招聘专区列表",
  request: {
    query: z.object({
      page: z.string().optional(),
      limit: z.string().optional(),
      location: z.string().optional(),
      remote: z.string().optional(),
      salary_min: z.string().optional(),
      tags: z.string().optional(),
    }),
  },
  responses: {
    200: {
      description: "招聘卡片列表",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            data: z.array(jobCardSchema),
            total: z.number(),
          }),
        },
      },
    },
  },
});

zone.openapi(listJobsRoute, async (c) => {
  const q = c.req.valid("query");
  const page = Math.max(1, Number(q.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(q.limit) || 20));
  const offset = (page - 1) * limit;

  const filterParams = {
    location: q.location || undefined,
    remote: q.remote || undefined,
    salaryMin: q.salary_min ? Number(q.salary_min) : undefined,
    tags: q.tags ? q.tags.split(",").filter(Boolean) : undefined,
  };

  const rows = await jobMetaQueries.listWithFilters({
    limit,
    offset,
    ...filterParams,
  });
  const total = await jobMetaQueries.countWithFilters(filterParams);

  const data = rows.map((r: any) => ({
    id: String(r.id),
    title: r.title || "",
    excerpt: excerptMarkdown(r.content || "", 120),
    company: r.company,
    company_logo: r.companyLogo,
    position: r.position,
    location: r.location,
    remote: r.remote,
    salary_min: r.salaryMin,
    salary_max: r.salaryMax,
    experience: r.experience,
    tech_tags: r.techTags || [],
    contact: r.contact,
    create_at: r.createAt,
    reply_count: r.replyCount || 0,
    visit_count: r.visitCount || 0,
  }));

  return c.json({ success: true as const, data, total }, 200);
});

const facetsRoute = createRoute({
  method: "get",
  path: "/zone/jobs/facets",
  tags: ["zones"],
  summary: "招聘专区 facet 聚合",
  responses: {
    200: {
      description: "facet 值",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            data: z.object({
              locations: z.array(z.string()),
              remote_options: z.array(z.string()),
            }),
          }),
        },
      },
    },
  },
});

zone.openapi(facetsRoute, async (c) => {
  const locations = await jobMetaQueries.facetLocations();
  return c.json(
    {
      success: true as const,
      data: { locations, remote_options: REMOTE_OPTIONS },
    },
    200,
  );
});

const listZonesRoute = createRoute({
  method: "get",
  path: "/zones",
  tags: ["zones"],
  summary: "公开专区列表（仅 visible）",
  responses: {
    200: {
      description: "可见专区",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            data: z.array(zoneSchema),
          }),
        },
      },
    },
  },
});

zone.openapi(listZonesRoute, async (c) => {
  const rows = await zoneQueries.listVisible();
  const data = rows.map((r: any) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description,
    icon: r.icon,
    visible: !!r.visible,
    sort_order: r.sortOrder || 0,
  }));
  return c.json({ success: true as const, data }, 200);
});

const listTabsRoute = createRoute({
  method: "get",
  path: "/tabs",
  tags: ["zones"],
  summary: "社区 tab 列表",
  responses: {
    200: {
      description: "所有 tabs",
      content: {
        "application/json": {
          schema: z.object({
            success: z.literal(true),
            data: z.array(tabSchema),
          }),
        },
      },
    },
  },
});

zone.openapi(listTabsRoute, async (c) => {
  const rows = await tabQueries.listAll();
  const data = rows.map((r: any) => ({
    id: r.id,
    key: r.key,
    label: r.label,
    visible: !!r.visible,
    sort_order: r.sortOrder || 0,
    scope: r.scope || "public",
  }));
  return c.json({ success: true as const, data }, 200);
});

export { zone as zoneRoutes };
