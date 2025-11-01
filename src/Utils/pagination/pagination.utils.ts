export const pagination = ({ page = 1, limit = 10 }) => {
  if (Number(page) < 1) page = 1;
  if (Number(limit) < 1) limit = 1;

  const skip = (Number(page) - 1) * Number(limit);
  return {
    limit,
    skip,
  };
};
