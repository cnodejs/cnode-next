function EmptyState({ message }: { message: string }) {
  return <div className="py-12 text-center text-muted-foreground">{message}</div>;
}

export { EmptyState };
export default EmptyState;
