import { topicTabDefinitions, type TopicTabKey } from "@cnode/shared";

type TopicTabPresentation = {
  title?: string;
  description: string;
  details: string;
};

export const defaultTopicTabLabels = Object.fromEntries(
  topicTabDefinitions.map(({ key, label }) => [key, label]),
) as Record<TopicTabKey, string>;

export const topicTabPresentation: Record<TopicTabKey, TopicTabPresentation> = {
  share: {
    description: "分享 Node.js 开发经验、技术文章和实践总结。",
    details: "请说明背景、方法和结论，并为引用内容注明来源。",
  },
  ask: {
    description: "提出开发中遇到的具体问题，向社区寻求帮助。",
    details: "请提供运行环境、复现步骤、期望结果和实际错误。",
  },
  tech: {
    description: "讨论 Node.js、JavaScript 框架、工具链和工程实践。",
    details: "内容应具有明确技术主题，避免只有链接或缺少上下文。",
  },
  ai: {
    description: "交流 AI 编程、Agent、模型应用和开发工具。",
    details: "鼓励真实项目与使用经验，禁止批量发布低质量生成内容。",
  },
  ideas: {
    description: "分享产品想法、独立开发、开源项目和创作成果。",
    details: "展示自己的项目或商业产品时，必须披露与项目的关系。",
  },
  career: {
    description: "讨论职业发展、管理、转型、远程工作和行业变化。",
    details: "具体岗位必须发布到招聘分类，不得借职场话题绕过招聘规则。",
  },
  life: {
    description: "记录开发者的生活、城市、家庭、兴趣和长期经历。",
    details: "保持友善和真实，禁止人身攻击、引战和公开他人隐私。",
  },
  event: {
    description: "发布与技术和开源社区有关的沙龙、会议、CFP 与直播。",
    details: "正文必须说明时间、地点或线上方式、组织方、报名信息和商业关系。",
  },
  job: {
    description: "发布与 Node.js 和相关工程岗位有关的招聘信息。",
    details: "必须披露公司、岗位、地点、工作方式、联系方式及代理招聘身份。",
  },
  dev: {
    title: "开发使用",
    description: "用于 API、客户端和功能联调相关内容。",
    details: "这里的话题不会出现在普通社区内容列表中。",
  },
  good: {
    description: "由社区管理团队选出的高质量原创内容和深入讨论。",
    details: "精华由内容质量决定，不能在发帖时直接选择。",
  },
};

export function getTopicTabPresentation(tab?: string | null) {
  if (!tab || !(tab in topicTabPresentation)) return null;
  return topicTabPresentation[tab as TopicTabKey];
}

export function getDefaultTopicTabLabel(tab?: string | null) {
  if (tab === "all") return "全部";
  return defaultTopicTabLabels[tab as TopicTabKey] || tab || "社区";
}
