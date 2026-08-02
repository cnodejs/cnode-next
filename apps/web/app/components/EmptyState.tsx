import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle } from "./ui/empty";

function EmptyState({
  message,
  title = "暂无内容",
  action,
}: {
  message: string;
  title?: string;
  action?: React.ReactNode;
}) {
  return (
    <Empty className="my-4 bg-cnode-soft/40">
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{message}</EmptyDescription>
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  );
}

export { EmptyState };
export default EmptyState;
