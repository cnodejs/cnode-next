export type TopicActionPresentation = {
  isAuthor: boolean;
  showReport: boolean;
  showDirectEdit: boolean;
  showManagement: boolean;
  showManagementEdit: boolean;
  showPin: boolean;
  showHighlight: boolean;
  showDelete: boolean;
};

export function getTopicActionPresentation(
  topic: { author?: { loginname?: string } } | null | undefined,
  currentUser:
    | {
        loginname?: string;
        is_admin?: boolean;
        is_mod?: boolean;
      }
    | null
    | undefined,
): TopicActionPresentation {
  const authenticated = !!currentUser;
  const isAuthor = authenticated && currentUser.loginname === topic?.author?.loginname;
  const isAdmin = !!currentUser?.is_admin;
  const canGovern = isAdmin || !!currentUser?.is_mod;

  return {
    isAuthor,
    showReport: authenticated && !isAuthor && !canGovern,
    showDirectEdit: isAuthor,
    showManagement: canGovern,
    showManagementEdit: isAdmin && !isAuthor,
    showPin: canGovern,
    showHighlight: canGovern,
    showDelete: canGovern,
  };
}
