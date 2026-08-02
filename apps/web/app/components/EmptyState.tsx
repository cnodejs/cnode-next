import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "./ui/empty";

function EmptyState({ message }: { message: string }) {
  return (
    <Empty className="my-4 border-cnode-green/30 bg-cnode-soft/40">
      <EmptyHeader>
        <EmptyTitle>暂无内容</EmptyTitle>
        <EmptyDescription>{message}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

export { EmptyState };
export default EmptyState;
